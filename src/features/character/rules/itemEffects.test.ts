import { describe, it, expect } from 'vitest';
import type { EquipmentItem, ICharacter } from '../characterTypes';
import { createNewCharacter } from './defaults';
import {
    formatSense, getActiveDefenses, getItemCombatNotes, getItemLanguages, getItemSenses, itemSaveParts,
} from './itemEffects';
import { getArmorClassBreakdown, getInitiativeBreakdown, getSavingThrowBreakdown, getSpeedBreakdown } from './combat';
import { cleanEffects } from './equipment';

const item = (o: Partial<EquipmentItem> = {}): EquipmentItem =>
    ({ id: 'i', name: 'Oggetto', quantity: 1, description: '', equipped: true, ...o });
const make = (equipment: EquipmentItem[], o: Partial<ICharacter> = {}): ICharacter =>
    ({ ...createNewCharacter(), proficiencyBonus: 3, equipment, ...o });

// Armatura a piastre che dà resistenza al fuoco, ma solo in sintonia.
const embarmor = (o: Partial<EquipmentItem> = {}) => item({
    id: 'emb', name: 'Embarmor', itemType: 'armor', armorType: 'heavy', armorClass: 18,
    requiresAttunement: true, isAttuned: true,
    effects: { defenses: [{ kind: 'resistance', damageType: 'Fire' }], notes: ['Svantaggio alle prove di Furtività'] },
    ...o,
});

describe('difese dagli oggetti', () => {
    it('equipaggiato e in sintonia: resistenza con la fonte', () => {
        expect(getActiveDefenses(make([embarmor()])).resistances).toEqual([{ damageType: 'Fire', sources: ['Embarmor'] }]);
    });
    it('non equipaggiato o senza sintonia: nessuna difesa', () => {
        expect(getActiveDefenses(make([embarmor({ equipped: false })])).resistances).toEqual([]);
        expect(getActiveDefenses(make([embarmor({ isAttuned: false })])).resistances).toEqual([]);
    });
    it('oggetto senza requisito di sintonia: vale appena equipaggiato', () => {
        const ring = item({ id: 'r', name: 'Anello', itemType: 'ring', effects: { defenses: [{ kind: 'immunity', damageType: 'Poison' }, { kind: 'vulnerability', damageType: 'Cold' }] } });
        const d = getActiveDefenses(make([ring]));
        expect(d.immunities).toEqual([{ damageType: 'Poison', sources: ['Anello'] }]);
        expect(d.vulnerabilities).toEqual([{ damageType: 'Cold', sources: ['Anello'] }]);
    });
    it('lo stesso tipo da due oggetti unisce le fonti; i tipi vuoti si ignorano', () => {
        const cloak = item({ id: 'c', name: 'Mantello', effects: { defenses: [{ kind: 'resistance', damageType: 'fire' }, { kind: 'resistance', damageType: ' ' }] } });
        expect(getActiveDefenses(make([embarmor(), cloak])).resistances).toEqual([{ damageType: 'Fire', sources: ['Embarmor', 'Mantello'] }]);
    });
});

describe('bonus a velocità, iniziativa, tiri salvezza e CA', () => {
    const boots = item({ id: 'b', name: 'Stivali', effects: { speedBonus: 10, initiativeBonus: 2 } });
    const cloak = item({ id: 'p', name: 'Mantello', requiresAttunement: true, isAttuned: true, effects: { saveBonuses: [{ ability: 'all', value: 1 }, { ability: 'dexterity', value: 1 }] } });

    it('velocità: base + bonus degli oggetti attivi', () => {
        expect(getSpeedBreakdown(make([boots], { speed: 30 }))).toEqual({ total: 40, parts: [{ label: 'Base', value: 30 }, { label: 'Stivali', value: 10 }] });
        expect(getSpeedBreakdown(make([{ ...boots, equipped: false }], { speed: 30 })).total).toBe(30);
    });
    it('requisito di Forza non soddisfatto: −10 ft e avviso in Combattimento', () => {
        const plate = embarmor({ strengthRequirement: 15 });
        const weak = make([plate], { speed: 30, abilityScores: { ...createNewCharacter().abilityScores, strength: 13 } });
        expect(getSpeedBreakdown(weak).total).toBe(20);
        expect(getItemCombatNotes(weak).map(n => n.text)).toContain('Richiede Forza 15: velocità ridotta di 10 ft (3 m).');
        const strong = make([plate], { speed: 30, abilityScores: { ...createNewCharacter().abilityScores, strength: 15 } });
        expect(getSpeedBreakdown(strong).total).toBe(30);
    });
    it('iniziativa: DES + bonus', () => {
        const c = make([boots], { abilityScores: { ...createNewCharacter().abilityScores, dexterity: 14 } });
        expect(getInitiativeBreakdown(c).total).toBe(4);
    });
    it('tiri salvezza: bonus per tutti e per la singola caratteristica, solo se in sintonia', () => {
        const c = make([cloak], { abilityScores: { ...createNewCharacter().abilityScores, dexterity: 16 } });
        c.savingThrows = { ...c.savingThrows, dexterity: { proficient: true } };
        expect(itemSaveParts(c, 'dexterity')).toEqual([{ label: 'Mantello', value: 2 }]);
        expect(getSavingThrowBreakdown(c, 'dexterity').total).toBe(3 + 3 + 2);
        expect(getSavingThrowBreakdown(c, 'wisdom').total).toBe(0 + 1);
        expect(getSavingThrowBreakdown(make([{ ...cloak, isAttuned: false }]), 'wisdom').total).toBe(0);
    });
    it('CA: il bonus magico resta in bonusAC e conta una volta sola; l\'override vince', () => {
        const ring = item({ id: 'r', name: 'Anello di protezione', bonusAC: 1, requiresAttunement: true, isAttuned: true, effects: { speedBonus: 5 } });
        expect(getArmorClassBreakdown(make([embarmor(), ring])).total).toBe(19);
        expect(getArmorClassBreakdown(make([embarmor(), ring], { armorClassOverride: 12 })).total).toBe(12);
    });
});

describe('sensi, lingue e avvisi', () => {
    const helm = item({
        id: 'h', name: 'Elmo del Gigante', itemType: 'helmet',
        effects: { senses: [{ name: 'Scurovisione', range: 60 }], languages: ['Gigante', ' '], notes: [] },
    });
    it('sensi con distanza in metri', () => {
        const senses = getItemSenses(make([helm]));
        expect(senses).toEqual([{ name: 'Scurovisione', range: 60, source: 'Elmo del Gigante' }]);
        expect(formatSense(senses[0])).toBe('Scurovisione 18 m');
    });
    it('lingue senza doppioni, con le fonti', () => {
        const ring = item({ id: 'r', name: 'Anello', effects: { languages: ['gigante'] } });
        expect(getItemLanguages(make([helm, ring]))).toEqual([{ name: 'Gigante', sources: ['Elmo del Gigante', 'Anello'] }]);
    });
    it('gli avvisi valgono con l\'oggetto equipaggiato anche senza sintonia', () => {
        expect(getItemCombatNotes(make([embarmor({ isAttuned: false })]))).toEqual([
            { text: 'Svantaggio alle prove di Furtività', source: 'Embarmor', itemId: 'emb' },
        ]);
        expect(getItemCombatNotes(make([embarmor({ equipped: false })]))).toEqual([]);
    });
});

describe('cleanEffects', () => {
    it('toglie liste vuote e bonus a zero', () => {
        expect(cleanEffects({ speedBonus: 0, defenses: [{ kind: 'resistance', damageType: '' }], languages: [' '] })).toBeUndefined();
        expect(cleanEffects({ initiativeBonus: 1, notes: [' Maledetto '] })).toEqual({ initiativeBonus: 1, notes: ['Maledetto'] });
    });
});
