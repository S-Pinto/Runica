import { describe, it, expect } from 'vitest';
import type { EquipmentItem, ICharacter } from '../characterTypes';
import { createNewCharacter } from './defaults';
import {
    buildCharacterActions, formatActionDamage, formatActionDamageLines, formatActionHit, getDamageBlocks,
    resolveWeaponAction, rollDamage, spendActionUse,
} from './attacks';
import { getItemPowers, hasActivePower, normalizeItemForSave } from './equipment';
import { longRestUpdate, shortRestUpdate } from './rest';

const item = (o: Partial<EquipmentItem> = {}): EquipmentItem =>
    ({ id: 'i', name: 'Oggetto', quantity: 1, description: '', equipped: true, ...o });
const make = (equipment: EquipmentItem[], o: Partial<ICharacter> = {}): ICharacter => ({
    ...createNewCharacter(), proficiencyBonus: 3, equipment,
    abilityScores: { ...createNewCharacter().abilityScores, strength: 18, wisdom: 16 }, spellcastingAbility: 'wisdom', ...o,
});
/** Generatore che restituisce i valori indicati in ordine (poi ripete l'ultimo). */
const seq = (...values: number[]) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };
const face = (n: number, faces: number) => (n - 0.5) / faces;

// Spadone +2: 2d6 + FOR + 2 taglienti + 2d6 fuoco.
const greatsword = item({
    id: 'gs', name: 'Spadone infuocato', itemType: 'weapon', damage: '2d6', damageType: 'Slashing', attackBonus: '+2',
    properties: ['Heavy', 'Two-Handed'], additionalDamage: [{ formula: '2d6', type: 'Fire' }],
});

describe('danni multi-componente', () => {
    const c = make([greatsword]);
    const a = resolveWeaponAction(c, greatsword);

    it('formula completa e blocchi separati', () => {
        expect(formatActionHit(a)).toBe('+9');
        expect(formatActionDamage(a)).toBe('2d6 + 6 Tagliente + 2d6 Fuoco');
        expect(formatActionDamageLines(a)).toEqual(['2d6 + 6 Tagliente', '2d6 Fuoco']);
        expect(getDamageBlocks(a).map(b => b.primary)).toEqual([true, false]);
    });
    it('ogni blocco ha il suo parziale, il totale è la somma', () => {
        const r = rollDamage(a, {}, seq(face(3, 6), face(4, 6), face(1, 6), face(5, 6)));
        expect(r.parts.map(p => ({ total: p.total, type: p.type, dice: p.dice, modifier: p.modifier }))).toEqual([
            { total: 13, type: 'Slashing', dice: [3, 4], modifier: 6 },
            { total: 6, type: 'Fire', dice: [1, 5], modifier: 0 },
        ]);
        expect(r.total).toBe(19);
        expect(r.value).toBe('19 (13 Tagliente + 6 Fuoco)');
        expect(r.parts[1].typeLabel).toBe('Fuoco');
    });
    it('critico: raddoppia i dadi di ogni blocco, non i modificatori', () => {
        const r = rollDamage(a, { crit: true }, () => face(6, 6));
        expect(r.parts.map(p => p.formula)).toEqual(['4d6 + 6', '4d6']);
        expect(r.parts.map(p => p.dice.length)).toEqual([4, 4]);
        expect(r.parts.map(p => p.total)).toEqual([30, 24]);
        expect(r.total).toBe(54);
        expect(r.isCrit).toBe(true);
    });
    it('blocchi extra senza formula si ignorano', () => {
        const w = { ...greatsword, additionalDamage: [{ formula: ' ', type: 'Fire' }] };
        expect(formatActionDamage(resolveWeaponAction(c, w))).toBe('2d6 + 6 Tagliente');
    });
});

describe('poteri su armature ed elmi', () => {
    // Elmo con un attacco a distanza 1/riposo breve: 1d8 + FOR perforante.
    const helm = item({
        id: 'h', name: 'Elmo magnetico', itemType: 'helmet',
        powers: [{
            id: 'p1', name: 'Giavellotto Magnetico', roll: 'attack', attackAbility: 'strength',
            damage: '1d8', damageType: 'Piercing', uses: { current: 1, max: 1, recovery: 'shortRest' },
        }],
    });

    it('compare tra le azioni con FOR per colpire e per i danni', () => {
        const action = buildCharacterActions(make([helm])).find(a => a.id === 'power-h-p1')!;
        expect(action).toMatchObject({ name: 'Giavellotto Magnetico', source: 'item', sourceId: 'h', powerId: 'p1', roll: 'attack', toHit: 7, uses: { current: 1, max: 1 }, recovery: 'short' });
        expect(formatActionDamage(action)).toBe('1d8 + 4 Perforante');
        expect(action.notes).toBe('Elmo magnetico');
    });
    it('non equipaggiato: nessuna azione', () => {
        expect(buildCharacterActions(make([{ ...helm, equipped: false }])).some(a => a.sourceId === 'h')).toBe(false);
    });
    it('spendere un uso aggiorna il potere; il riposo breve lo ricarica', () => {
        const c = make([helm]);
        const action = buildCharacterActions(c).find(a => a.id === 'power-h-p1')!;
        const spent = { ...c, ...spendActionUse(c, action, -1) } as ICharacter;
        expect(spent.equipment[0].powers![0].uses!.current).toBe(0);
        expect(shortRestUpdate(spent).equipment![0].powers![0].uses!.current).toBe(1);
        expect(longRestUpdate(spent).equipment![0].powers![0].uses!.current).toBe(1);
    });
    it('un potere a riposo lungo non si ricarica con il breve', () => {
        const c = make([item({ id: 'x', powers: [{ id: 'q', name: 'Q', roll: 'none', uses: { current: 0, max: 2, recovery: 'longRest' } }] })]);
        expect(shortRestUpdate(c).equipment![0].powers![0].uses!.current).toBe(0);
        expect(longRestUpdate(c).equipment![0].powers![0].uses!.current).toBe(2);
    });
    it('armatura con tiro salvezza e danni extra; più poteri sullo stesso oggetto', () => {
        const plate = item({
            id: 'pl', name: 'Embarmor', itemType: 'armor', armorType: 'heavy', armorClass: 18,
            charges: { current: 3, max: 3, resetType: 'longRest' },
            powers: [
                { id: 'a', name: 'Fuoco della Ripercussione', roll: 'save', saveAbility: 'dexterity', damage: '2d6', damageType: 'Fire', additionalDamage: [{ formula: '1d4', type: 'Radiant' }], chargeCost: 2 },
                { id: 'b', name: 'Scintilla', roll: 'none' },
            ],
        });
        const c = make([plate]);
        const actions = buildCharacterActions(c, { include: ['item'] });
        expect(actions.map(a => a.id)).toEqual(['power-pl-a', 'power-pl-b']);
        const fire = actions[0];
        expect(formatActionHit(fire)).toBe('CD 14 DES');
        expect(formatActionDamage(fire)).toBe('2d6 Fuoco + 1d4 Radioso');
        expect(fire).toMatchObject({ uses: { current: 3, max: 3 }, chargeCost: 2 });
        const after = { ...c, ...spendActionUse(c, fire, -1) } as ICharacter;
        expect(after.equipment[0].charges!.current).toBe(1);
    });
    it('arma con un potere: azione dell\'arma più quella del potere', () => {
        const w = { ...greatsword, powers: [{ id: 'z', name: 'Vampata', roll: 'save' as const, saveAbility: 'constitution' as const, saveDC: 15 }] };
        const ids = buildCharacterActions(make([w])).map(a => a.id);
        expect(ids).toEqual(['gs', 'power-gs-z']);
        expect(formatActionHit(buildCharacterActions(make([w]))[1])).toBe('CD 15 COS');
    });
    it('senza sintonia il potere resta visibile ma segnalato', () => {
        const a = buildCharacterActions(make([{ ...helm, requiresAttunement: true, isAttuned: false }])).find(x => x.sourceId === 'h')!;
        expect(a.attunementMissing).toBe(true);
    });
});

describe('retrocompatibilità del potere vecchio', () => {
    const wand = item({
        id: 'wand', name: 'Bacchetta', itemType: 'wondrous', grantsSpellName: 'Dardo incantato', damage: '3d4', damageType: 'Force',
        charges: { current: 2, max: 3, resetType: 'longRest' },
    });

    it('stesso id, stessi valori di prima e cariche dell\'oggetto', () => {
        const a = buildCharacterActions(make([wand])).find(x => x.id === 'magic-wand')!;
        expect(a).toMatchObject({ name: 'Dardo incantato', roll: 'attack', toHit: 6, damage: '3d4', uses: { current: 2, max: 3 }, recovery: 'long', notes: 'Bacchetta' });
        const after = { ...make([wand]), ...spendActionUse(make([wand]), a, -1) } as ICharacter;
        expect(after.equipment[0].charges!.current).toBe(1);
    });
    it('dopo il salvataggio dal form l\'azione è identica', () => {
        const before = buildCharacterActions(make([wand]))[0];
        const saved = { ...normalizeItemForSave(wand), id: 'wand' };
        expect(saved.damage).toBeUndefined();
        const after = buildCharacterActions(make([saved]))[0];
        expect({ ...after, powerId: undefined }).toEqual({ ...before, powerId: undefined });
    });
    it('`powers: []` disattiva il potere vecchio; le armi non hanno poteri vecchi', () => {
        expect(hasActivePower({ ...wand, powers: [] })).toBe(false);
        expect(getItemPowers(greatsword)).toEqual([]);
        expect(hasActivePower(item({ itemType: 'armor', powers: [{ id: 'x', name: 'X', roll: 'none' }] }))).toBe(true);
    });
});
