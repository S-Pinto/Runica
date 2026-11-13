// Proprietà passive degli oggetti (resistenze, bonus, sensi, lingue, avvisi): valgono con l'oggetto
// equipaggiato e, se la richiede, in sintonia. Ogni valore porta la sua fonte. Funzioni pure.
import type { AbilityScores, DefenseKind, EquipmentItem, ICharacter, ItemEffects } from '../characterTypes';
import { isItemActive } from './equipment';

/** Parte di un valore derivato, con la sua etichetta (stessa forma delle parti della CA). */
export interface ValuePart {
    label: string;
    value: number;
}

type WithEquipment = Pick<ICharacter, 'equipment'>;

const itemName = (item: EquipmentItem) => item.name?.trim() || 'Oggetto';

/** Oggetti le cui proprietà magiche sono attive (equipaggiati e, se serve, in sintonia). */
export const activeEffectItems = (c: WithEquipment) =>
    (c.equipment || []).filter(i => isItemActive(i) && i.effects);

// ---------- Difese ----------

export interface DefenseEntry {
    damageType: string;
    sources: string[];
}

export interface ActiveDefenses {
    resistances: DefenseEntry[];
    immunities: DefenseEntry[];
    vulnerabilities: DefenseEntry[];
}

const DEFENSE_LIST: Record<DefenseKind, keyof ActiveDefenses> = {
    resistance: 'resistances',
    immunity: 'immunities',
    vulnerability: 'vulnerabilities',
};

/** Resistenze, immunità e vulnerabilità date dagli oggetti attivi; lo stesso tipo da più oggetti unisce le fonti. */
export const getActiveDefenses = (c: WithEquipment): ActiveDefenses => {
    const out: ActiveDefenses = { resistances: [], immunities: [], vulnerabilities: [] };
    activeEffectItems(c).forEach(item => {
        (item.effects?.defenses || []).forEach(d => {
            const type = d.damageType?.trim();
            const list = out[DEFENSE_LIST[d.kind]];
            if (!type || !list) return;
            const source = itemName(item);
            const existing = list.find(e => e.damageType.toLowerCase() === type.toLowerCase());
            if (!existing) list.push({ damageType: type, sources: [source] });
            else if (!existing.sources.includes(source)) existing.sources.push(source);
        });
    });
    return out;
};

// ---------- Bonus numerici ----------

/** Una parte per ogni oggetto attivo che dà un bonus diverso da zero. */
const bonusParts = (c: WithEquipment, pick: (e: ItemEffects) => number | undefined): ValuePart[] =>
    activeEffectItems(c)
        .map(item => ({ label: itemName(item), value: Number(pick(item.effects!)) || 0 }))
        .filter(p => p.value !== 0);

export const itemSpeedParts = (c: WithEquipment) => bonusParts(c, e => e.speedBonus);

export const itemInitiativeParts = (c: WithEquipment) => bonusParts(c, e => e.initiativeBonus);

/** Bonus ai tiri salvezza di una caratteristica (quelli per "tutti" compresi). */
export const itemSaveParts = (c: WithEquipment, ability: keyof AbilityScores) =>
    bonusParts(c, e => (e.saveBonuses || [])
        .filter(b => b.ability === ability || b.ability === 'all')
        .reduce((t, b) => t + (Number(b.value) || 0), 0));

/** Armatura indossata con un requisito di Forza non soddisfatto (−10 ft di velocità, regole 2024). */
export const unmetStrengthRequirement = (c: Pick<ICharacter, 'equipment' | 'abilityScores'>) =>
    (c.equipment || []).find(i =>
        i.equipped && Number(i.strengthRequirement) > 0 && (c.abilityScores?.strength ?? 10) < Number(i.strengthRequirement));

export const STRENGTH_SPEED_PENALTY = -10;

// ---------- Sensi, lingue, avvisi ----------

export interface SourcedSense {
    name: string;
    /** In piedi. */
    range?: number;
    source: string;
}

export const getItemSenses = (c: WithEquipment): SourcedSense[] =>
    activeEffectItems(c).flatMap(item =>
        (item.effects?.senses || [])
            .filter(s => s.name?.trim())
            .map(s => ({ name: s.name.trim(), range: Number(s.range) > 0 ? Number(s.range) : undefined, source: itemName(item) })));

export interface SourcedLanguage {
    name: string;
    sources: string[];
}

export const getItemLanguages = (c: WithEquipment): SourcedLanguage[] => {
    const out: SourcedLanguage[] = [];
    activeEffectItems(c).forEach(item => {
        (item.effects?.languages || []).forEach(raw => {
            const name = raw.trim();
            if (!name) return;
            const existing = out.find(l => l.name.toLowerCase() === name.toLowerCase());
            if (!existing) out.push({ name, sources: [itemName(item)] });
            else if (!existing.sources.includes(itemName(item))) existing.sources.push(itemName(item));
        });
    });
    return out;
};

export interface CombatNote {
    text: string;
    source: string;
    itemId: string;
}

/**
 * Avvisi tattici degli oggetti equipaggiati (anche senza sintonia: una maledizione vale comunque)
 * e il requisito di Forza non soddisfatto.
 */
export const getItemCombatNotes = (c: Pick<ICharacter, 'equipment' | 'abilityScores'>): CombatNote[] => {
    const notes: CombatNote[] = (c.equipment || [])
        .filter(i => i.equipped)
        .flatMap(item => (item.effects?.notes || [])
            .map(n => n.trim())
            .filter(Boolean)
            .map(text => ({ text, source: itemName(item), itemId: item.id })));
    const heavy = unmetStrengthRequirement(c);
    if (heavy) {
        notes.push({
            text: `Richiede Forza ${heavy.strengthRequirement}: velocità ridotta di 10 ft (3 m).`,
            source: itemName(heavy),
            itemId: heavy.id,
        });
    }
    return notes;
};

/** "18 m" da una distanza in piedi (1 ft = 0,3 m, arrotondato come la velocità). */
export const feetToMeters = (feet: number) => Math.round(feet * 0.3 * 10) / 10;

export const formatSense = (s: Pick<SourcedSense, 'name' | 'range'>) =>
    s.range ? `${s.name} ${feetToMeters(s.range).toLocaleString('it-IT')} m` : s.name;
