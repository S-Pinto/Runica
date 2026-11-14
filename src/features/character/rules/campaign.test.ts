import { describe, it, expect } from 'vitest';
import {
    generateInviteCode, normalizeInviteCode, isValidInviteCode, getRole, buildSharedCharacter,
    planCampaignSync, resolveCampaignName, INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH,
    formatInviteCode, buildInviteLink, isInviteExpired, sanitizeNextPath, getCampaignSettings, canReadPartyLiveStats,
    narrativeVitals, buildLiveStats, projectionFingerprint,
} from './campaign';
import { createNewCharacter } from './defaults';

describe('codici d\'invito', () => {
    it('genera codici della lunghezza giusta con caratteri dell\'alfabeto', () => {
        let n = 0;
        const code = generateInviteCode(() => n++ % INVITE_CODE_ALPHABET.length);
        expect(code).toHaveLength(INVITE_CODE_LENGTH);
        expect(isValidInviteCode(code)).toBe(true);
    });

    it('usa il generatore passato (estremi dell\'intervallo)', () => {
        expect(generateInviteCode(() => 0)).toBe(INVITE_CODE_ALPHABET[0].repeat(INVITE_CODE_LENGTH));
        expect(generateInviteCode((max) => max - 1)).toBe(INVITE_CODE_ALPHABET.slice(-1).repeat(INVITE_CODE_LENGTH));
    });

    it('normalizza e valida', () => {
        expect(normalizeInviteCode('  ab3k9z ')).toBe('AB3K9Z');
        expect(isValidInviteCode('AB3K9Z')).toBe(true);
        expect(isValidInviteCode('AB3K9')).toBe(false);
        expect(isValidInviteCode('AB3K9O')).toBe(false); // O è ambigua
    });

    it('accetta prefisso, spazi, trattini e link incollati', () => {
        expect(normalizeInviteCode('RUN-X7K9AB')).toBe('X7K9AB');
        expect(normalizeInviteCode('run x7k 9ab')).toBe('X7K9AB');
        expect(normalizeInviteCode('X7K-9AB')).toBe('X7K9AB');
        expect(normalizeInviteCode('https://runica.app/campaigns/join?code=RUN-X7K9AB')).toBe('X7K9AB');
        expect(normalizeInviteCode('https://runica.app/campaigns/join?foo=1&code=run%2Dx7k9ab#x')).toBe('X7K9AB');
    });

    it('non toglie "RUN" da un codice che inizia così', () => {
        expect(normalizeInviteCode('RUNABC')).toBe('RUNABC');
        expect(normalizeInviteCode('RUN-RUNABC')).toBe('RUNABC');
    });

    it('formatta codice e link', () => {
        expect(formatInviteCode('X7K9AB')).toBe('RUN-X7K9AB');
        expect(buildInviteLink('https://runica.app/', 'X7K9AB')).toBe('https://runica.app/campaigns/join?code=RUN-X7K9AB');
        expect(normalizeInviteCode(buildInviteLink('http://localhost:5173', 'X7K9AB'))).toBe('X7K9AB');
    });

    it('scadenza: assente = non scade', () => {
        expect(isInviteExpired({}, 1000)).toBe(false);
        expect(isInviteExpired({ expiresAt: 2000 }, 1000)).toBe(false);
        expect(isInviteExpired({ expiresAt: 1000 }, 1000)).toBe(true);
    });
});

describe('sanitizeNextPath', () => {
    it('accetta solo percorsi interni', () => {
        expect(sanitizeNextPath('/campaigns/join?code=RUN-X7K9AB')).toBe('/campaigns/join?code=RUN-X7K9AB');
        expect(sanitizeNextPath('//evil.com')).toBeNull();
        expect(sanitizeNextPath('/\\evil.com')).toBeNull();
        expect(sanitizeNextPath('https://evil.com')).toBeNull();
        expect(sanitizeNextPath(null)).toBeNull();
    });
});

describe('getRole', () => {
    const campaign = { ownerUid: 'dm1', memberUids: ['dm1', 'p1'] };
    it('distingue DM, giocatore ed esterno', () => {
        expect(getRole(campaign, 'dm1')).toBe('dm');
        expect(getRole(campaign, 'p1')).toBe('player');
        expect(getRole(campaign, 'x')).toBeNull();
        expect(getRole(campaign, null)).toBeNull();
    });
});

describe('impostazioni', () => {
    it('le campagne senza settings sono numeriche e con bacheca aperta', () => {
        expect(getCampaignSettings({})).toEqual({ partyVitals: 'numeric', playerPosts: true });
        expect(getCampaignSettings({ settings: { partyVitals: 'narrative', playerPosts: false } }))
            .toEqual({ partyVitals: 'narrative', playerPosts: false });
    });
    it('il gruppo legge i numeri solo in modalità numerica, il DM sempre', () => {
        const narrative = { settings: { partyVitals: 'narrative' as const, playerPosts: true } };
        expect(canReadPartyLiveStats(narrative, 'dm')).toBe(true);
        expect(canReadPartyLiveStats(narrative, 'player')).toBe(false);
        expect(canReadPartyLiveStats({}, 'player')).toBe(true);
        expect(canReadPartyLiveStats({}, null)).toBe(false);
    });
});

describe('narrativeVitals', () => {
    it('soglie Sano / Ferito / Critico / A terra', () => {
        expect(narrativeVitals(30, 30)).toBe('healthy');
        expect(narrativeVitals(16, 30)).toBe('healthy');
        expect(narrativeVitals(15, 30)).toBe('wounded');
        expect(narrativeVitals(8, 30)).toBe('wounded');
        expect(narrativeVitals(7, 30)).toBe('critical');
        expect(narrativeVitals(1, 30)).toBe('critical');
        expect(narrativeVitals(0, 30)).toBe('down');
        expect(narrativeVitals(-3, 30)).toBe('down');
        expect(narrativeVitals(5, 0)).toBe('healthy');
    });
});

describe('buildSharedCharacter', () => {
    it('copia solo identità e stato narrativo, mai numeri o note', () => {
        const c = { ...createNewCharacter(), id: 'c1', name: 'Aria', class: 'Mago', level: 5, notes: 'segreto', dmNotes: 'riservato', inspiration: 1, conditions: ['poisoned'] };
        c.hp = { max: 30, current: 12, temporary: 2 };
        const shared = buildSharedCharacter(c, 'u1');
        expect(shared).toMatchObject({
            id: 'c1', ownerUid: 'u1', name: 'Aria', class: 'Mago', level: 5,
            vitals: 'wounded', heroicInspiration: true, conditions: ['poisoned'], schemaVersion: 2,
        });
        // Dalla v2 i numeri stanno in liveStats, mai nella proiezione party.
        for (const key of ['hpCurrent', 'hpMax', 'hpTemp', 'armorClass']) expect(key in shared).toBe(false);
        expect('portraitUrl' in shared).toBe(false);
        expect(JSON.stringify(shared)).not.toContain('segreto');
        expect(JSON.stringify(shared)).not.toContain('riservato');
    });

    it('include il ritratto se presente', () => {
        const shared = buildSharedCharacter({ ...createNewCharacter(), id: 'c1' }, 'u1', { url: 'https://x/y', source: 'https://x/src' });
        expect(shared.portraitUrl).toBe('https://x/y');
        expect(shared.portraitSource).toBe('https://x/src');
    });
});

describe('buildLiveStats', () => {
    const base = () => {
        const c = { ...createNewCharacter(), id: 'c1', level: 5, proficiencyBonus: 3 };
        c.abilityScores = { ...c.abilityScores, wisdom: 14, intelligence: 16 };
        c.hp = { max: 38, current: 23, temporary: 5 };
        return c;
    };

    it('calcola PF, passive e slot (solo i livelli con slot)', () => {
        const c = base();
        c.skills = c.skills.map((s) => (s.name === 'Perception' ? { ...s, proficient: true } : s.name === 'Investigation' ? { ...s, expertise: true } : s));
        c.spellSlots = { 1: { max: 4, used: 2 }, 2: { max: 3, used: 9 }, 3: { max: 0, used: 0 } };
        const live = buildLiveStats(c, 'u1');
        expect(live.hp).toEqual({ current: 23, max: 38, temp: 5 });
        expect(live.passives).toEqual({ perception: 10 + 2 + 3, insight: 12, investigation: 10 + 3 + 6 });
        expect(live.spellSlots).toEqual({ 1: { max: 4, used: 2 }, 2: { max: 3, used: 3 } });
        expect(typeof live.armorClass).toBe('number');
        expect(typeof live.speed).toBe('number');
        expect('appliedActionIds' in live).toBe(false);
    });

    it('CD incantesimi solo con una caratteristica da incantatore', () => {
        const c = base();
        expect(buildLiveStats({ ...c, spellcastingAbility: '' }, 'u1').spellSaveDC).toBeNull();
        expect(buildLiveStats({ ...c, spellcastingAbility: 'intelligence' }, 'u1').spellSaveDC).toBe(8 + 3 + 3);
    });

    it('l\'impronta ignora lastUpdated ma non i PF', () => {
        const c = base();
        const fp = (x: typeof c) => projectionFingerprint(buildSharedCharacter(x, 'u1'), buildLiveStats(x, 'u1'));
        expect(fp({ ...c, lastUpdated: 1 })).toBe(fp({ ...c, lastUpdated: 2 }));
        expect(fp(c)).not.toBe(fp({ ...c, hp: { ...c.hp, current: 1 } }));
    });
});

describe('planCampaignSync', () => {
    const cloud = new Set(['a', 'b']);
    it('pubblica nella campagna cloud corrente', () => {
        expect(planCampaignSync(undefined, 'a', cloud)).toEqual({ publishTo: 'a' });
        expect(planCampaignSync('a', 'a', cloud)).toEqual({ publishTo: 'a' });
    });
    it('toglie dalla precedente quando cambia', () => {
        expect(planCampaignSync('a', 'b', cloud)).toEqual({ unpublishFrom: 'a', publishTo: 'b' });
        expect(planCampaignSync('a', undefined, cloud)).toEqual({ unpublishFrom: 'a' });
    });
    it('ignora campagne locali o sconosciute', () => {
        expect(planCampaignSync('camp_local', 'camp_local2', cloud)).toEqual({});
    });
});

describe('resolveCampaignName', () => {
    it('preferisce il nome aggiornato, ripiega sulla cache', () => {
        const known = new Map([['a', 'Nuovo']]);
        expect(resolveCampaignName({ campaignId: 'a', campaignName: 'Vecchio' }, known)).toBe('Nuovo');
        expect(resolveCampaignName({ campaignId: 'z', campaignName: 'Cache' }, known)).toBe('Cache');
        expect(resolveCampaignName({}, known)).toBeUndefined();
    });
});
