// Regola opzionale del carico: peso trasportato e capacità (FOR × 15 lb, cioè FOR × 7,5 kg). Funzioni pure.
import type { EquipmentItem, ICharacter, OptionalRules } from '../characterTypes';

export type WeightUnit = NonNullable<OptionalRules['weightUnit']>;

/** Capacità per punto di Forza: 15 lb, convertite in 7,5 kg come nelle edizioni in metri. */
export const CAPACITY_PER_STRENGTH: Record<WeightUnit, number> = { lb: 15, kg: 7.5 };

/** Regole opzionali risolte: tutto spento se il personaggio è stato salvato prima della loro introduzione. */
export const resolveOptionalRules = (c: Pick<ICharacter, 'optionalRules'>): Required<OptionalRules> => ({
    encumbrance: !!c.optionalRules?.encumbrance,
    ammunition: !!c.optionalRules?.ammunition,
    weightUnit: c.optionalRules?.weightUnit === 'lb' ? 'lb' : 'kg',
});

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Peso totale di una riga (peso unitario × quantità). Valori mancanti o negativi valgono 0. */
export const itemTotalWeight = (item: EquipmentItem) => {
    const weight = Number.isFinite(item.weight) && (item.weight as number) > 0 ? (item.weight as number) : 0;
    const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    return round2(weight * quantity);
};

export const totalCarriedWeight = (equipment: EquipmentItem[] | undefined) =>
    round2((equipment || []).reduce((sum, item) => sum + itemTotalWeight(item), 0));

export const carryingCapacity = (strength: number, unit: WeightUnit) =>
    round2(Math.max(0, strength || 0) * CAPACITY_PER_STRENGTH[unit]);

export interface EncumbranceState {
    enabled: boolean;
    unit: WeightUnit;
    carried: number;
    capacity: number;
    /** Frazione della capacità usata (0..∞). */
    ratio: number;
    /** Oltre la capacità di carico. */
    over: boolean;
}

export const getEncumbrance = (c: Pick<ICharacter, 'optionalRules' | 'equipment' | 'abilityScores'>): EncumbranceState => {
    const rules = resolveOptionalRules(c);
    const carried = totalCarriedWeight(c.equipment);
    const capacity = carryingCapacity(c.abilityScores?.strength ?? 10, rules.weightUnit);
    return {
        enabled: rules.encumbrance,
        unit: rules.weightUnit,
        carried,
        capacity,
        ratio: capacity > 0 ? carried / capacity : carried > 0 ? Infinity : 0,
        over: carried > capacity,
    };
};

/** Peso con al massimo due decimali, in formato italiano ("12,5 kg"). */
export const formatWeight = (value: number, unit: WeightUnit) =>
    `${value.toLocaleString('it-IT', { maximumFractionDigits: 2 })} ${unit}`;
