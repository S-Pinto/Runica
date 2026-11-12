// Campagne condivise (Firestore) e campagne locali storiche (localStorage).
// Solo I/O: codici, ruoli e riepiloghi sono calcolati in features/character/rules/campaign.ts.
import {
    collection, doc, getDoc, getDocs, onSnapshot, query, where, writeBatch, setDoc, deleteDoc, arrayUnion, arrayRemove,
    type DocumentData, type DocumentSnapshot,
} from 'firebase/firestore';
import type {
    ICampaign, ICampaignMember, ICharacter, ILocalCampaign, ISharedCharacter,
} from '../features/character/characterTypes';
import { getFirebase } from '../lib/getFirebase';
import { settleOrQueue } from '../lib/async';
import {
    generateInviteCode, normalizeInviteCode, isValidInviteCode, buildSharedCharacter,
} from '../features/character/rules/campaign';
import { cleanUndefinedValues } from '../features/character/rules/characterData';
import { copyPortraitToCampaign, deleteCampaignPortrait } from './storageService';

// ---------- utilità ----------

export interface CampaignUser {
    uid: string;
    displayName: string;
    photoURL?: string | null;
}

export type CampaignErrorCode = 'invalid-code' | 'already-member' | 'code-collision';

export class CampaignError extends Error {
    constructor(public readonly code: CampaignErrorCode, message: string) {
        super(message);
        this.name = 'CampaignError';
    }
}

const WRITE_TIMEOUT_MS = 6000;
const queueWrite = <T>(write: Promise<T>) =>
    settleOrQueue(write, WRITE_TIMEOUT_MS, (error) => console.error('Scrittura campagna fallita dopo il timeout', error));

/** Intero uniforme in [0, max) senza bias, da `crypto.getRandomValues`. */
const secureRandomInt = (max: number): number => {
    const limit = Math.floor(0x100000000 / max) * max;
    const buffer = new Uint32Array(1);
    do {
        crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % max;
};

const newInviteCode = () => generateInviteCode(secureRandomInt);

const newCampaignId = () => doc(collection(getFirebase().db, 'campaigns')).id;

const campaignRef = (id: string) => doc(getFirebase().db, 'campaigns', id);
const memberRef = (campaignId: string, uid: string) => doc(getFirebase().db, 'campaigns', campaignId, 'members', uid);
const sharedRef = (campaignId: string, characterId: string) =>
    doc(getFirebase().db, 'campaigns', campaignId, 'sharedCharacters', characterId);
const inviteRef = (code: string) => doc(getFirebase().db, 'campaignInvites', code);

const toCampaign = (snap: DocumentSnapshot<DocumentData>): ICampaign => ({ ...(snap.data() as Omit<ICampaign, 'id'>), id: snap.id });

// ---------- lettura in tempo reale ----------

type Unsubscribe = () => void;

export const onCampaignsSnapshot = (
    uid: string,
    callback: (campaigns: ICampaign[]) => void,
    onError?: (error: unknown) => void,
): Unsubscribe => {
    const { db } = getFirebase();
    return onSnapshot(
        query(collection(db, 'campaigns'), where('memberUids', 'array-contains', uid)),
        (snapshot) => callback(snapshot.docs.map(toCampaign)),
        (error) => {
            console.error('Campaign snapshot listener error', error);
            onError?.(error);
        },
    );
};

export const onCampaignMembersSnapshot = (
    campaignId: string,
    callback: (members: ICampaignMember[]) => void,
    onError?: (error: unknown) => void,
): Unsubscribe =>
    onSnapshot(
        collection(getFirebase().db, 'campaigns', campaignId, 'members'),
        (snapshot) => callback(snapshot.docs.map((d) => ({ ...(d.data() as Omit<ICampaignMember, 'uid'>), uid: d.id }))),
        (error) => onError?.(error),
    );

export const onSharedCharactersSnapshot = (
    campaignId: string,
    callback: (characters: ISharedCharacter[]) => void,
    onError?: (error: unknown) => void,
): Unsubscribe =>
    onSnapshot(
        collection(getFirebase().db, 'campaigns', campaignId, 'sharedCharacters'),
        (snapshot) => callback(snapshot.docs.map((d) => ({ ...(d.data() as Omit<ISharedCharacter, 'id'>), id: d.id }))),
        (error) => onError?.(error),
    );

// ---------- creazione, unione, uscita ----------

const buildMember = (user: CampaignUser, role: ICampaignMember['role'], joinCode?: string): Omit<ICampaignMember, 'uid'> =>
    cleanUndefinedValues({
        role,
        displayName: user.displayName || 'Giocatore',
        photoURL: user.photoURL || undefined,
        joinedAt: Date.now(),
        joinCode,
    });

/** Crea una campagna di cui `user` è il DM. */
export const createCampaign = async (user: CampaignUser, name: string, description = ''): Promise<ICampaign> => {
    const { db } = getFirebase();
    const now = Date.now();
    // Il codice è unico per regola (la creazione dell'invito fallisce se esiste già): ritenta.
    for (let attempt = 0; attempt < 5; attempt++) {
        const id = newCampaignId();
        const inviteCode = newInviteCode();
        const campaign: ICampaign = {
            id, name: name.trim(), description: description.trim(), ownerUid: user.uid,
            memberUids: [user.uid], inviteCode, createdAt: now, updatedAt: now,
        };
        const batch = writeBatch(db);
        const { id: _id, ...data } = campaign;
        batch.set(campaignRef(id), data);
        batch.set(memberRef(id, user.uid), buildMember(user, 'dm'));
        batch.set(inviteRef(inviteCode), { campaignId: id, ownerUid: user.uid, createdAt: now });
        try {
            await batch.commit();
            return campaign;
        } catch (error) {
            if ((error as { code?: string })?.code !== 'permission-denied') throw error;
            // Probabile collisione di codice: riprova con un altro.
        }
    }
    throw new CampaignError('code-collision', 'Non sono riuscito a generare un codice univoco. Riprova.');
};

/** Entra in una campagna con il codice d'invito. */
export const joinCampaignByCode = async (user: CampaignUser, rawCode: string): Promise<ICampaign> => {
    const code = normalizeInviteCode(rawCode);
    if (!isValidInviteCode(code)) throw new CampaignError('invalid-code', 'Codice campagna non valido.');

    const invite = await getDoc(inviteRef(code));
    if (!invite.exists()) throw new CampaignError('invalid-code', 'Codice campagna non valido.');
    const campaignId = (invite.data() as { campaignId: string }).campaignId;

    // Se la campagna è già leggibile, l'utente è già membro; altrimenti la lettura è negata.
    try {
        await getDoc(campaignRef(campaignId));
        throw new CampaignError('already-member', 'Fai già parte di questa campagna.');
    } catch (error) {
        if (error instanceof CampaignError) throw error;
        if ((error as { code?: string })?.code !== 'permission-denied') throw error;
    }

    const { db } = getFirebase();
    const batch = writeBatch(db);
    // Le regole accettano l'unione solo se il membro porta un codice che punta a questa campagna.
    batch.set(memberRef(campaignId, user.uid), buildMember(user, 'player', code));
    batch.update(campaignRef(campaignId), { memberUids: arrayUnion(user.uid), updatedAt: Date.now() });
    await batch.commit();

    const joined = await getDoc(campaignRef(campaignId));
    return toCampaign(joined);
};

/** Il giocatore esce dalla campagna e ritira i propri personaggi condivisi. */
export const leaveCampaign = async (campaignId: string, uid: string): Promise<void> => {
    const { db } = getFirebase();
    const shared = await getDocs(query(collection(db, 'campaigns', campaignId, 'sharedCharacters'), where('ownerUid', '==', uid)));
    const batch = writeBatch(db);
    shared.forEach((d) => batch.delete(d.ref));
    batch.delete(memberRef(campaignId, uid));
    batch.update(campaignRef(campaignId), { memberUids: arrayRemove(uid), updatedAt: Date.now() });
    await batch.commit();
    await Promise.all(shared.docs.map((d) => deleteCampaignPortrait(campaignId, uid, d.id).catch(() => undefined)));
};

/** Il DM rimuove un giocatore. */
export const removeMember = async (campaignId: string, memberUid: string): Promise<void> => {
    await leaveCampaign(campaignId, memberUid);
};

// ---------- gestione (DM) ----------

export const updateCampaignDetails = async (campaignId: string, name: string, description: string): Promise<void> => {
    const batch = writeBatch(getFirebase().db);
    batch.update(campaignRef(campaignId), { name: name.trim(), description: description.trim(), updatedAt: Date.now() });
    await batch.commit();
};

export const regenerateInviteCode = async (campaign: ICampaign): Promise<string> => {
    const { db } = getFirebase();
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = newInviteCode();
        const batch = writeBatch(db);
        batch.delete(inviteRef(campaign.inviteCode));
        batch.set(inviteRef(code), { campaignId: campaign.id, ownerUid: campaign.ownerUid, createdAt: Date.now() });
        batch.update(campaignRef(campaign.id), { inviteCode: code, updatedAt: Date.now() });
        try {
            await batch.commit();
            return code;
        } catch (error) {
            if ((error as { code?: string })?.code !== 'permission-denied') throw error;
        }
    }
    throw new CampaignError('code-collision', 'Non sono riuscito a generare un codice univoco. Riprova.');
};

/** Elimina la campagna con membri, personaggi condivisi e invito. I personaggi dei giocatori non vengono toccati. */
export const deleteCampaign = async (campaign: ICampaign): Promise<void> => {
    const { db } = getFirebase();
    const [members, shared] = await Promise.all([
        getDocs(collection(db, 'campaigns', campaign.id, 'members')),
        getDocs(collection(db, 'campaigns', campaign.id, 'sharedCharacters')),
    ]);
    // Prima le sottocollezioni e l'invito (le regole le valutano finché la campagna esiste), poi la campagna.
    const children = writeBatch(db);
    members.forEach((d) => children.delete(d.ref));
    shared.forEach((d) => children.delete(d.ref));
    children.delete(inviteRef(campaign.inviteCode));
    await children.commit();
    await deleteDoc(campaignRef(campaign.id));
    await Promise.all(shared.docs.map((d) => {
        const ownerUid = (d.data() as ISharedCharacter).ownerUid;
        return deleteCampaignPortrait(campaign.id, ownerUid, d.id).catch(() => undefined);
    }));
};

// ---------- personaggi condivisi ----------

/**
 * Pubblica (o aggiorna) il riepilogo di un personaggio nella campagna. Il ritratto viene
 * copiato nello Storage della campagna solo quando cambia l'immagine di origine.
 */
export const publishCharacter = async (campaignId: string, character: ICharacter, uid: string): Promise<void> => {
    const existing = await getDoc(sharedRef(campaignId, character.id));
    const previous = existing.exists() ? (existing.data() as ISharedCharacter) : undefined;

    let portraitUrl = previous?.portraitUrl;
    let portraitSource = previous?.portraitSource;
    if (!character.imageUrl) {
        if (portraitUrl) await deleteCampaignPortrait(campaignId, uid, character.id).catch(() => undefined);
        portraitUrl = undefined;
        portraitSource = undefined;
    } else if (character.imageUrl !== previous?.portraitSource) {
        try {
            portraitUrl = await copyPortraitToCampaign(character.imageUrl, campaignId, uid, character.id);
            portraitSource = character.imageUrl;
        } catch (error) {
            // Es. CORS dello Storage non configurato: il riepilogo si pubblica comunque, senza ritratto.
            console.warn('Copia del ritratto nella campagna non riuscita', error);
        }
    }

    const shared = buildSharedCharacter(character, uid, { url: portraitUrl, source: portraitSource });
    const { id: _id, ...data } = shared;
    await queueWrite(setDoc(sharedRef(campaignId, character.id), data));
};

export const unpublishCharacter = async (campaignId: string, characterId: string, uid: string): Promise<void> => {
    await queueWrite(deleteDoc(sharedRef(campaignId, characterId)));
    await deleteCampaignPortrait(campaignId, uid, characterId).catch(() => undefined);
};

// ---------- campagne locali storiche ----------

const LOCAL_CAMPAIGNS_KEY = 'runica_campaigns_v1';

export const getLocalCampaigns = (): ILocalCampaign[] => {
    try {
        const raw = localStorage.getItem(LOCAL_CAMPAIGNS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Failed to parse campaigns from localStorage:', error);
        return [];
    }
};

const saveLocalCampaigns = (campaigns: ILocalCampaign[]): void => {
    try {
        localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(campaigns));
    } catch (error) {
        console.error('Failed to save campaigns to localStorage:', error);
    }
};

/** Crea una campagna solo su questo dispositivo (modalità senza login). */
export const createLocalCampaign = (name: string, description = ''): ILocalCampaign => {
    const campaign: ILocalCampaign = {
        id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        description: description.trim(),
        code: '',
        createdBy: 'local',
        createdAt: Date.now(),
        characterIds: [],
    };
    saveLocalCampaigns([...getLocalCampaigns(), campaign]);
    return campaign;
};

export const deleteLocalCampaign = (campaignId: string): void => {
    saveLocalCampaigns(getLocalCampaigns().filter((c) => c.id !== campaignId));
};

/** Pubblica una campagna locale su Firestore. Elimina la copia locale solo a creazione riuscita. */
export const shareLocalCampaign = async (user: CampaignUser, local: ILocalCampaign): Promise<ICampaign> => {
    const created = await createCampaign(user, local.name, local.description ?? '');
    deleteLocalCampaign(local.id);
    return created;
};
