import { describe, it, expect } from 'vitest';
import {
    applyDmAction, appendAppliedAction, buildDmAction, canDeletePost, canEditPost, canPostOnBoard, describeAgo,
    dmActionProgress, isDmActionActive, isStale, pendingActionsFor, pendingDmActions, slotSummary,
    sortBoardPosts, sortParty, undoPatchFor, APPLIED_ACTIONS_LIMIT, DM_ACTION_TTL_MS, STALE_AFTER_MS,
} from './campaign';
import { createNewCharacter } from './defaults';
import type { ICharacter, IDmAction } from '../characterTypes';

const NOW = 1_700_000_000_000;

const hero = (overrides: Partial<ICharacter> = {}): ICharacter => ({ ...createNewCharacter(), id: 'c1', ...overrides });

const action = (id: string, overrides: Partial<IDmAction> = {}): IDmAction => ({
    id, type: 'grantInspiration', targets: ['c1'], createdBy: 'dm', createdAt: NOW, expiresAt: NOW + DM_ACTION_TTL_MS, ...overrides,
});

describe('azioni del DM', () => {
    it('costruisce un\'azione con scadenza di 12 ore e destinatari unici', () => {
        const built = buildDmAction('longRest', ['a', 'b', 'a'], 'dm', NOW);
        expect(built).toEqual({ type: 'longRest', targets: ['a', 'b'], createdBy: 'dm', createdAt: NOW, expiresAt: NOW + DM_ACTION_TTL_MS });
        expect(isDmActionActive(built, NOW + DM_ACTION_TTL_MS - 1)).toBe(true);
        expect(isDmActionActive(built, NOW + DM_ACTION_TTL_MS)).toBe(false);
    });

    it('limita i destinatari a 12 (regole Firestore)', () => {
        const targets = Array.from({ length: 20 }, (_, i) => `c${i}`);
        expect(buildDmAction('shortRest', targets, 'dm', NOW).targets).toHaveLength(12);
    });

    it('ispirazione: concede e revoca solo se cambia qualcosa', () => {
        expect(applyDmAction(hero({ inspiration: 0 }), 'grantInspiration')).toEqual({ kind: 'patch', patch: { inspiration: 1 } });
        expect(applyDmAction(hero({ inspiration: 1 }), 'grantInspiration')).toBeNull();
        expect(applyDmAction(hero({ inspiration: 1 }), 'revokeInspiration')).toEqual({ kind: 'patch', patch: { inspiration: 0 } });
        expect(applyDmAction(hero({ inspiration: 0 }), 'revokeInspiration')).toBeNull();
    });

    it('riposo lungo: ripristina PF e slot; riposo breve: lo sceglie il giocatore', () => {
        const tired = hero({
            hp: { current: 3, max: 30, temporary: 4 },
            spellSlots: { ...createNewCharacter().spellSlots, 1: { max: 3, used: 2 } },
        });
        const effect = applyDmAction(tired, 'longRest');
        expect(effect?.kind).toBe('patch');
        const patch = effect && effect.kind === 'patch' ? effect.patch : {};
        expect(patch.hp).toEqual({ current: 30, max: 30, temporary: 0 });
        expect(patch.spellSlots?.[1]).toEqual({ max: 3, used: 0 });
        expect(applyDmAction(tired, 'shortRest')).toEqual({ kind: 'prompt' });
    });

    it('l\'annullamento riporta i campi toccati ai valori di prima', () => {
        const before = hero({ hp: { current: 3, max: 30, temporary: 4 }, inspiration: 0 });
        const effect = applyDmAction(before, 'longRest');
        const patch = effect && effect.kind === 'patch' ? effect.patch : {};
        const undo = undoPatchFor(before, patch);
        expect(Object.keys(undo).sort()).toEqual(Object.keys(patch).sort());
        const restored = { ...before, ...patch, ...undo };
        expect(restored.hp).toEqual(before.hp);
        expect(restored.spellSlots).toEqual(before.spellSlots);
    });

    it('trova le azioni da applicare solo per i propri personaggi, le più vecchie prima', () => {
        const actions = [
            action('late', { createdAt: NOW + 10, targets: ['c1', 'other'] }),
            action('early', { createdAt: NOW }),
            action('expired', { expiresAt: NOW - 1 }),
            action('done'),
        ];
        const applied = new Set(['c1:done']);
        const pending = pendingDmActions(actions, new Set(['c1']), (c, a) => applied.has(`${c}:${a}`), NOW);
        expect(pending.map((p) => `${p.action.id}:${p.characterId}`)).toEqual(['early:c1', 'late:c1']);
    });

    it('ricorda al massimo 30 azioni applicate, senza doppioni', () => {
        const ids = Array.from({ length: APPLIED_ACTIONS_LIMIT }, (_, i) => `a${i}`);
        const next = appendAppliedAction(ids, 'new');
        expect(next).toHaveLength(APPLIED_ACTIONS_LIMIT);
        expect(next[next.length - 1]).toBe('new');
        expect(next[0]).toBe('a1');
        expect(appendAppliedAction(['x', 'y'], 'x')).toEqual(['y', 'x']);
        expect(appendAppliedAction(undefined, 'x')).toEqual(['x']);
    });

    it('conta chi ha applicato e cosa resta in attesa', () => {
        const a = action('a1', { targets: ['c1', 'c2'] });
        const live = new Map([['c1', { appliedActionIds: ['a1'] }], ['c2', { appliedActionIds: [] }]]);
        expect(dmActionProgress(a, live)).toEqual({ applied: 1, total: 2 });
        expect(pendingActionsFor('c2', [a], live.get('c2'), NOW).map((x) => x.id)).toEqual(['a1']);
        expect(pendingActionsFor('c1', [a], live.get('c1'), NOW)).toEqual([]);
        expect(pendingActionsFor('c2', [a], live.get('c2'), a.expiresAt)).toEqual([]);
    });
});

describe('tavolo', () => {
    const party = [{ id: 'a', name: 'Brom' }, { id: 'b', name: 'Aela' }, { id: 'c', name: 'Cora' }, { id: 'd', name: 'Dax' }];
    const live = new Map([
        ['a', { hp: { current: 5, max: 20, temp: 0 } }],
        ['b', { hp: { current: 30, max: 30, temp: 0 } }],
        ['c', { hp: { current: 0, max: 10, temp: 0 } }],
    ]);

    it('ordina per nome o per PF più bassi (chi non ha numeri in fondo)', () => {
        expect(sortParty(party, 'name', live).map((c) => c.id)).toEqual(['b', 'a', 'c', 'd']);
        expect(sortParty(party, 'hp', live).map((c) => c.id)).toEqual(['c', 'a', 'b', 'd']);
    });

    it('segnala i dati vecchi e descrive il tempo trascorso', () => {
        expect(isStale(NOW - STALE_AFTER_MS - 1, NOW)).toBe(true);
        expect(isStale(NOW - 1000, NOW)).toBe(false);
        expect(isStale(undefined, NOW)).toBe(true);
        expect(describeAgo(NOW - 20_000, NOW)).toBe('adesso');
        expect(describeAgo(NOW - 3 * 60_000, NOW)).toBe('3 min fa');
        expect(describeAgo(NOW - 2 * 3_600_000, NOW)).toBe('2 h fa');
        expect(describeAgo(NOW - 30 * 3_600_000, NOW)).toBe('ieri');
        expect(describeAgo(NOW - 4 * 86_400_000, NOW)).toBe('4 giorni fa');
        expect(describeAgo(undefined, NOW)).toBe('mai');
    });

    it('riassume gli slot per livello, in ordine', () => {
        expect(slotSummary({ 3: { max: 2, used: 2 }, 1: { max: 4, used: 1 }, 2: { max: 0, used: 0 } })).toEqual([
            { level: '1', max: 4, available: 3 },
            { level: '3', max: 2, available: 0 },
        ]);
        expect(slotSummary(undefined)).toEqual([]);
    });
});

describe('bacheca', () => {
    it('fissati in alto, poi i più recenti', () => {
        const posts = [
            { id: '1', pinned: false, createdAt: 1 },
            { id: '2', pinned: true, createdAt: 2 },
            { id: '3', pinned: false, createdAt: 3 },
            { id: '4', pinned: true, createdAt: 0 },
        ];
        expect(sortBoardPosts(posts).map((p) => p.id)).toEqual(['2', '4', '3', '1']);
    });

    it('scrittura, modifica ed eliminazione secondo ruolo e impostazioni', () => {
        expect(canPostOnBoard({ settings: { partyVitals: 'numeric', playerPosts: false } }, 'dm')).toBe(true);
        expect(canPostOnBoard({ settings: { partyVitals: 'numeric', playerPosts: false } }, 'player')).toBe(false);
        expect(canPostOnBoard({}, 'player')).toBe(true);
        expect(canPostOnBoard({}, null)).toBe(false);
        const post = { authorUid: 'p1' };
        expect(canEditPost(post, 'p1')).toBe(true);
        expect(canEditPost(post, 'dm')).toBe(false);
        expect(canDeletePost(post, 'dm', 'dm')).toBe(true);
        expect(canDeletePost(post, 'p2', 'player')).toBe(false);
    });
});
