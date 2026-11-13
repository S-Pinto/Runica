import { describe, it, expect } from 'vitest';
import type { Attack, ICharacter } from '../characterTypes';
import { createNewCharacter } from './defaults';
import {
    addModifierToFormula, buildCharacterActions, formatActionDamage, formatActionHit, normalizeAbility, parseBonus,
    resolveCustomAttack, resolveWeaponAbility, resolveWeaponAction, rollAttack, rollDamage, spendActionUse, weaponMagicBonus,
} from './attacks';

type Item = ICharacter['equipment'][number];
const weapon = (o: Partial<Item> = {}): Item =>
    ({ id: 'w', name: 'Spada lunga', quantity: 1, description: '', equipped: true, itemType: 'weapon', damage: '1d8', ...o });
const scores = (o: Partial<ICharacter['abilityScores']>) => ({ ...createNewCharacter().abilityScores, ...o });
const make = (o: Partial<ICharacter> = {}): ICharacter => ({ ...createNewCharacter(), proficiencyBonus: 2, ...o });

/** Generatore che restituisce i valori indicati in ordine (poi ripete l'ultimo). */
const seq = (...values: number[]) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };
/** Valore che fa uscire `face` su un dado da `faces`. */
const face = (n: number, faces: number) => (n - 0.5) / faces;

describe('normalizzazione', () => {
    it('normalizeAbility accetta chiavi complete, abbreviazioni inglesi e italiane', () => {
        expect(normalizeAbility('strength')).toBe('strength');
        expect(normalizeAbility('str')).toBe('strength');
        expect(normalizeAbility('DEX')).toBe('dexterity');
        expect(normalizeAbility('sag')).toBe('wisdom');
        expect(normalizeAbility('')).toBeUndefined();
        expect(normalizeAbility('boh')).toBeUndefined();
    });
    it('parseBonus: interi con segno, formule e testo valgono 0', () => {
        expect(parseBonus('+1')).toBe(1);
        expect(parseBonus(' -2 ')).toBe(-2);
        expect(parseBonus('3')).toBe(3);
        expect(parseBonus(2)).toBe(2);
        expect(parseBonus('+1d4')).toBe(0);
        expect(parseBonus('magico')).toBe(0);
        expect(parseBonus(undefined)).toBe(0);
    });
    it('addModifierToFormula unisce la costante finale e gestisce il segno', () => {
        expect(addModifierToFormula('1d8', 3)).toBe('1d8 + 3');
        expect(addModifierToFormula('1d8+1', 3)).toBe('1d8 + 4');
        expect(addModifierToFormula('1d8 + 2', -2)).toBe('1d8');
        expect(addModifierToFormula('1d4', -1)).toBe('1d4 - 1');
        expect(addModifierToFormula('2d6+1d4', 2)).toBe('2d6 + 1d4 + 2');
        expect(addModifierToFormula('', 2)).toBe('2');
        expect(addModifierToFormula('', 0)).toBe('');
    });
});

describe('caratteristica delle armi', () => {
    const s = scores({ strength: 10, dexterity: 16 });
    it('mischia → FOR, a distanza → DES, da lancio → FOR', () => {
        expect(resolveWeaponAbility(s, [], undefined)).toBe('strength');
        expect(resolveWeaponAbility(s, ['Ammunition', 'Range'], undefined)).toBe('dexterity');
        expect(resolveWeaponAbility(s, ['Thrown', 'Range'], undefined)).toBe('strength');
    });
    it('Accurata usa la migliore fra FOR e DES (a parità FOR)', () => {
        expect(resolveWeaponAbility(s, ['Finesse'], undefined)).toBe('dexterity');
        expect(resolveWeaponAbility(scores({ strength: 18, dexterity: 14 }), ['Finesse'], undefined)).toBe('strength');
        expect(resolveWeaponAbility(scores({ strength: 14, dexterity: 14 }), ['Finesse'], undefined)).toBe('strength');
        expect(resolveWeaponAbility(s, ['Accurata'], undefined)).toBe('dexterity');
    });
    it('la scelta manuale vince sempre; `none` = nessuna', () => {
        expect(resolveWeaponAbility(s, ['Finesse'], 'str')).toBe('strength');
        expect(resolveWeaponAbility(s, [], 'charisma')).toBe('charisma');
        expect(resolveWeaponAbility(s, [], 'none')).toBeUndefined();
    });
    it('bonus magico: attackBonus, oppure armorClass nelle armi vecchie', () => {
        expect(weaponMagicBonus(weapon({ attackBonus: '+2' }))).toBe(2);
        expect(weaponMagicBonus(weapon({ armorType: 'weapon', armorClass: 1 }))).toBe(1);
        expect(weaponMagicBonus(weapon({ armorType: 'weapon', armorClass: 1, attackBonus: '+3' }))).toBe(3);
        expect(weaponMagicBonus(weapon({ armorClass: 14 }))).toBe(0);
    });
});

describe('resolveWeaponAction', () => {
    it('spada lunga +1, FOR 16, competente: +6 per colpire, 1d8 + 4', () => {
        const a = resolveWeaponAction(make({ abilityScores: scores({ strength: 16 }) }), weapon({ attackBonus: '+1', damageType: 'Slashing' }));
        expect(a.toHit).toBe(6);
        expect(a.hitParts).toEqual([{ label: 'FOR', value: 3 }, { label: 'Comp.', value: 2 }, { label: 'Magico', value: 1 }]);
        expect(a.damage).toBe('1d8 + 4');
        expect(formatActionHit(a)).toBe('+6');
        expect(formatActionDamage(a)).toBe('1d8 + 4 Tagliente');
        expect(a.editable).toBe(false);
    });
    it('stocco accurato con DES 18: usa DES per colpire e per i danni', () => {
        const c = make({ abilityScores: scores({ strength: 8, dexterity: 18 }), proficiencyBonus: 3 });
        const a = resolveWeaponAction(c, weapon({ name: 'Stocco', properties: ['Finesse'] }));
        expect(a.attackAbility).toBe('dexterity');
        expect(a.toHit).toBe(7);
        expect(a.damage).toBe('1d8 + 4');
    });
    it('arco lungo: DES anche senza scelta manuale', () => {
        const a = resolveWeaponAction(make({ abilityScores: scores({ dexterity: 14 }) }), weapon({ properties: ['Ammunition', 'Range', 'Heavy', 'Two-Handed'] }));
        expect(a.attackAbility).toBe('dexterity');
        expect(a.toHit).toBe(4);
    });
    it('competenza assente: niente bonus; FOR negativa riduce colpire e danni', () => {
        const a = resolveWeaponAction(make({ abilityScores: scores({ strength: 8 }) }), weapon({ isProficient: false }));
        expect(a.toHit).toBe(-1);
        expect(a.damage).toBe('1d8 - 1');
    });
    it('modificatore ai danni: abbreviazione salvata ("str") e nessuno', () => {
        const c = make({ abilityScores: scores({ strength: 16, dexterity: 14 }) });
        expect(resolveWeaponAction(c, weapon({ attackAbility: 'dex', damageAbility: 'str' })).damage).toBe('1d8 + 3');
        expect(resolveWeaponAction(c, weapon({ damageAbility: 'none' })).damage).toBe('1d8');
    });
    it('versatile: formula a due mani con gli stessi modificatori, bloccata dallo scudo', () => {
        const c = make({ abilityScores: scores({ strength: 16 }) });
        const w = weapon({ properties: ['Versatile'], versatileDamage: '1d10' });
        expect(resolveWeaponAction(c, w)).toMatchObject({ versatileDamage: '1d10 + 3', versatileBlocked: false });
        const withShield = make({ abilityScores: scores({ strength: 16 }), equipment: [w, { ...weapon({ id: 's', itemType: 'shield', damage: undefined }) }] });
        expect(resolveWeaponAction(withShield, w).versatileBlocked).toBe(true);
        expect(resolveWeaponAction(c, weapon({ versatileDamage: '1d10' })).versatileDamage).toBeUndefined();
    });
    it('senza sintonia il bonus magico non conta', () => {
        const c = make({ abilityScores: scores({ strength: 10 }) });
        const off = resolveWeaponAction(c, weapon({ attackBonus: '+2', requiresAttunement: true, isAttuned: false }));
        expect(off).toMatchObject({ toHit: 2, damage: '1d8', attunementMissing: true });
        const on = resolveWeaponAction(c, weapon({ attackBonus: '+2', requiresAttunement: true, isAttuned: true }));
        expect(on).toMatchObject({ toHit: 4, damage: '1d8 + 2', attunementMissing: false });
    });
    it('danno mancante: 1d6 di default; danni extra conservati', () => {
        const a = resolveWeaponAction(make(), weapon({ damage: '', additionalDamage: [{ formula: '1d6', type: 'Fire' }] }));
        expect(a.damage).toBe('1d6');
        expect(formatActionDamage(a)).toBe('1d6 + 1d6 Fuoco');
    });
    it('munizioni collegate solo con la regola opzionale attiva', () => {
        const bow = weapon({ properties: ['Ammunition', 'Range'], ammoItemId: 'arrows' });
        const arrows: Item = { id: 'arrows', name: 'Frecce', quantity: 20, description: '' };
        const off = make({ equipment: [bow, arrows] });
        expect(resolveWeaponAction(off, bow).ammo).toBeUndefined();
        const on = make({ equipment: [bow, arrows], optionalRules: { ammunition: true } });
        expect(resolveWeaponAction(on, bow).ammo).toEqual({ itemId: 'arrows', name: 'Frecce', quantity: 20 });
    });
});

describe('resolveCustomAttack', () => {
    const s = scores({ strength: 14, dexterity: 16 });
    it('caratteristica solo se scelta; il bonus vale per colpire e danni', () => {
        const atk: Attack = { id: 'a', name: 'Pugno', bonus: '+1', damage: '1d4', attackAbility: 'str', damageAbility: 'str', isProficient: true };
        const a = resolveCustomAttack(atk, s, 3);
        expect(a.toHit).toBe(2 + 3 + 1);
        expect(a.damage).toBe('1d4 + 3');
        expect(a.editable).toBe(true);
    });
    it('senza caratteristica né competenza: solo il bonus scritto', () => {
        expect(resolveCustomAttack({ id: 'a', name: 'Raggio', bonus: '+5', damage: '2d8' }, s, 3).toHit).toBe(5);
    });
    it('con tiro salvezza il bonus è la CD (10 se vuota)', () => {
        const a = resolveCustomAttack({ id: 'a', name: 'Soffio', bonus: '13', damage: '2d6', saveAbility: 'dex', damageType: 'Fire' }, s, 2);
        expect(a).toMatchObject({ roll: 'save', saveDC: 13, saveAbility: 'dexterity', damage: '2d6' });
        expect(formatActionHit(a)).toBe('CD 13 DES');
        expect(resolveCustomAttack({ id: 'b', name: 'X', bonus: '', damage: '', saveAbility: 'con' }, s, 2).saveDC).toBe(10);
    });
});

describe('buildCharacterActions', () => {
    const base = () => make({
        level: 1, proficiencyBonus: 2, spellcastingAbility: 'intelligence',
        abilityScores: scores({ strength: 16, intelligence: 16 }),
        equipment: [
            weapon({ id: 'w1', name: 'Ascia' }),
            weapon({ id: 'w2', name: 'Pugnale', equipped: false }),
            { id: 'leg', name: 'Mazza vecchia', quantity: 1, description: '', equipped: true, armorType: 'weapon', armorClass: 1, damage: '1d6' },
            { id: 'r', name: 'Anello', quantity: 1, description: '', equipped: true, itemType: 'ring', grantsSpellName: 'Dardo', saveAbility: 'dex', damage: '3d6' },
            { id: 'armor', name: 'Cotta', quantity: 1, description: '', equipped: true, itemType: 'armor', armorType: 'heavy', armorClass: 16 },
        ],
        spells: [
            { id: 'sp1', name: 'Dardo di fuoco', level: 0, damage: '1d10', damageType: 'Fire' } as ICharacter['spells'][number],
            { id: 'sp2', name: 'Luce', level: 0 } as ICharacter['spells'][number],
            { id: 'sp3', name: 'Palla di fuoco', level: 3, damage: '8d6' } as ICharacter['spells'][number],
        ],
        featuresAndTraits: [{ id: 'f1', name: 'Recuperare energie', description: '', category: 'class', isAction: true, recovery: 'short', uses: { current: 1, max: 1 } }],
        attacks: [{ id: 'a1', name: 'Pugno', bonus: '+0', damage: '1', attackAbility: 'str' }],
    });

    it('armi equipaggiate (anche vecchie), poteri, trucchetti con danni, privilegi, attacchi manuali', () => {
        const actions = buildCharacterActions(base());
        expect(actions.map(a => a.id)).toEqual(['w1', 'leg', 'magic-r', 'sp1', 'f1', 'a1']);
        expect(actions.find(a => a.id === 'leg')).toMatchObject({ toHit: 6, damage: '1d6 + 4' });
        expect(actions.find(a => a.id === 'magic-r')).toMatchObject({ name: 'Dardo', roll: 'save', saveDC: 13, saveAbility: 'dexterity' });
        expect(actions.find(a => a.id === 'sp1')).toMatchObject({ roll: 'attack', toHit: 5, damage: '1d10' });
        expect(actions.find(a => a.id === 'f1')).toMatchObject({ roll: 'none', uses: { current: 1, max: 1 }, recovery: 'short' });
    });
    it('filtra per fonte', () => {
        expect(buildCharacterActions(base(), { include: ['weapon'] }).map(a => a.id)).toEqual(['w1', 'leg']);
    });
    it("un attacco manuale con lo stesso nome di un'arma la sostituisce (nessun doppione)", () => {
        const c = base();
        c.attacks = [{ id: 'a2', name: 'ascia ', bonus: '+0', damage: '1d6' }];
        const ids = buildCharacterActions(c, { include: ['weapon', 'custom'] }).map(a => a.id);
        expect(ids).toEqual(['leg', 'a2']);
    });
    it('gli oggetti magici con potere che non sono equipaggiati non compaiono', () => {
        const c = base();
        c.equipment = c.equipment.map(i => (i.id === 'r' ? { ...i, equipped: false } : i));
        expect(buildCharacterActions(c, { include: ['item'] })).toEqual([]);
    });
});

describe('spendActionUse', () => {
    it('spende le cariche di un oggetto e gli usi di privilegi e attacchi manuali, entro 0..max', () => {
        const c = make({
            equipment: [{ id: 'r', name: 'Bacchetta', quantity: 1, description: '', equipped: true, itemType: 'wondrous', grantsSpellName: 'Dardo', charges: { current: 2, max: 7, resetType: 'dawn' } }],
            featuresAndTraits: [{ id: 'f1', name: 'F', description: '', category: 'class', isAction: true, uses: { current: 0, max: 2 } }],
            attacks: [{ id: 'a1', name: 'A', bonus: '', damage: '1', uses: { current: 1, max: 1 } }],
        });
        const [item, feat, custom] = buildCharacterActions(c);
        expect(spendActionUse(c, item, -1).equipment?.[0].charges?.current).toBe(1);
        expect(spendActionUse(c, item, 99).equipment?.[0].charges?.current).toBe(7);
        expect(spendActionUse(c, feat, 1).featuresAndTraits?.[0].uses?.current).toBe(1);
        expect(spendActionUse(c, feat, -5).featuresAndTraits?.[0].uses?.current).toBe(0);
        expect(spendActionUse(c, custom, -1).attacks?.[0].uses?.current).toBe(0);
        expect(spendActionUse(c, { ...custom, uses: undefined }, -1)).toEqual({});
    });
});

describe('tiri', () => {
    const action = resolveWeaponAction(make({ abilityScores: scores({ strength: 16 }) }), weapon({ damageType: 'Slashing', additionalDamage: [{ formula: '1d6', type: 'Fire' }] }));

    it('tiro per colpire: d20 + totale, critico con 20 e fallimento con 1', () => {
        const r = rollAttack(action, 'normal', seq(face(12, 20)));
        expect(r).toMatchObject({ natural: 12, total: 17, isCrit: false, isFumble: false });
        expect(r.breakdown).toBe('d20(12) + 3 FOR + 2 Comp.');
        expect(rollAttack(action, 'normal', seq(face(20, 20))).isCrit).toBe(true);
        expect(rollAttack(action, 'normal', seq(face(1, 20))).isFumble).toBe(true);
    });
    it('vantaggio tiene il più alto, svantaggio il più basso', () => {
        expect(rollAttack(action, 'advantage', seq(face(4, 20), face(17, 20)))).toMatchObject({ natural: 17, dice: [4, 17] });
        expect(rollAttack(action, 'disadvantage', seq(face(4, 20), face(17, 20)))).toMatchObject({ natural: 4, dice: [4, 17] });
    });
    it('danni: dado + modificatori + extra, con i tipi in italiano', () => {
        const r = rollDamage(action, {}, seq(face(5, 8), face(2, 6)));
        expect(r.total).toBe(5 + 3 + 2);
        expect(r.value).toBe('10 (8 Tagliente + 2 Fuoco)');
        expect(r.isCrit).toBe(false);
    });
    it('critico: raddoppia i dadi (anche extra), non i modificatori', () => {
        const r = rollDamage(action, { crit: true }, seq(face(8, 8), face(8, 8), face(6, 6), face(6, 6)));
        expect(r.total).toBe(8 + 8 + 3 + 6 + 6);
        expect(r.breakdown.startsWith('Critico, dadi raddoppiati')).toBe(true);
    });
    it('versatile usa la formula a due mani solo se esiste', () => {
        const v = resolveWeaponAction(make({ abilityScores: scores({ strength: 16 }) }), weapon({ properties: ['Versatile'], versatileDamage: '1d10' }));
        expect(rollDamage(v, { versatile: true }, seq(face(10, 10))).total).toBe(13);
        expect(rollDamage(action, { versatile: true }, seq(face(1, 8), face(1, 6))).versatile).toBe(false);
    });
    it('azione senza danni: totale 0', () => {
        const a = { ...action, damage: '', additionalDamage: [] };
        expect(rollDamage(a).total).toBe(0);
    });
});
