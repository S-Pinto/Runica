// Test delle regole Firestore con l'emulatore: `npm run test:rules`
// (avvia l'emulatore con `firebase emulators:exec` e lancia questo file con vitest.rules.config.ts).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
    assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
    arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch,
    type Firestore,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-runica';
const CAMPAIGN = 'camp1';
const CODE = 'ABCDEF';
const NOW = Date.now();

let env: RulesTestEnvironment;

const db = (uid: string | null): Firestore =>
    (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore() as unknown as Firestore;

const member = (role: 'dm' | 'player', extra: Record<string, unknown> = {}) => ({
    role, displayName: role === 'dm' ? 'Marta' : 'Luca', joinedAt: NOW, ...extra,
});

const sharedV2 = (ownerUid: string, extra: Record<string, unknown> = {}) => ({
    ownerUid, name: 'Thalia', class: 'Maga', subclass: '', race: 'Elfa', level: 5,
    vitals: 'wounded', conditions: [], heroicInspiration: false, schemaVersion: 2, lastUpdated: NOW, ...extra,
});

const liveStats = (ownerUid: string, extra: Record<string, unknown> = {}) => ({
    ownerUid,
    hp: { current: 23, max: 38, temp: 5 },
    armorClass: 15, speed: 30,
    passives: { perception: 13, insight: 11, investigation: 15 },
    spellSaveDC: 14, heroicInspiration: false,
    spellSlots: { 1: { max: 4, used: 2 } },
    conditions: [], deathSaves: { successes: 0, failures: 0 }, hitDice: { total: '5d6', used: 0 },
    lastUpdated: NOW, ...extra,
});

interface SeedOptions {
    settings?: Record<string, unknown>;
    members?: string[];
    inviteExtra?: Record<string, unknown>;
}

/** Campagna camp1 con DM `dm`, invito ABCDEF e i giocatori indicati già dentro. */
const seed = async ({ settings, members = [], inviteExtra = {} }: SeedOptions = {}) => {
    await env.withSecurityRulesDisabled(async (ctx) => {
        const admin = ctx.firestore() as unknown as Firestore;
        await setDoc(doc(admin, 'campaigns', CAMPAIGN), {
            name: 'La Tomba', description: '', ownerUid: 'dm', memberUids: ['dm', ...members],
            inviteCode: CODE, createdAt: NOW, updatedAt: NOW, ...(settings ? { settings } : {}),
        });
        await setDoc(doc(admin, 'campaigns', CAMPAIGN, 'members', 'dm'), member('dm'));
        for (const uid of members) {
            await setDoc(doc(admin, 'campaigns', CAMPAIGN, 'members', uid), member('player', { joinCode: CODE }));
        }
        await setDoc(doc(admin, 'campaignInvites', CODE), { campaignId: CAMPAIGN, ownerUid: 'dm', createdAt: NOW, campaignName: 'La Tomba', dmName: 'Marta', ...inviteExtra });
    });
};

const joinBatch = (uid: string, joinCode: string | undefined) => {
    const fs = db(uid);
    const batch = writeBatch(fs);
    batch.set(doc(fs, 'campaigns', CAMPAIGN, 'members', uid), member('player', joinCode ? { joinCode } : {}));
    batch.update(doc(fs, 'campaigns', CAMPAIGN), { memberUids: arrayUnion(uid), updatedAt: NOW });
    return batch.commit();
};

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') },
    });
});

afterAll(async () => {
    await env?.cleanup();
});

beforeEach(async () => {
    await env.clearFirestore();
});

describe('schede private', () => {
    it('solo il proprietario legge e scrive i propri personaggi', async () => {
        await assertSucceeds(setDoc(doc(db('p1'), 'users/p1/characters/c1'), { name: 'Thalia', level: 5 }));
        await assertSucceeds(getDoc(doc(db('p1'), 'users/p1/characters/c1')));
        await assertFails(getDoc(doc(db('dm'), 'users/p1/characters/c1')));
        await assertFails(setDoc(doc(db('dm'), 'users/p1/characters/c1'), { name: 'x' }));
    });
});

describe('creazione della campagna', () => {
    it('il DM crea campagna, membro e invito nello stesso batch', async () => {
        const fs = db('dm');
        const batch = writeBatch(fs);
        batch.set(doc(fs, 'campaigns', 'new1'), {
            name: 'Nuova', description: '', ownerUid: 'dm', memberUids: ['dm'], inviteCode: 'QWERTY',
            createdAt: NOW, updatedAt: NOW, settings: { partyVitals: 'numeric', playerPosts: true }, schemaVersion: 2,
        });
        batch.set(doc(fs, 'campaigns', 'new1', 'members', 'dm'), member('dm'));
        batch.set(doc(fs, 'campaignInvites', 'QWERTY'), { campaignId: 'new1', ownerUid: 'dm', createdAt: NOW, campaignName: 'Nuova', dmName: 'Marta' });
        await assertSucceeds(batch.commit());
    });

    it('rifiuta impostazioni non valide', async () => {
        await assertFails(setDoc(doc(db('dm'), 'campaigns', 'bad'), {
            name: 'X', ownerUid: 'dm', memberUids: ['dm'], inviteCode: 'QWERTY', createdAt: NOW, updatedAt: NOW,
            settings: { partyVitals: 'tutto' },
        }));
    });

    it('non si crea una campagna a nome di un altro', async () => {
        await assertFails(setDoc(doc(db('p1'), 'campaigns', 'bad'), {
            name: 'X', ownerUid: 'dm', memberUids: ['dm'], inviteCode: 'QWERTY', createdAt: NOW, updatedAt: NOW,
        }));
    });
});

describe('inviti e privacy', () => {
    beforeEach(() => seed());

    it('chi ha il codice risolve l\'invito, ma non può elencarli', async () => {
        await assertSucceeds(getDoc(doc(db('p1'), 'campaignInvites', CODE)));
        await assertFails(getDocs(collection(db('p1'), 'campaignInvites')));
        await assertFails(getDoc(doc(db(null), 'campaignInvites', CODE)));
    });

    it('un codice inesistente risponde "non esiste", non "permessi"', async () => {
        await assertSucceeds(getDoc(doc(db('p1'), 'campaignInvites', 'ZZZZZZ')));
    });

    it('un invito scaduto non si legge (tranne dal DM)', async () => {
        await env.clearFirestore();
        await seed({ inviteExtra: { expiresAt: NOW - 1000 } });
        await assertFails(getDoc(doc(db('p1'), 'campaignInvites', CODE)));
        await assertSucceeds(getDoc(doc(db('dm'), 'campaignInvites', CODE)));
    });

    it('nessuno elenca le campagne altrui', async () => {
        await assertFails(getDocs(collection(db('p1'), 'campaigns')));
        await assertFails(getDoc(doc(db('p1'), 'campaigns', CAMPAIGN)));
        await assertSucceeds(getDocs(query(collection(db('p1'), 'campaigns'), where('memberUids', 'array-contains', 'p1'))));
        await assertSucceeds(getDocs(query(collection(db('dm'), 'campaigns'), where('memberUids', 'array-contains', 'dm'))));
    });

    it('un non membro legge solo il proprio documento membro', async () => {
        await assertSucceeds(getDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'members', 'p1')));
        await assertFails(getDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'members', 'dm')));
        await assertFails(getDocs(collection(db('p1'), 'campaigns', CAMPAIGN, 'members')));
    });

    it('il DM aggiorna l\'anteprima dell\'invito, gli altri no', async () => {
        await assertSucceeds(updateDoc(doc(db('dm'), 'campaignInvites', CODE), { campaignName: 'Nuovo nome' }));
        await assertFails(updateDoc(doc(db('p1'), 'campaignInvites', CODE), { campaignName: 'Hack' }));
        await assertFails(updateDoc(doc(db('dm'), 'campaignInvites', CODE), { campaignId: 'altra' }));
    });
});

describe('unione con codice', () => {
    beforeEach(() => seed());

    it('entra con un codice valido e poi legge campagna e membri', async () => {
        await assertSucceeds(joinBatch('p1', CODE));
        await assertSucceeds(getDoc(doc(db('p1'), 'campaigns', CAMPAIGN)));
        await assertSucceeds(getDocs(collection(db('p1'), 'campaigns', CAMPAIGN, 'members')));
    });

    it('rifiuta un codice sbagliato o assente', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore() as unknown as Firestore, 'campaignInvites', 'OTHER2'), { campaignId: 'altra', ownerUid: 'x', createdAt: NOW });
        });
        await assertFails(joinBatch('p1', 'OTHER2'));
        await assertFails(joinBatch('p1', 'NOPE22'));
        await assertFails(joinBatch('p1', undefined));
    });

    it('rifiuta un codice scaduto', async () => {
        await env.clearFirestore();
        await seed({ inviteExtra: { expiresAt: NOW - 1000 } });
        await assertFails(joinBatch('p1', CODE));
    });

    it('non si aggiunge un altro utente al posto proprio', async () => {
        const fs = db('p1');
        const batch = writeBatch(fs);
        batch.set(doc(fs, 'campaigns', CAMPAIGN, 'members', 'p1'), member('player', { joinCode: CODE }));
        batch.update(doc(fs, 'campaigns', CAMPAIGN), { memberUids: arrayUnion('p1', 'p2'), updatedAt: NOW });
        await assertFails(batch.commit());
    });

    it('non si entra come DM', async () => {
        const fs = db('p1');
        const batch = writeBatch(fs);
        batch.set(doc(fs, 'campaigns', CAMPAIGN, 'members', 'p1'), member('dm', { joinCode: CODE }));
        batch.update(doc(fs, 'campaigns', CAMPAIGN), { memberUids: arrayUnion('p1'), updatedAt: NOW });
        await assertFails(batch.commit());
    });
});

describe('membri: uscita, rimozione, personaggio attivo', () => {
    beforeEach(() => seed({ members: ['p1', 'p2'] }));

    it('il giocatore sceglie il proprio personaggio attivo, non quello degli altri', async () => {
        await assertSucceeds(updateDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'members', 'p1'), { activeCharacterId: 'c1' }));
        await assertFails(updateDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'members', 'p2'), { activeCharacterId: 'c1' }));
        await assertFails(updateDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'members', 'p1'), { role: 'dm' }));
    });

    it('il giocatore esce da solo, il DM no', async () => {
        const fs = db('p1');
        const batch = writeBatch(fs);
        batch.delete(doc(fs, 'campaigns', CAMPAIGN, 'members', 'p1'));
        batch.update(doc(fs, 'campaigns', CAMPAIGN), { memberUids: arrayRemove('p1'), updatedAt: NOW });
        await assertSucceeds(batch.commit());
        await assertFails(updateDoc(doc(db('dm'), 'campaigns', CAMPAIGN), { memberUids: arrayRemove('dm'), updatedAt: NOW }));
    });

    it('il DM rimuove un giocatore; un giocatore non rimuove gli altri', async () => {
        await assertFails(updateDoc(doc(db('p1'), 'campaigns', CAMPAIGN), { memberUids: arrayRemove('p2'), updatedAt: NOW }));
        await assertSucceeds(updateDoc(doc(db('dm'), 'campaigns', CAMPAIGN), { memberUids: arrayRemove('p2'), updatedAt: NOW }));
    });

    it('solo il DM cambia le impostazioni', async () => {
        await assertSucceeds(updateDoc(doc(db('dm'), 'campaigns', CAMPAIGN), { settings: { partyVitals: 'narrative', playerPosts: false }, updatedAt: NOW }));
        await assertFails(updateDoc(doc(db('p1'), 'campaigns', CAMPAIGN), { settings: { partyVitals: 'numeric', playerPosts: true }, updatedAt: NOW }));
    });
});

describe('proiezione party (sharedCharacters)', () => {
    it('un membro pubblica il proprio personaggio; un esterno no', async () => {
        await seed({ members: ['p1'] });
        await assertSucceeds(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1'), sharedV2('p1')));
        await assertSucceeds(getDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1')));
        await assertFails(setDoc(doc(db('x'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c9'), sharedV2('x')));
        await assertFails(getDoc(doc(db('x'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1')));
    });

    it('nessuno sovrascrive il personaggio di un altro', async () => {
        await seed({ members: ['p1', 'p2'] });
        await assertSucceeds(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1'), sharedV2('p1')));
        await assertFails(setDoc(doc(db('p2'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1'), sharedV2('p2')));
    });

    it('rifiuta i campi numerici v1 e i riepiloghi senza schemaVersion 2, in qualunque modalità', async () => {
        await seed({ members: ['p1'] });
        const ref = doc(db('p1'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1');
        await assertFails(setDoc(ref, sharedV2('p1', { hpCurrent: 3, hpMax: 10, hpTemp: 0, armorClass: 12 })));
        await assertFails(setDoc(ref, sharedV2('p1', { schemaVersion: 1 })));
        const { schemaVersion: _omit, ...withoutVersion } = sharedV2('p1');
        await assertFails(setDoc(ref, withoutVersion));
        await assertSucceeds(setDoc(ref, sharedV2('p1')));
    });

    it('un riepilogo v1 rimasto si sostituisce per intero, non con un merge', async () => {
        await seed({ members: ['p1'] });
        await env.withSecurityRulesDisabled(async (ctx) => {
            const admin = ctx.firestore() as unknown as Firestore;
            await setDoc(doc(admin, 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1'), { ownerUid: 'p1', name: 'Thalia', level: 5, hpCurrent: 3, hpMax: 10, lastUpdated: NOW });
        });
        const ref = doc(db('p1'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1');
        await assertFails(setDoc(ref, sharedV2('p1'), { merge: true }));
        await assertSucceeds(setDoc(ref, sharedV2('p1')));
    });

    it('rifiuta campi sconosciuti o valori fuori elenco', async () => {
        await seed({ members: ['p1'] });
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1'), sharedV2('p1', { notes: 'segreto' })));
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'sharedCharacters', 'c1'), sharedV2('p1', { vitals: 'morto' })));
    });
});

describe('proiezione tavolo (liveStats)', () => {
    const publish = (uid: string, id: string) =>
        setDoc(doc(db(uid), 'campaigns', CAMPAIGN, 'liveStats', id), liveStats(uid));

    it('in modalità numerica DM e gruppo leggono i numeri', async () => {
        await seed({ members: ['p1', 'p2'] });
        await assertSucceeds(publish('p1', 'c1'));
        await assertSucceeds(getDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'liveStats', 'c1')));
        await assertSucceeds(getDoc(doc(db('p2'), 'campaigns', CAMPAIGN, 'liveStats', 'c1')));
        await assertSucceeds(getDocs(collection(db('p2'), 'campaigns', CAMPAIGN, 'liveStats')));
        await assertFails(getDoc(doc(db('x'), 'campaigns', CAMPAIGN, 'liveStats', 'c1')));
    });

    it('in modalità narrativa solo DM e proprietario', async () => {
        await seed({ members: ['p1', 'p2'], settings: { partyVitals: 'narrative', playerPosts: true } });
        await assertSucceeds(publish('p1', 'c1'));
        await assertSucceeds(getDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'liveStats', 'c1')));
        await assertSucceeds(getDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'liveStats', 'c1')));
        await assertSucceeds(getDocs(query(collection(db('p1'), 'campaigns', CAMPAIGN, 'liveStats'), where('ownerUid', '==', 'p1'))));
        await assertFails(getDoc(doc(db('p2'), 'campaigns', CAMPAIGN, 'liveStats', 'c1')));
        await assertFails(getDocs(collection(db('p2'), 'campaigns', CAMPAIGN, 'liveStats')));
    });

    it('solo il proprietario scrive, con lo schema atteso', async () => {
        await seed({ members: ['p1', 'p2'] });
        await assertSucceeds(publish('p1', 'c1'));
        await assertFails(setDoc(doc(db('p2'), 'campaigns', CAMPAIGN, 'liveStats', 'c1'), liveStats('p2')));
        await assertFails(setDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'liveStats', 'c1'), liveStats('dm')));
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'liveStats', 'c2'), liveStats('p1', { hp: { current: 'tanti' } })));
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'liveStats', 'c2'), liveStats('p1', { notes: 'x' })));
        await assertSucceeds(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'liveStats', 'c2'), liveStats('p1', { spellSaveDC: null, appliedActionIds: ['a1'] })));
    });

    it('il DM può ritirare un riepilogo', async () => {
        await seed({ members: ['p1'] });
        await assertSucceeds(publish('p1', 'c1'));
        await assertSucceeds(deleteDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'liveStats', 'c1')));
    });
});

describe('azioni del DM', () => {
    const action = (createdBy: string, extra: Record<string, unknown> = {}) => ({
        type: 'longRest', targets: ['c1'], createdBy, createdAt: NOW, expiresAt: NOW + 12 * 3600_000, ...extra,
    });

    it('le crea solo il DM, le leggono i membri', async () => {
        await seed({ members: ['p1'] });
        await assertSucceeds(setDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'dmActions', 'a1'), action('dm')));
        await assertSucceeds(getDocs(collection(db('p1'), 'campaigns', CAMPAIGN, 'dmActions')));
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'dmActions', 'a2'), action('p1')));
        await assertFails(getDocs(collection(db('x'), 'campaigns', CAMPAIGN, 'dmActions')));
        await assertFails(updateDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'dmActions', 'a1'), { type: 'shortRest' }));
    });

    it('rifiuta tipi sconosciuti e scadenze oltre 24 ore', async () => {
        await seed();
        await assertFails(setDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'dmActions', 'a1'), action('dm', { type: 'kill' })));
        await assertFails(setDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'dmActions', 'a1'), action('dm', { expiresAt: NOW + 2 * 86400000 })));
        await assertFails(setDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'dmActions', 'a1'), action('dm', { targets: [] })));
    });
});

describe('bacheca e note segrete', () => {
    const post = (authorUid: string, extra: Record<string, unknown> = {}) => ({
        authorUid, authorName: 'Luca', text: 'Ciao', pinned: false, createdAt: NOW, updatedAt: NOW, ...extra,
    });

    it('i membri scrivono, solo il DM fissa', async () => {
        await seed({ members: ['p1', 'p2'] });
        await assertSucceeds(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'board', 'm1'), post('p1')));
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'board', 'm2'), post('p1', { pinned: true })));
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'board', 'm3'), post('p2')));
        await assertSucceeds(updateDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'board', 'm1'), { pinned: true, updatedAt: NOW }));
        await assertFails(updateDoc(doc(db('p2'), 'campaigns', CAMPAIGN, 'board', 'm1'), { text: 'modificato', updatedAt: NOW }));
        await assertSucceeds(updateDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'board', 'm1'), { text: 'modificato', updatedAt: NOW }));
        await assertSucceeds(deleteDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'board', 'm1')));
    });

    it('con la bacheca chiusa scrive solo il DM', async () => {
        await seed({ members: ['p1'], settings: { partyVitals: 'numeric', playerPosts: false } });
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'board', 'm1'), post('p1')));
        await assertSucceeds(setDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'board', 'm1'), post('dm', { pinned: true })));
    });

    it('le note segrete sono solo del DM', async () => {
        await seed({ members: ['p1'] });
        await assertSucceeds(setDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'dmPrivate', 'notes'), { text: 'Il re è un doppleganger', updatedAt: NOW }));
        await assertSucceeds(getDoc(doc(db('dm'), 'campaigns', CAMPAIGN, 'dmPrivate', 'notes')));
        await assertFails(getDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'dmPrivate', 'notes')));
        await assertFails(setDoc(doc(db('p1'), 'campaigns', CAMPAIGN, 'dmPrivate', 'notes'), { text: 'x', updatedAt: NOW }));
    });
});
