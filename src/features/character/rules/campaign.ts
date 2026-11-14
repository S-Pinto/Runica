// Regole pure delle campagne condivise: codici d'invito, ruoli, impostazioni e proiezioni pubblicate ai membri.
import type {
    ICampaign, ICampaignInvite, ICampaignSettings, ICharacter, ILiveStats, ISharedCharacter, CampaignRole, NarrativeVitals,
} from '../characterTypes';
import { calculateArmorClass, calculateSpellSaveDC, getPassiveScores, getSpeedBreakdown } from './combat';

// ---------- codici d'invito ----------

/** Niente caratteri ambigui (0/O, 1/I/L). */
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;
/** Prefisso di presentazione: il codice salvato (id di `campaignInvites`) è senza. */
export const INVITE_CODE_PREFIX = 'RUN';
export const JOIN_PATH = '/campaigns/join';

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

/**
 * Riduce ciò che l'utente incolla al codice nudo: accetta `x7k9ab`, `X7K 9AB`, `RUN-X7K9AB`
 * e anche il link d'invito intero (`…/campaigns/join?code=RUN-X7K9AB`).
 * Il prefisso si toglie solo se ne restano esattamente 6 caratteri (un codice può iniziare con "RUN").
 */
export const normalizeInviteCode = (raw: string): string => {
    let text = (raw || '').trim();
    const fromLink = /[?&]code=([^&#\s]+)/i.exec(text);
    if (fromLink) {
        try {
            text = decodeURIComponent(fromLink[1]);
        } catch {
            text = fromLink[1];
        }
    }
    const compact = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (compact.length === INVITE_CODE_PREFIX.length + INVITE_CODE_LENGTH && compact.startsWith(INVITE_CODE_PREFIX)) {
        return compact.slice(INVITE_CODE_PREFIX.length);
    }
    return compact;
};

export const isValidInviteCode = (code: string): boolean =>
    code.length === INVITE_CODE_LENGTH && [...code].every((ch) => INVITE_CODE_ALPHABET.includes(ch));

/** `X7K9AB` → `RUN-X7K9AB`. */
export const formatInviteCode = (code: string): string => `${INVITE_CODE_PREFIX}-${code}`;

/** Link diretto d'invito; `origin` è `window.location.origin`. */
export const buildInviteLink = (origin: string, code: string): string =>
    `${origin.replace(/\/+$/, '')}${JOIN_PATH}?code=${formatInviteCode(code)}`;

export const isInviteExpired = (invite: Pick<ICampaignInvite, 'expiresAt'>, now: number): boolean =>
    typeof invite.expiresAt === 'number' && invite.expiresAt <= now;

/** Solo percorsi interni (`/…`, non `//host`): evita redirect verso siti esterni dopo il login. */
export const sanitizeNextPath = (next: string | null | undefined): string | null =>
    next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null;

// ---------- ruoli e impostazioni ----------

export const getRole = (
    campaign: Pick<ICampaign, 'ownerUid' | 'memberUids'>,
    uid: string | null | undefined,
): CampaignRole | null => {
    if (!uid) return null;
    if (campaign.ownerUid === uid) return 'dm';
    return campaign.memberUids.includes(uid) ? 'player' : null;
};

export const ROLE_LABELS: Record<CampaignRole, string> = { dm: 'Dungeon Master', player: 'Giocatore' };

export const DEFAULT_CAMPAIGN_SETTINGS: ICampaignSettings = { partyVitals: 'numeric', playerPosts: true };

/** Impostazioni con i default per le campagne create prima della v2 (che non hanno `settings`). */
export const getCampaignSettings = (campaign: Pick<ICampaign, 'settings'> | null | undefined): ICampaignSettings => ({
    partyVitals: campaign?.settings?.partyVitals === 'narrative' ? 'narrative' : 'numeric',
    playerPosts: campaign?.settings?.playerPosts !== false,
});

/** Il giocatore può leggere i numeri (`liveStats`) degli altri? Il DM sempre. */
export const canReadPartyLiveStats = (campaign: Pick<ICampaign, 'settings'>, role: CampaignRole | null): boolean =>
    role === 'dm' || (role === 'player' && getCampaignSettings(campaign).partyVitals === 'numeric');

// ---------- proiezioni ----------

export const SHARED_SCHEMA_VERSION = 2;

/** Chiavi v1 della proiezione party, tolte alla prima pubblicazione v2. */
export const LEGACY_SHARED_KEYS = ['hpCurrent', 'hpMax', 'hpTemp', 'armorClass'] as const;

export const NARRATIVE_VITALS_LABELS: Record<NarrativeVitals, string> = {
    healthy: 'Sano', wounded: 'Ferito', critical: 'Critico', down: 'A terra',
};

/** A terra a 0 PF, Critico fino al 25 %, Ferito fino al 50 % (Sanguinante), altrimenti Sano. */
export const narrativeVitals = (current: number, max: number): NarrativeVitals => {
    if (!(current > 0)) return 'down';
    if (!(max > 0)) return 'healthy';
    const ratio = current / max;
    if (ratio <= 0.25) return 'critical';
    if (ratio <= 0.5) return 'wounded';
    return 'healthy';
};

const hasHeroicInspiration = (character: Pick<ICharacter, 'inspiration'>) => (Number(character.inspiration) || 0) > 0;

const safeConditions = (character: Pick<ICharacter, 'conditions'>) =>
    (character.conditions || []).filter((c): c is string => typeof c === 'string').slice(0, 30);

/** Proiezione party visibile a tutti i membri: identità e stato narrativo, mai numeri né la scheda. */
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
        vitals: narrativeVitals(character.hp?.current ?? 0, character.hp?.max ?? 0),
        conditions: safeConditions(character),
        heroicInspiration: hasHeroicInspiration(character),
        lastUpdated: character.lastUpdated || Date.now(),
        schemaVersion: SHARED_SCHEMA_VERSION,
    };
    // Firestore non accetta `undefined`.
    if (portrait?.url) shared.portraitUrl = portrait.url;
    if (portrait?.source) shared.portraitSource = portrait.source;
    return shared;
};

const toCount = (value: unknown) => Math.max(0, Math.floor(Number(value) || 0));

/** Proiezione tavolo: i numeri che servono al DM (e al gruppo in modalità numerica). Senza `appliedActionIds`. */
export const buildLiveStats = (character: ICharacter, ownerUid: string): Omit<ILiveStats, 'appliedActionIds'> => {
    const spellSlots: ILiveStats['spellSlots'] = {};
    Object.entries(character.spellSlots || {}).forEach(([level, slot]) => {
        const max = toCount(slot?.max);
        if (max > 0) spellSlots[level] = { max, used: Math.min(max, toCount(slot?.used)) };
    });
    return {
        id: character.id,
        ownerUid,
        hp: {
            current: Number(character.hp?.current) || 0,
            max: Number(character.hp?.max) || 0,
            temp: Number(character.hp?.temporary) || 0,
        },
        armorClass: calculateArmorClass(character),
        speed: getSpeedBreakdown(character).total,
        passives: getPassiveScores(character),
        spellSaveDC: character.spellcastingAbility ? calculateSpellSaveDC(character) : null,
        heroicInspiration: hasHeroicInspiration(character),
        spellSlots,
        conditions: safeConditions(character),
        deathSaves: {
            successes: toCount(character.deathSaves?.successes),
            failures: toCount(character.deathSaves?.failures),
        },
        hitDice: { total: String(character.hitDice?.total ?? ''), used: toCount(character.hitDice?.used) },
        lastUpdated: character.lastUpdated || Date.now(),
    };
};

/**
 * Impronta delle proiezioni, senza i campi che cambiano a ogni salvataggio (`lastUpdated`):
 * se non cambia, non serve riscrivere i documenti.
 */
export const projectionFingerprint = (
    shared: ISharedCharacter,
    live: Omit<ILiveStats, 'appliedActionIds'>,
): string => {
    const { lastUpdated: _a, portraitUrl: _b, portraitSource: _c, ...party } = shared;
    const { lastUpdated: _d, ...stats } = live;
    return JSON.stringify([party, stats]);
};

// ---------- sincronizzazione ----------

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
