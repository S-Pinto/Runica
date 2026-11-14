// Campagne condivise (Firestore) e campagne locali storiche (localStorage).
// Solo I/O: codici, ruoli, impostazioni e proiezioni sono calcolati in features/character/rules/campaign.ts.
import {
    collection, doc, getDoc, getDocs, onSnapshot, query, where, writeBatch, setDoc, updateDoc, deleteDoc, deleteField,
    arrayUnion, arrayRemove,
    type DocumentData, type DocumentReference, type DocumentSnapshot, type QuerySnapshot, type CollectionReference,
} from 'firebase/firestore';
import type {
    ICampaign, ICampaignInvite, ICampaignMember, ICampaignSettings, ICharacter, ILiveStats, ILocalCampaign, ISharedCharacter,
} from '../features/character/characterTypes';
import { getFirebase } from '../lib/getFirebase';
import { settleOrQueue } from '../lib/async';
import {
    generateInviteCode, normalizeInviteCode, isValidInviteCode, isInviteExpired, buildSharedCharacter, buildLiveStats,
    DEFAULT_CAMPAIGN_SETTINGS, LEGACY_SHARED_KEYS, SHARED_SCHEMA_VERSION,
} from '../features/character/rules/campaign';
import { cleanUndefinedValues } from '../features/character/rules/characterData';
import { copyPortraitToCampaign, deleteCampaignPortrait } from './storageService';

// ---------- utilità ----------

export interface CampaignUser {
    uid: string;
    displayName: string;
    photoURL?: string | null;
}

export type CampaignErrorCode = 'invalid-code' | 'expired' | 'already-member' | 'code-collision';

export class CampaignError extends Error {
    constructor(public readonly code: CampaignErrorCode, message: string) {
        super(message);
        this.name = 'CampaignError';
    }
}

const errorCode = (error: unknown) => (error as { code?: string })?.code;

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
const subcollection = (campaignId: string, name: string) => collection(getFirebase().db, 'campaigns', campaignId, name);
const memberRef = (campaignId: string, uid: string) => doc(getFirebase().db, 'campaigns', campaignId, 'members', uid);
const sharedRef = (campaignId: string, characterId: string) =>
    doc(getFirebase().db, 'campaigns', campaignId, 'sharedCharacters', characterId);
const liveRef = (campaignId: string, characterId: string) =>
    doc(getFirebase().db, 'campaigns', campaignId, 'liveStats', characterId);
const inviteRef = (code: string) => doc(getFirebase().db, 'campaignInvites', code);

/** Sottocollezioni di una campagna, da svuotare prima di eliminarla. */
const CAMPAIGN_SUBCOLLECTIONS = ['members', 'sharedCharacters', 'liveStats', 'dmActions', 'board', 'dmPrivate'] as const;

const toCampaign = (snap: DocumentSnapshot<DocumentData>): ICampaign => ({ ...(snap.data() as Omit<ICampaign, 'id'>), id: snap.id });

const withIds = <T extends { id: string }>(snapshot: QuerySnapshot<DocumentData>): T[] =>
    snapshot.docs.map((d) => ({ ...(d.data() as Omit<T, 'id'>), id: d.id }) as T);

const inviteData = (campaignId: string, ownerUid: string, campaignName: string, dmName: string) =>
    cleanUndefinedValues({ campaignId, ownerUid, createdAt: Date.now(), campaignName, dmName: dmName || undefined });

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

/**
 * Una sola campagna. Serve subito dopo l'unione, quando la query di `onCampaignsSnapshot`
 * può non averla ancora ricevuta. `null` = non esiste o non si è (più) membri.
 */
export const onCampaignSnapshot = (
    campaignId: string,
    callback: (campaign: ICampaign | null) => void,
    onError?: (error: unknown) => void,
): Unsubscribe =>
    onSnapshot(
        campaignRef(campaignId),
        (snap) => callback(snap.exists() ? toCampaign(snap) : null),
        (error) => {
            if (errorCode(error) === 'permission-denied') callback(null);
            else onError?.(error);
        },
    );

export const onCampaignMembersSnapshot = (
    campaignId: string,
    callback: (members: ICampaignMember[]) => void,
    onError?: (error: unknown) => void,
): Unsubscribe =>
    onSnapshot(
        subcollection(campaignId, 'members'),
        (snapshot) => callback(snapshot.docs.map((d) => ({ ...(d.data() as Omit<ICampaignMember, 'uid'>), uid: d.id }))),
        (error) => onError?.(error),
    );

export const onSharedCharactersSnapshot = (
    campaignId: string,
    callback: (characters: ISharedCharacter[]) => void,
    onError?: (error: unknown) => void,
): Unsubscribe =>
    onSnapshot(subcollection(campaignId, 'sharedCharacters'), (snapshot) => callback(withIds<ISharedCharacter>(snapshot)), (error) => onError?.(error));

/**
 * Numeri dal vivo. `ownerUid` limita la lettura ai propri personaggi: è l'unica query permessa
 * a un giocatore quando la campagna è in modalità narrativa (vedi `canReadPartyLiveStats`).
 */
export const onLiveStatsSnapshot = (
    campaignId: string,
    ownerUid: string | null,
    callback: (stats: ILiveStats[]) => void,
    onError?: (error: unknown) => void,
): Unsubscribe => {
    const source: CollectionReference<DocumentData> = subcollection(campaignId, 'liveStats');
    return onSnapshot(
        ownerUid ? query(source, where('ownerUid', '==', ownerUid)) : source,
        (snapshot) => callback(withIds<ILiveStats>(snapshot)),
        (error) => onError?.(error),
    );
};

// ---------- creazione, unione, uscita ----------

const buildMember = (user: CampaignUser, role: ICampaignMember['role'], joinCode?: string): Omit<ICampaignMember, 'uid'> =>
    cleanUndefinedValues({
        role,
        displayName: (user.displayName || 'Giocatore').slice(0, 120),
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
            settings: { ...DEFAULT_CAMPAIGN_SETTINGS }, schemaVersion: SHARED_SCHEMA_VERSION,
        };
        const batch = writeBatch(db);
        const { id: _id, ...data } = campaign;
        batch.set(campaignRef(id), data);
        batch.set(memberRef(id, user.uid), buildMember(user, 'dm'));
        batch.set(inviteRef(inviteCode), inviteData(id, user.uid, campaign.name, user.displayName));
        try {
            await batch.commit();
            return campaign;
        } catch (error) {
            if (errorCode(error) !== 'permission-denied') throw error;
            // Probabile collisione di codice: riprova con un altro.
        }
    }
    throw new CampaignError('code-collision', 'Non sono riuscito a generare un codice univoco. Riprova.');
};

/**
 * Risolve un codice (in qualunque formato: `RUN-X7K9AB`, con spazi, o il link intero) nell'invito,
 * con l'anteprima della campagna. Non serve essere membri.
 */
export const resolveInvite = async (rawCode: string): Promise<ICampaignInvite> => {
    const code = normalizeInviteCode(rawCode);
    if (!isValidInviteCode(code)) throw new CampaignError('invalid-code', 'Codice campagna non valido.');
    let snap: DocumentSnapshot<DocumentData>;
    try {
        snap = await getDoc(inviteRef(code));
    } catch (error) {
        // Le regole negano solo gli inviti scaduti (un codice inesistente risponde "non esiste").
        if (errorCode(error) === 'permission-denied') {
            throw new CampaignError('expired', 'Questo invito è scaduto. Chiedi un nuovo codice al DM.');
        }
        throw error;
    }
    if (!snap.exists()) throw new CampaignError('invalid-code', 'Codice campagna non valido o rigenerato dal DM.');
    const invite = { ...(snap.data() as Omit<ICampaignInvite, 'code'>), code };
    if (isInviteExpired(invite, Date.now())) {
        throw new CampaignError('expired', 'Questo invito è scaduto. Chiedi un nuovo codice al DM.');
    }
    return invite;
};

/** True se `uid` è già membro: le regole permettono a chiunque di leggere il proprio documento membro. */
export const isMemberOf = async (campaignId: string, uid: string): Promise<boolean> =>
    (await getDoc(memberRef(campaignId, uid))).exists();

export const getCampaign = async (campaignId: string): Promise<ICampaign> => toCampaign(await getDoc(campaignRef(campaignId)));

/** Entra in una campagna con il codice d'invito (o con l'invito già risolto). */
export const joinCampaignByCode = async (user: CampaignUser, codeOrInvite: string | ICampaignInvite): Promise<ICampaign> => {
    const invite = typeof codeOrInvite === 'string' ? await resolveInvite(codeOrInvite) : codeOrInvite;
    const { campaignId, code } = invite;

    if (await isMemberOf(campaignId, user.uid)) {
        throw new CampaignError('already-member', 'Fai già parte di questa campagna.');
    }

    const batch = writeBatch(getFirebase().db);
    // Le regole accettano l'unione solo se il membro porta un codice valido che punta a questa campagna.
    batch.set(memberRef(campaignId, user.uid), buildMember(user, 'player', code));
    batch.update(campaignRef(campaignId), { memberUids: arrayUnion(user.uid), updatedAt: Date.now() });
    try {
        await batch.commit();
    } catch (error) {
        if (errorCode(error) === 'permission-denied') {
            throw new CampaignError('invalid-code', 'Non è stato possibile unirti: il codice potrebbe essere stato rigenerato dal DM.');
        }
        throw error;
    }
    return getCampaign(campaignId);
};

/** Il personaggio con cui il membro siede al tavolo. */
export const setActiveCharacter = async (campaignId: string, uid: string, characterId: string | null): Promise<void> => {
    await queueWrite(setDoc(memberRef(campaignId, uid), { activeCharacterId: characterId ?? deleteField() }, { merge: true }));
};

/** Elimina a blocchi (limite di 500 scritture per batch). */
const deleteInChunks = async (refs: { ref: DocumentReference<DocumentData> }[]) => {
    const { db } = getFirebase();
    for (let i = 0; i < refs.length; i += 400) {
        const batch = writeBatch(db);
        refs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
};

const ownProjections = async (campaignId: string, uid: string) => {
    const [shared, live] = await Promise.all([
        getDocs(query(subcollection(campaignId, 'sharedCharacters'), where('ownerUid', '==', uid))),
        getDocs(query(subcollection(campaignId, 'liveStats'), where('ownerUid', '==', uid))),
    ]);
    return { shared, live };
};

/**
 * Toglie un membro dalla campagna con i suoi riepiloghi (`uid` = se stesso per uscire, oppure un giocatore
 * se chi chiama è il DM). Il ritratto copiato si cancella solo quando esce il proprietario stesso:
 * lo Storage permette la cancellazione solo a lui.
 */
const removeFromCampaign = async (campaignId: string, uid: string, isSelf: boolean): Promise<void> => {
    const { db } = getFirebase();
    const { shared, live } = await ownProjections(campaignId, uid);
    const batch = writeBatch(db);
    shared.forEach((d) => batch.delete(d.ref));
    live.forEach((d) => batch.delete(d.ref));
    batch.delete(memberRef(campaignId, uid));
    batch.update(campaignRef(campaignId), { memberUids: arrayRemove(uid), updatedAt: Date.now() });
    await batch.commit();
    shared.docs.forEach((d) => forgetPublished(campaignId, d.id));
    if (isSelf) {
        await Promise.all(shared.docs.map((d) => deleteCampaignPortrait(campaignId, uid, d.id).catch(() => undefined)));
    }
};

/** Il giocatore esce dalla campagna e ritira i propri personaggi condivisi. */
export const leaveCampaign = (campaignId: string, uid: string): Promise<void> => removeFromCampaign(campaignId, uid, true);

/** Il DM rimuove un giocatore. */
export const removeMember = (campaignId: string, memberUid: string): Promise<void> => removeFromCampaign(campaignId, memberUid, false);

// ---------- gestione (DM) ----------

/** Rinomina la campagna e tiene allineata l'anteprima dell'invito. */
export const updateCampaignDetails = async (campaign: ICampaign, name: string, description: string): Promise<void> => {
    await updateDoc(campaignRef(campaign.id), { name: name.trim(), description: description.trim(), updatedAt: Date.now() });
    // Best effort: l'anteprima vecchia non impedisce di entrare.
    await updateDoc(inviteRef(campaign.inviteCode), { campaignName: name.trim() }).catch((error) => {
        console.warn("Anteprima dell'invito non aggiornata", error);
    });
};

export const updateCampaignSettings = async (campaignId: string, settings: ICampaignSettings): Promise<void> => {
    await queueWrite(setDoc(campaignRef(campaignId), { settings, updatedAt: Date.now() }, { merge: true }));
};

export const regenerateInviteCode = async (campaign: ICampaign, dmName = ''): Promise<string> => {
    const { db } = getFirebase();
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = newInviteCode();
        const batch = writeBatch(db);
        batch.delete(inviteRef(campaign.inviteCode));
        batch.set(inviteRef(code), inviteData(campaign.id, campaign.ownerUid, campaign.name, dmName));
        batch.update(campaignRef(campaign.id), { inviteCode: code, updatedAt: Date.now() });
        try {
            await batch.commit();
            return code;
        } catch (error) {
            if (errorCode(error) !== 'permission-denied') throw error;
        }
    }
    throw new CampaignError('code-collision', 'Non sono riuscito a generare un codice univoco. Riprova.');
};

/** Elimina la campagna con tutte le sottocollezioni e l'invito. I personaggi dei giocatori non vengono toccati. */
export const deleteCampaign = async (campaign: ICampaign): Promise<void> => {
    const snapshots = await Promise.all(CAMPAIGN_SUBCOLLECTIONS.map((name) => getDocs(subcollection(campaign.id, name))));
    const shared = snapshots[CAMPAIGN_SUBCOLLECTIONS.indexOf('sharedCharacters')];
    // Prima le sottocollezioni (le regole le valutano finché la campagna esiste), poi invito e campagna.
    await deleteInChunks(snapshots.flatMap((snap) => snap.docs));
    await deleteDoc(inviteRef(campaign.inviteCode)).catch(() => undefined);
    await deleteDoc(campaignRef(campaign.id));
    await Promise.all(shared.docs.map((d) => {
        forgetPublished(campaign.id, d.id);
        const ownerUid = (d.data() as ISharedCharacter).ownerUid;
        // Solo i propri ritratti si possono cancellare (regole dello Storage).
        return ownerUid === campaign.ownerUid
            ? deleteCampaignPortrait(campaign.id, ownerUid, d.id).catch(() => undefined)
            : Promise.resolve();
    }));
};

// ---------- proiezioni del personaggio ----------

/** Ultima impronta pubblicata per `campagna:personaggio`, per non riscrivere documenti identici. */
const publishedFingerprints = new Map<string, string>();
const publishKey = (campaignId: string, characterId: string) => `${campaignId}:${characterId}`;

export const getPublishedFingerprint = (campaignId: string, characterId: string) =>
    publishedFingerprints.get(publishKey(campaignId, characterId));

export const rememberPublished = (campaignId: string, characterId: string, fingerprint: string) =>
    publishedFingerprints.set(publishKey(campaignId, characterId), fingerprint);

export const forgetPublished = (campaignId: string, characterId: string) =>
    publishedFingerprints.delete(publishKey(campaignId, characterId));

/** I campi v1 della proiezione party vengono tolti a ogni scrittura (merge + deleteField). */
const legacyDeletes = () => Object.fromEntries(LEGACY_SHARED_KEYS.map((key) => [key, deleteField()]));

/** Scrive le proiezioni party (senza toccare il ritratto) e tavolo (senza toccare `appliedActionIds`). */
const writeProjections = async (campaignId: string, character: ICharacter, uid: string, portrait?: { url?: string; source?: string } | null) => {
    const { id: _id, ...party } = buildSharedCharacter(character, uid);
    const portraitFields = portrait === undefined
        ? {}
        : { portraitUrl: portrait?.url ?? deleteField(), portraitSource: portrait?.source ?? deleteField() };
    const { id: _liveId, ...live } = buildLiveStats(character, uid);
    await Promise.all([
        queueWrite(setDoc(sharedRef(campaignId, character.id), { ...party, ...portraitFields, ...legacyDeletes() }, { merge: true })),
        // mergeFields: ogni campo è sostituito per intero (es. livelli di slot spariti), gli altri restano.
        queueWrite(setDoc(liveRef(campaignId, character.id), live, { mergeFields: Object.keys(live) })),
    ]);
};

/**
 * Pubblicazione completa (dall'editor): proiezioni più ritratto, copiato nello Storage della campagna
 * solo quando cambia l'immagine di origine.
 */
export const publishCharacter = async (campaignId: string, character: ICharacter, uid: string): Promise<void> => {
    const existing = await getDoc(sharedRef(campaignId, character.id)).catch(() => null);
    const previous = existing?.exists() ? (existing.data() as ISharedCharacter) : undefined;

    let portrait: { url?: string; source?: string } | null = previous?.portraitUrl
        ? { url: previous.portraitUrl, source: previous.portraitSource }
        : null;
    if (!character.imageUrl) {
        if (previous?.portraitUrl) await deleteCampaignPortrait(campaignId, uid, character.id).catch(() => undefined);
        portrait = null;
    } else if (character.imageUrl !== previous?.portraitSource) {
        try {
            portrait = { url: await copyPortraitToCampaign(character.imageUrl, campaignId, uid, character.id), source: character.imageUrl };
        } catch (error) {
            // Es. CORS dello Storage non configurato: il riepilogo si pubblica comunque, senza ritratto.
            console.warn('Copia del ritratto nella campagna non riuscita', error);
        }
    }
    await writeProjections(campaignId, character, uid, portrait);
};

/** Pubblicazione leggera (vista di gioco): solo i dati che cambiano al tavolo, ritratto invariato. */
export const publishLiveProjection = async (campaignId: string, character: ICharacter, uid: string): Promise<void> => {
    await writeProjections(campaignId, character, uid);
};

export const unpublishCharacter = async (campaignId: string, characterId: string, uid: string): Promise<void> => {
    forgetPublished(campaignId, characterId);
    await Promise.all([
        queueWrite(deleteDoc(sharedRef(campaignId, characterId))),
        queueWrite(deleteDoc(liveRef(campaignId, characterId))),
    ]);
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
