import { describe, it, expect } from 'vitest';
import {
    generateInviteCode, normalizeInviteCode, isValidInviteCode, getRole, buildSharedCharacter,
    planCampaignSync, resolveCampaignName, INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH,
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

describe('buildSharedCharacter', () => {
    it('copia solo il riepilogo e omette i campi undefined', () => {
        const c = { ...createNewCharacter(), id: 'c1', name: 'Aria', class: 'Mago', level: 5, notes: 'segreto', dmNotes: 'riservato' };
        c.hp = { max: 30, current: 12, temporary: 2 };
        const shared = buildSharedCharacter(c, 'u1');
        expect(shared).toMatchObject({ id: 'c1', ownerUid: 'u1', name: 'Aria', class: 'Mago', level: 5, hpCurrent: 12, hpMax: 30, hpTemp: 2 });
        expect(typeof shared.armorClass).toBe('number');
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
