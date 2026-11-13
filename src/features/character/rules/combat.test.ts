import { describe, it, expect } from 'vitest';
import type { ICharacter } from '../characterTypes';
import { createNewCharacter } from './defaults';
import {
    calculateArmorClass, calculateSpellSaveDC, calculateSpellAttackBonus,
    getArmorClassBreakdown, getProficiencyBonus,
} from './combat';

type Item = ICharacter['equipment'][number];
const item = (o: Partial<Item>): Item => ({ id: 'i1', name: 'Item', quantity: 1, description: '', equipped: true, ...o });
const scores = (o: Partial<ICharacter['abilityScores']>) => ({ ...createNewCharacter().abilityScores, ...o });
const make = (o: Partial<ICharacter> = {}): ICharacter => ({ ...createNewCharacter(), ...o });

describe('getProficiencyBonus', () => {
    it('usa il valore salvato (anche se impostato a mano)', () => {
        expect(getProficiencyBonus(make({ level: 1, proficiencyBonus: 5 }))).toBe(5);
    });
    it('se manca lo ricava dal livello', () => {
        expect(getProficiencyBonus({ level: 9, proficiencyBonus: undefined as unknown as number })).toBe(4);
    });
});

describe('calculateArmorClass', () => {
    it('senza armatura: 10 + mod Des', () => {
        expect(calculateArmorClass(make({ abilityScores: scores({ dexterity: 14 }) }))).toBe(12);
    });
    it('Difesa Senza Armatura somma i modificatori indicati', () => {
        const c = make({
            abilityScores: scores({ dexterity: 14, wisdom: 16 }),
            unarmoredDefense: { base: 10, abilities: ['dexterity', 'wisdom'] },
        });
        expect(calculateArmorClass(c)).toBe(15);
    });
    it('Armatura del Mago: base 13 + Des', () => {
        const c = make({ abilityScores: scores({ dexterity: 16 }), unarmoredDefense: { base: 13, abilities: ['dexterity'] } });
        expect(calculateArmorClass(c)).toBe(16);
    });
    it('armatura leggera aggiunge Des, media max +2, pesante nessuno', () => {
        const ac = (armorType: Item['armorType']) =>
            calculateArmorClass(make({ abilityScores: scores({ dexterity: 18 }), equipment: [item({ armorType, armorClass: 12 })] }));
        expect(ac('light')).toBe(16);
        expect(ac('medium')).toBe(14);
        expect(ac('heavy')).toBe(12);
    });
    it('Des negativo si sottrae anche con armatura leggera e media', () => {
        const ac = (armorType: Item['armorType']) =>
            calculateArmorClass(make({ abilityScores: scores({ dexterity: 8 }), equipment: [item({ armorType, armorClass: 14 })] }));
        expect(ac('light')).toBe(13);
        expect(ac('medium')).toBe(13);
        expect(ac('heavy')).toBe(14);
    });
    it("l'armatura sostituisce la Difesa Senza Armatura", () => {
        const c = make({
            abilityScores: scores({ dexterity: 14, wisdom: 18 }),
            unarmoredDefense: { base: 10, abilities: ['dexterity', 'wisdom'] },
            equipment: [item({ itemType: 'armor', armorType: 'medium', armorClass: 14 })],
        });
        expect(calculateArmorClass(c)).toBe(16);
    });
    it('categoria armor senza tipo vale come armatura leggera', () => {
        const c = make({ abilityScores: scores({ dexterity: 14 }), equipment: [item({ itemType: 'armor', armorClass: 11 })] });
        expect(calculateArmorClass(c)).toBe(13);
    });
    it('armatura senza CA base vale 10 (non 0)', () => {
        const c = make({ equipment: [item({ itemType: 'armor', armorType: 'heavy' })] });
        expect(calculateArmorClass(c)).toBe(10);
    });
    it("con più armature equipaggiate (dati vecchi) vale quella migliore", () => {
        const c = make({
            equipment: [
                item({ id: 'a', name: 'Cuoio', armorType: 'light', armorClass: 11 }),
                item({ id: 'b', name: 'Piastre', armorType: 'heavy', armorClass: 18 }),
            ],
        });
        const ac = getArmorClassBreakdown(c);
        expect(ac.total).toBe(18);
        expect(ac.armor?.id).toBe('b');
    });
    it('scudo: +2 di default, il proprio valore se indicato, riconosciuto anche da itemType', () => {
        expect(calculateArmorClass(make({ equipment: [item({ armorType: 'shield' })] }))).toBe(12);
        expect(calculateArmorClass(make({ equipment: [item({ itemType: 'shield', armorClass: 3 })] }))).toBe(13);
    });
    it('scudo + armatura + bonus magici; gli oggetti non equipaggiati non contano', () => {
        const c = make({
            equipment: [
                item({ id: 'a', armorType: 'heavy', armorClass: 16, bonusAC: 1 }),
                item({ id: 's', armorType: 'shield' }),
                item({ id: 'r', itemType: 'ring', bonusAC: 1 }),
                item({ id: 'x', equipped: false, bonusAC: 5 }),
            ],
        });
        expect(calculateArmorClass(c)).toBe(20);
    });
    it('i bonus alla CA che richiedono sintonia valgono solo da sintonizzati', () => {
        const ring = (isAttuned: boolean) => item({ id: 'r', name: 'Anello di protezione', itemType: 'ring', bonusAC: 1, requiresAttunement: true, isAttuned });
        const off = getArmorClassBreakdown(make({ equipment: [ring(false)] }));
        expect(off.total).toBe(10);
        expect(off.inactiveBonuses.map(i => i.id)).toEqual(['r']);
        expect(calculateArmorClass(make({ equipment: [ring(true)] }))).toBe(11);
    });
    it('le armi (anche nel formato vecchio con armorClass come bonus) non cambiano la CA', () => {
        const c = make({ equipment: [item({ armorType: 'weapon', armorClass: 2, damage: '1d8' })] });
        expect(calculateArmorClass(c)).toBe(10);
    });
    it('override manuale: sostituisce il totale ma conserva il calcolato', () => {
        const c = make({ armorClassOverride: 21, equipment: [item({ armorType: 'shield' })] });
        const ac = getArmorClassBreakdown(c);
        expect(ac).toMatchObject({ total: 21, computed: 12, manual: true });
        expect(calculateArmorClass(make({ armorClassOverride: null }))).toBe(10);
    });
    it('dettaglio leggibile delle parti', () => {
        const c = make({
            abilityScores: scores({ dexterity: 16 }),
            equipment: [item({ id: 'a', name: 'Cuoio borchiato', armorType: 'light', armorClass: 12 }), item({ id: 's', name: 'Scudo', armorType: 'shield' })],
        });
        expect(getArmorClassBreakdown(c).parts).toEqual([
            { label: 'Cuoio borchiato', value: 12 },
            { label: 'DES', value: 3 },
            { label: 'Scudo', value: 2 },
        ]);
    });
});

describe('incantesimi', () => {
    it('CD e bonus attacco con caratteristica da incantatore', () => {
        const c = make({ level: 5, proficiencyBonus: 3, spellcastingAbility: 'wisdom', abilityScores: scores({ wisdom: 16 }) });
        expect(calculateSpellSaveDC(c)).toBe(8 + 3 + 3);
        expect(calculateSpellAttackBonus(c)).toBe(3 + 3);
    });
    it('senza caratteristica usa solo il bonus competenza', () => {
        const c = make({ level: 9, proficiencyBonus: 4, spellcastingAbility: '' });
        expect(calculateSpellSaveDC(c)).toBe(8 + 4);
        expect(calculateSpellAttackBonus(c)).toBe(4);
    });
    it('rispetta il bonus di competenza impostato a mano', () => {
        const c = make({ level: 1, proficiencyBonus: 4, spellcastingAbility: 'intelligence', abilityScores: scores({ intelligence: 14 }) });
        expect(calculateSpellSaveDC(c)).toBe(14);
    });
});
