// Integrazione delle regole di equipaggiamento e attacchi: personaggi salvati in formati vecchi,
// flussi completi (form → inventario → combattimento → riposo) e coerenza fra Combattimento e Stampa.
import { describe, it, expect } from 'vitest';
import type { EquipmentItem, ICharacter } from '../characterTypes';
import { mergeWithDefaults } from './defaults';
import { buildCharacterActions, formatActionDamage, formatActionHit, rollAttack, rollDamage } from './attacks';
import { calculateArmorClass, getArmorClassBreakdown } from './combat';
import { adjustItemCharges, consumeAmmunition, normalizeItemForSave, toggleAttunement, toggleEquippedItem } from './equipment';
import { getEncumbrance } from './encumbrance';
import { longRestUpdate, shortRestUpdate } from './rest';

const seq = (...values: number[]) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; };
const face = (n: number, faces: number) => (n - 0.5) / faces;

/** Documento come lo salvavano le versioni precedenti: niente `optionalRules`, `armorClassOverride`, abbreviazioni miste. */
const legacyDoc = (): Partial<ICharacter> => ({
    id: 'char_legacy',
    name: 'Brunilde',
    level: 5,
    proficiencyBonus: 3,
    abilityScores: { strength: 16, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 },
    unarmoredDefense: { base: 10, abilities: ['dexterity'] },
    equipment: [
        // Arma salvata dal vecchio form tattico: bonus magico in armorClass, caratteristiche complete.
        { id: 'axe', name: 'Ascia +1', quantity: 1, description: '', equipped: true, armorType: 'weapon', armorClass: 1, damage: '1d8', damageType: 'Slashing', attackAbility: 'strength', damageAbility: 'strength', isProficient: true },
        // Arma del form attuale: nessuna caratteristica scelta, bonus come testo.
        { id: 'rapier', name: 'Stocco', quantity: 1, description: '', equipped: true, itemType: 'weapon', damage: '1d8', damageType: 'Piercing', attackBonus: '+0', properties: ['Finesse'] },
        { id: 'mail', name: 'Cotta di maglia', quantity: 1, description: '', equipped: true, itemType: 'armor', armorType: 'heavy', armorClass: 16 },
        { id: 'shield', name: 'Scudo', quantity: 1, description: '', equipped: true, itemType: 'shield', armorType: 'shield' },
        { id: 'cloak', name: 'Mantello di protezione', quantity: 1, description: '', equipped: true, itemType: 'wondrous', bonusAC: 1, requiresAttunement: true, isAttuned: false },
        // Oggetto magico vecchio con potere e usi.
        { id: 'wand', name: 'Bacchetta', quantity: 1, description: '', equipped: true, armorType: 'magic', grantsSpellName: 'Dardo incantato', damage: '3d4', uses: { current: 1, max: 3 }, recovery: 'longRest' },
    ] as EquipmentItem[],
    attacks: [
        // Attacco manuale salvato da AttackForm con abbreviazioni.
        { id: 'kick', name: 'Calcio', bonus: '+0', damage: '1d4', attackAbility: 'str', damageAbility: 'str', isProficient: true, damageType: 'Bludgeoning' },
    ],
});

describe('personaggio salvato in formato vecchio', () => {
    const c = mergeWithDefaults(legacyDoc());

    it('le regole opzionali restano spente e la CA è automatica', () => {
        expect(c.optionalRules).toEqual({ encumbrance: false, ammunition: false, weightUnit: 'kg' });
        expect(getEncumbrance(c).enabled).toBe(false);
        expect(getArmorClassBreakdown(c).manual).toBe(false);
    });

    it('CA: cotta 16 + scudo 2; il mantello non conta senza sintonia', () => {
        expect(calculateArmorClass(c)).toBe(18);
        const attuned = toggleAttunement(c.equipment, 'cloak');
        expect(attuned.ok).toBe(true);
        if (attuned.ok) expect(calculateArmorClass({ ...c, equipment: attuned.equipment })).toBe(19);
    });

    it('armi, potere e attacco manuale calcolati con le stesse regole', () => {
        const byId = Object.fromEntries(buildCharacterActions(c).map(a => [a.id, a]));
        expect(formatActionHit(byId.axe)).toBe('+7');
        expect(formatActionDamage(byId.axe)).toBe('1d8 + 4 Tagliente');
        expect(formatActionHit(byId.rapier)).toBe('+6');
        expect(byId.rapier.damage).toBe('1d8 + 3');
        expect(formatActionHit(byId.kick)).toBe('+6');
        expect(formatActionDamage(byId.kick)).toBe('1d4 + 3 Contundente');
        expect(byId['magic-wand']).toMatchObject({ name: 'Dardo incantato', uses: { current: 1, max: 3 }, recovery: 'long' });
    });

    it('Combattimento e Stampa mostrano gli stessi valori per ogni azione in comune', () => {
        const combat = buildCharacterActions(c, { include: ['weapon', 'item', 'spell', 'custom'] });
        const print = new Map(buildCharacterActions(c).map(a => [a.id, a]));
        combat.forEach(a => {
            expect(formatActionHit(print.get(a.id)!)).toBe(formatActionHit(a));
            expect(formatActionDamage(print.get(a.id)!)).toBe(formatActionDamage(a));
        });
    });

    it('riposo lungo: ricarica anche gli usi del formato vecchio', () => {
        const spent = { ...c, equipment: adjustItemCharges(c.equipment, 'wand', -1) };
        expect(spent.equipment.find(i => i.id === 'wand')?.uses?.current).toBe(0);
        expect(shortRestUpdate(spent).equipment?.find(i => i.id === 'wand')?.uses?.current).toBe(0);
        expect(longRestUpdate(spent).equipment?.find(i => i.id === 'wand')?.uses?.current).toBe(3);
    });

    it("modificare e salvare l'arma vecchia non perde il bonus né il danno", () => {
        const resaved = normalizeItemForSave(c.equipment.find(i => i.id === 'axe')!);
        const next = { ...c, equipment: c.equipment.map(i => (i.id === 'axe' ? resaved : i)) };
        const axe = buildCharacterActions(next, { include: ['weapon'] }).find(a => a.id === 'axe')!;
        expect(formatActionHit(axe)).toBe('+7');
        expect(axe.damage).toBe('1d8 + 4');
    });
});

describe('flusso completo: arco con munizioni tracciate', () => {
    const setup = (ammunition: boolean) => {
        const c = mergeWithDefaults({
            ...legacyDoc(),
            optionalRules: { ammunition, encumbrance: true, weightUnit: 'kg' },
            equipment: [
                normalizeItemForSave({ name: 'Arco lungo', quantity: 1, description: '', itemType: 'weapon', damage: '1d8', damageType: 'Piercing', properties: ['Ammunition', 'Range', 'Two-Handed', 'Heavy'], ammoItemId: 'arrows', weight: 1 }),
                { id: 'arrows', name: 'Frecce', quantity: 2, description: '', weight: 0.05 },
            ].map((i, n) => ({ id: n === 0 ? 'bow' : 'arrows', ...i })) as EquipmentItem[],
        });
        return c;
    };

    it("equipaggia, tira con DES e consuma una freccia a ogni tiro per colpire", () => {
        let c = setup(true);
        c = { ...c, equipment: toggleEquippedItem(c.equipment, 'bow')! };
        const [bow] = buildCharacterActions(c, { include: ['weapon'] });
        expect(bow).toMatchObject({ attackAbility: 'dexterity', toHit: 5, ammo: { itemId: 'arrows', quantity: 2 } });

        const roll = rollAttack(bow, 'normal', seq(face(20, 20)));
        expect(roll).toMatchObject({ total: 25, isCrit: true });
        const dmg = rollDamage(bow, { crit: roll.isCrit }, seq(face(3, 8), face(5, 8)));
        expect(dmg.total).toBe(3 + 5 + 2);

        const first = consumeAmmunition(c.equipment, bow.ammo!.itemId)!;
        const second = consumeAmmunition(first.equipment, 'arrows')!;
        const third = consumeAmmunition(second.equipment, 'arrows')!;
        expect([first.remaining, second.remaining]).toEqual([1, 0]);
        expect(third.empty).toBe(true);
        c = { ...c, equipment: third.equipment };
        expect(buildCharacterActions(c, { include: ['weapon'] })[0].ammo?.quantity).toBe(0);
    });

    it('a regola spenta le munizioni non sono collegate', () => {
        const c = setup(false);
        const equipped = { ...c, equipment: toggleEquippedItem(c.equipment, 'bow')! };
        expect(buildCharacterActions(equipped, { include: ['weapon'] })[0].ammo).toBeUndefined();
    });

    it('carico: peso dell\'arco e delle frecce contro FOR × 7,5 kg', () => {
        const e = getEncumbrance(setup(true));
        expect(e).toMatchObject({ carried: 1.1, capacity: 120, over: false });
    });
});
