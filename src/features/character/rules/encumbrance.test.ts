import { describe, it, expect } from 'vitest';
import type { EquipmentItem } from '../characterTypes';
import { createNewCharacter } from './defaults';
import { carryingCapacity, formatWeight, getEncumbrance, itemTotalWeight, resolveOptionalRules, totalCarriedWeight } from './encumbrance';

const item = (o: Partial<EquipmentItem>): EquipmentItem => ({ id: 'i', name: 'Oggetto', quantity: 1, description: '', ...o });

describe('regole opzionali', () => {
    it('spente per i personaggi salvati prima (campo assente) e per quelli nuovi', () => {
        expect(resolveOptionalRules({})).toEqual({ encumbrance: false, ammunition: false, weightUnit: 'kg' });
        expect(resolveOptionalRules(createNewCharacter())).toEqual({ encumbrance: false, ammunition: false, weightUnit: 'kg' });
        expect(resolveOptionalRules({ optionalRules: { encumbrance: true, weightUnit: 'lb' } })).toEqual({ encumbrance: true, ammunition: false, weightUnit: 'lb' });
    });
});

describe('peso e carico', () => {
    it('peso × quantità; valori mancanti, negativi o non numerici valgono 0', () => {
        expect(itemTotalWeight(item({ weight: 0.5, quantity: 20 }))).toBe(10);
        expect(itemTotalWeight(item({ weight: -3 }))).toBe(0);
        expect(itemTotalWeight(item({ weight: NaN }))).toBe(0);
        expect(itemTotalWeight(item({ weight: 2, quantity: 0 }))).toBe(0);
        expect(totalCarriedWeight([item({ weight: 1.1, quantity: 3 }), item({ weight: 0.2 })])).toBe(3.5);
        expect(totalCarriedWeight(undefined)).toBe(0);
    });
    it('capacità: FOR × 15 lb oppure FOR × 7,5 kg', () => {
        expect(carryingCapacity(10, 'lb')).toBe(150);
        expect(carryingCapacity(15, 'kg')).toBe(112.5);
        expect(carryingCapacity(-1, 'kg')).toBe(0);
    });
    it('stato del carico con soglia superata', () => {
        const c = { ...createNewCharacter(), optionalRules: { encumbrance: true }, abilityScores: { ...createNewCharacter().abilityScores, strength: 8 } };
        c.equipment = [item({ weight: 30 }), item({ id: 'b', weight: 31 })];
        const e = getEncumbrance(c);
        expect(e).toMatchObject({ enabled: true, unit: 'kg', carried: 61, capacity: 60, over: true });
        expect(e.ratio).toBeCloseTo(61 / 60);
        expect(getEncumbrance({ ...c, equipment: [] }).over).toBe(false);
    });
    it('formatWeight in italiano', () => {
        expect(formatWeight(12.5, 'kg')).toBe('12,5 kg');
        expect(formatWeight(150, 'lb')).toBe('150 lb');
    });
});
