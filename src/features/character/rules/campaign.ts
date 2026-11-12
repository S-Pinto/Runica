// Regole pure delle campagne condivise: codici d'invito, ruoli, riepilogo pubblicato ai membri.
import type { ICampaign, ICharacter, ISharedCharacter, CampaignRole } from '../characterTypes';
import { calculateArmorClass } from './combat';

/** Niente caratteri ambigui (0/O, 1/I/L). */
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

/**
 * Genera un codice d'invito. `randomInt(max)` deve restituire un intero uniforme in [0, max):
 * il servizio passa una versione basata su `crypto.getRandomValues`.
 */
export const generateInviteCode = (randomInt: (max: number) => number): string => {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
    }
    return code;
};

export const normalizeInviteCode = (raw: string): string => raw.trim().toUpperCase();

export const isValidInviteCode = (code: string): boolean =>
    code.length === INVITE_CODE_LENGTH && [...code].every((ch) => INVITE_CODE_ALPHABET.includes(ch));

export const getRole = (
    campaign: Pick<ICampaign, 'ownerUid' | 'memberUids'>,
    uid: string | null | undefined,
): CampaignRole | null => {
    if (!uid) return null;
    if (campaign.ownerUid === uid) return 'dm';
    return campaign.memberUids.includes(uid) ? 'player' : null;
};

export const ROLE_LABELS: Record<CampaignRole, string> = { dm: 'Dungeon Master', player: 'Giocatore' };

/** Riepilogo del personaggio visibile agli altri membri: solo campi in elenco, mai la scheda intera. */
export const buildSharedCharacter = (
    character: ICharacter,
    ownerUid: string,
    portrait?: { url?: string; source?: string },
): ISharedCharacter => {
    const shared: ISharedCharacter = {
        id: character.id,
        ownerUid,
        name: character.name || '',
        class: character.class || '',
        subclass: character.subclass || '',
        race: character.race || '',
        level: character.level || 1,
        hpCurrent: character.hp?.current ?? 0,
        hpMax: character.hp?.max ?? 0,
        hpTemp: character.hp?.temporary ?? 0,
        armorClass: calculateArmorClass(character),
        lastUpdated: character.lastUpdated || Date.now(),
    };
    // Firestore non accetta `undefined`.
    if (portrait?.url) shared.portraitUrl = portrait.url;
    if (portrait?.source) shared.portraitSource = portrait.source;
    return shared;
};

export interface CampaignSyncPlan {
    /** Campagna da cui togliere il riepilogo. */
    unpublishFrom?: string;
    /** Campagna in cui pubblicare/aggiornare il riepilogo. */
    publishTo?: string;
}

/**
 * Decide cosa fare sulle campagne condivise dopo il salvataggio di un personaggio.
 * `cloudCampaignIds` esclude gli id di campagne locali o non più accessibili.
 */
export const planCampaignSync = (
    previousCampaignId: string | undefined,
    nextCampaignId: string | undefined,
    cloudCampaignIds: ReadonlySet<string>,
): CampaignSyncPlan => {
    const plan: CampaignSyncPlan = {};
    if (previousCampaignId && previousCampaignId !== nextCampaignId && cloudCampaignIds.has(previousCampaignId)) {
        plan.unpublishFrom = previousCampaignId;
    }
    if (nextCampaignId && cloudCampaignIds.has(nextCampaignId)) {
        plan.publishTo = nextCampaignId;
    }
    return plan;
};

/** Nome da mostrare per la campagna di un personaggio: quello aggiornato se noto, altrimenti la cache. */
export const resolveCampaignName = (
    character: Pick<ICharacter, 'campaignId' | 'campaignName'>,
    known: ReadonlyMap<string, string>,
): string | undefined => (character.campaignId && known.get(character.campaignId)) || character.campaignName;
