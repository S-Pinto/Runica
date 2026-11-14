// Regole pure delle campagne condivise: codici d'invito, ruoli, impostazioni e proiezioni pubblicate ai membri.
import type {
    ICampaign, ICampaignInvite, ICampaignSettings, ICharacter, ILiveStats, ISharedCharacter, CampaignRole, NarrativeVitals,
    IDmAction, DmActionType, IBoardPost,
} from '../characterTypes';
import { calculateArmorClass, calculateSpellSaveDC, getPassiveScores, getSpeedBreakdown } from './combat';
import { longRestUpdate } from './rest';

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

// ---------- azioni del DM ----------

/** Un'azione vale 12 ore: un riposo lungo dichiarato giorni fa non si applica più. */
export const DM_ACTION_TTL_MS = 12 * 60 * 60 * 1000;
/** Massimo di destinatari per azione (regole Firestore). */
export const DM_ACTION_MAX_TARGETS = 12;
/** Quante azioni applicate ricorda `liveStats.appliedActionIds` (regole Firestore). */
export const APPLIED_ACTIONS_LIMIT = 30;

export const buildDmAction = (
    type: DmActionType,
    targets: readonly string[],
    createdBy: string,
    now: number,
): Omit<IDmAction, 'id'> => ({
    type,
    targets: [...new Set(targets)].slice(0, DM_ACTION_MAX_TARGETS),
    createdBy,
    createdAt: now,
    expiresAt: now + DM_ACTION_TTL_MS,
});

export const isDmActionActive = (action: Pick<IDmAction, 'expiresAt'>, now: number): boolean => action.expiresAt > now;

/**
 * Effetto di un'azione sulla scheda: `patch` si applica subito (con "Annulla"),
 * `prompt` chiede al giocatore di aprire il proprio flusso (riposo breve: i dadi vita li sceglie lui).
 * `null` = niente da cambiare (es. ispirazione già presente).
 */
export type DmActionEffect = { kind: 'patch'; patch: Partial<ICharacter> } | { kind: 'prompt' } | null;

export const applyDmAction = (character: ICharacter, type: DmActionType): DmActionEffect => {
    const inspired = (Number(character.inspiration) || 0) > 0;
    switch (type) {
        case 'grantInspiration':
            return inspired ? null : { kind: 'patch', patch: { inspiration: 1 } };
        case 'revokeInspiration':
            return inspired ? { kind: 'patch', patch: { inspiration: 0 } } : null;
        case 'longRest':
            return { kind: 'patch', patch: longRestUpdate(character) };
        case 'shortRest':
            return { kind: 'prompt' };
        default:
            return null;
    }
};

/** I valori attuali dei campi che `patch` sta per cambiare: riapplicati, annullano l'azione. */
export const undoPatchFor = (character: ICharacter, patch: Partial<ICharacter>): Partial<ICharacter> =>
    Object.fromEntries(Object.keys(patch).map((key) => [key, character[key as keyof ICharacter]])) as Partial<ICharacter>;

/** Coppie azione/personaggio ancora da applicare per i personaggi indicati (le più vecchie prima). */
export const pendingDmActions = (
    actions: readonly IDmAction[],
    characterIds: ReadonlySet<string>,
    isApplied: (characterId: string, actionId: string) => boolean,
    now: number,
): { action: IDmAction; characterId: string }[] =>
    [...actions]
        .filter((a) => isDmActionActive(a, now))
        .sort((a, b) => a.createdAt - b.createdAt)
        .flatMap((action) => action.targets
            .filter((id) => characterIds.has(id) && !isApplied(id, action.id))
            .map((characterId) => ({ action, characterId })));

/** Aggiunge un id agli applicati tenendo solo gli ultimi `APPLIED_ACTIONS_LIMIT`. */
export const appendAppliedAction = (ids: readonly string[] | undefined, id: string): string[] =>
    [...(ids || []).filter((x) => x !== id), id].slice(-APPLIED_ACTIONS_LIMIT);

/** Quanti destinatari hanno già applicato l'azione, dai `liveStats` pubblicati. */
export const dmActionProgress = (
    action: Pick<IDmAction, 'id' | 'targets'>,
    liveById: ReadonlyMap<string, Pick<ILiveStats, 'appliedActionIds'>>,
): { applied: number; total: number } => {
    const applied = action.targets.filter((id) => (liveById.get(id)?.appliedActionIds || []).includes(action.id)).length;
    return { applied, total: action.targets.length };
};

/** Le azioni ancora in attesa per un personaggio (più recenti prima). */
export const pendingActionsFor = (
    characterId: string,
    actions: readonly IDmAction[],
    live: Pick<ILiveStats, 'appliedActionIds'> | undefined,
    now: number,
): IDmAction[] =>
    actions
        .filter((a) => isDmActionActive(a, now) && a.targets.includes(characterId) && !(live?.appliedActionIds || []).includes(a.id))
        .sort((a, b) => b.createdAt - a.createdAt);

// ---------- tavolo ----------

export type PartySort = 'name' | 'hp';

/** Ordine della Live Board: per nome, oppure prima chi ha meno PF in percentuale (senza numeri in fondo). */
export const sortParty = <T extends Pick<ISharedCharacter, 'id' | 'name'>>(
    party: readonly T[],
    sort: PartySort,
    liveById: ReadonlyMap<string, Pick<ILiveStats, 'hp'>>,
): T[] => {
    const byName = (a: T, b: T) => (a.name || '').localeCompare(b.name || '');
    if (sort === 'name') return [...party].sort(byName);
    const ratio = (c: T) => {
        const hp = liveById.get(c.id)?.hp;
        if (!hp) return Number.POSITIVE_INFINITY;
        return hp.max > 0 ? hp.current / hp.max : 1;
    };
    return [...party].sort((a, b) => {
        const ra = ratio(a);
        const rb = ratio(b);
        return ra === rb ? byName(a, b) : ra < rb ? -1 : 1;
    });
};

/** Oltre 10 minuti senza aggiornamenti il dato può non essere quello del tavolo. */
export const STALE_AFTER_MS = 10 * 60 * 1000;
export const isStale = (lastUpdated: number | undefined, now: number): boolean =>
    !lastUpdated || now - lastUpdated > STALE_AFTER_MS;

/** "adesso", "3 min fa", "2 h fa", "ieri", "4 giorni fa". */
export const describeAgo = (timestamp: number | undefined, now: number): string => {
    if (!timestamp) return 'mai';
    const minutes = Math.floor(Math.max(0, now - timestamp) / 60000);
    if (minutes < 1) return 'adesso';
    if (minutes < 60) return `${minutes} min fa`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h fa`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'ieri' : `${days} giorni fa`;
};

/** Slot per livello, in ordine: `[{ level: '1', max: 4, available: 2 }]`. */
export const slotSummary = (slots: ILiveStats['spellSlots'] | undefined) =>
    Object.entries(slots || {})
        .map(([level, s]) => ({ level, max: s.max, available: Math.max(0, s.max - s.used) }))
        .filter((s) => s.max > 0)
        .sort((a, b) => Number(a.level) - Number(b.level));

// ---------- bacheca ----------

export const BOARD_POST_MAX = 4000;
export const DM_NOTES_MAX = 20000;

/** Fissati in alto, poi i più recenti. */
export const sortBoardPosts = <T extends Pick<IBoardPost, 'pinned' | 'createdAt'>>(posts: readonly T[]): T[] =>
    [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt);

export const canPostOnBoard = (campaign: Pick<ICampaign, 'settings'>, role: CampaignRole | null): boolean =>
    role === 'dm' || (role === 'player' && getCampaignSettings(campaign).playerPosts);

export const canEditPost = (post: Pick<IBoardPost, 'authorUid'>, uid: string | null | undefined): boolean =>
    !!uid && post.authorUid === uid;

export const canDeletePost = (post: Pick<IBoardPost, 'authorUid'>, uid: string | null | undefined, role: CampaignRole | null): boolean =>
    role === 'dm' || canEditPost(post, uid);

/** `sharedCharacters` scritti da client v1 (con i numeri): il DM li elimina passando a "narrativo". */
export const legacySharedIds = (shared: readonly ISharedCharacter[]): string[] =>
    shared.filter((c) => c.schemaVersion !== SHARED_SCHEMA_VERSION).map((c) => c.id);
