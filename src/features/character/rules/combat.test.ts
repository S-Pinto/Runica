import { describe, it, expect } from 'vitest';
import type { ICharacter } from '../characterTypes';
import { createNewCharacter } from './defaults';
import {
    calculateArmorClass, calculateSpellSaveDC, calculateSpellAttackBonus,
    getAllActions, updateActionUsage,
} from './combat';

type Item = ICharacter['equipment'][number];
const item = (o: Partial<Item>): Item => ({ id: 'i1', name: 'Item', equipped: true, ...o } as Item);
const make = (o: Partial<ICharacter> = {}): ICharacter => ({ ...createNewCharacter(), ...o });

describe('calculateArmorClass', () => {
    it('senza armatura: 10 + mod Des', () => {
        const c = make({ abilityScores: { ...createNewCharacter().abilityScores, dexterity: 14 } });
        expect(calculateArmorClass(c)).toBe(12);
    });
    it('Difesa Senza Armatura somma i modificatori indicati', () => {
        const c = make({
            abilityScores: { ...createNewCharacter().abilityScores, dexterity: 14, wisdom: 16 },
            unarmoredDefense: { base: 10, abilities: ['dexterity', 'wisdom'] },
        });
        expect(calculateArmorClass(c)).toBe(15);
    });
    it('armatura leggera aggiunge Des, media max +2, pesante nessuno', () => {
        const scores = { ...createNewCharacter().abilityScores, dexterity: 18 };
        const ac = (armorType: Item['armorType']) =>
            calculateArmorClass(make({ abilityScores: scores, equipment: [item({ armorType, armorClass: 12 })] }));
        expect(ac('light')).toBe(16);
        expect(ac('medium')).toBe(14);
        expect(ac('heavy')).toBe(12);
    });
    it('scudo (+2 di default) e bonusAC; ignora oggetti non equipaggiati', () => {
        const c = make({
            equipment: [
                item({ id: 's', armorType: 'shield' }),
                item({ id: 'r', armorType: 'magic', bonusAC: 1 }),
                item({ id: 'x', equipped: false, bonusAC: 5 }),
            ],
        });
        expect(calculateArmorClass(c)).toBe(13);
    });
});

describe('incantesimi', () => {
    it('CD e bonus attacco con caratteristica da incantatore', () => {
        const c = make({
            level: 5, spellcastingAbility: 'wisdom',
            abilityScores: { ...createNewCharacter().abilityScores, wisdom: 16 },
        });
        expect(calculateSpellSaveDC(c)).toBe(8 + 3 + 3);
        expect(calculateSpellAttackBonus(c)).toBe(3 + 3);
    });
    it('senza caratteristica usa solo il bonus competenza', () => {
        const c = make({ level: 9, spellcastingAbility: '' });
        expect(calculateSpellSaveDC(c)).toBe(8 + 4);
        expect(calculateSpellAttackBonus(c)).toBe(4);
    });
});

describe('getAllActions', () => {
    it('arma competente: mod + competenza + bonus, formattato con segno', () => {
        const c = make({
            proficiencyBonus: 2,
            abilityScores: { ...createNewCharacter().abilityScores, strength: 16 },
            equipment: [item({ id: 'w', armorType: 'weapon', attackAbility: 'strength', isProficient: true, armorClass: 1, damage: '1d8' })],
        });
        const [a] = getAllActions(c);
        expect(a).toMatchObject({ id: 'w', bonus: '+6', damage: '1d8', sourceType: 'weapon' });
    });
    it('arma senza abilità né competenza usa solo il bonus magico', () => {
        const c = make({ equipment: [item({ id: 'w', armorType: 'weapon', armorClass: 0 })] });
        expect(getAllActions(c)[0]).toMatchObject({ bonus: '+0', damage: '1d4' });
    });
    it('trucchetti con danno e privilegi-azione; include attacchi custom', () => {
        const c = make({
            level: 1, spellcastingAbility: 'intelligence',
            abilityScores: { ...createNewCharacter().abilityScores, intelligence: 16 },
            spells: [
                { id: 'sp1', name: 'Fire Bolt', level: 0, damage: '1d10', saveAbility: undefined } as ICharacter['spells'][number],
                { id: 'sp2', name: 'Light', level: 0 } as ICharacter['spells'][number],
            ],
            featuresAndTraits: [{ id: 'f1', name: 'Second Wind', isAction: true, recovery: 'short' } as ICharacter['featuresAndTraits'][number]],
            attacks: [{ id: 'a1', name: 'Pugno', bonus: '+1', damage: '1' }],
        });
        const actions = getAllActions(c);
        expect(actions.map(a => a.id)).toEqual(['sp1', 'f1', 'a1']);
        expect(actions[0].bonus).toBe('+5');
        expect(actions[1]).toMatchObject({ bonus: '---', properties: ['short'] });
        expect(actions[2].sourceType).toBe('custom');
    });
});

describe('updateActionUsage', () => {
    const base = make({
        equipment: [item({ id: 'e1', uses: { current: 1, max: 3 } })],
        featuresAndTraits: [{ id: 'f1', name: 'F', uses: { current: 0, max: 2 } } as ICharacter['featuresAndTraits'][number]],
    });
    it('aggiorna gli usi di un oggetto entro 0..max', () => {
        const action = { id: 'x', name: 'x', bonus: '', damage: '', sourceId: 'e1', sourceType: 'item' as const, uses: { current: 1, max: 3 } };
        expect(updateActionUsage(base, action, 1).equipment?.[0].uses?.current).toBe(2);
        expect(updateActionUsage(base, action, 10).equipment?.[0].uses?.current).toBe(3);
        expect(updateActionUsage(base, action, -10).equipment?.[0].uses?.current).toBe(0);
    });
    it('aggiorna i privilegi e ignora i tipi senza usi', () => {
        const feat = { id: 'x', name: 'x', bonus: '', damage: '', sourceId: 'f1', sourceType: 'feat' as const, uses: { current: 0, max: 2 } };
        expect(updateActionUsage(base, feat, 1).featuresAndTraits?.[0].uses?.current).toBe(1);
        expect(updateActionUsage(base, { ...feat, sourceType: 'custom' }, 1)).toEqual({});
        expect(updateActionUsage(base, { ...feat, uses: undefined }, 1)).toEqual({});
    });
});
