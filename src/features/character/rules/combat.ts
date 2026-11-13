// Calcoli di combattimento: competenza, CA (con dettaglio e override manuale), CD e bonus degli incantesimi.
// Le azioni (armi, trucchetti, attacchi) sono in `attacks.ts`. Funzioni pure.
import type { ICharacter, EquipmentItem, AbilityScores } from '../characterTypes';
import { ABILITY_SHORT } from '../../../lib/labels';
import { getModifier } from '../utils/characterUtils';
import { proficiencyForLevel } from './progression';
import { armorWeight, isAttunementSatisfied, isBodyArmor, isShield } from './equipment';

/**
 * Bonus di competenza del personaggio: quello salvato, che `withProgression` tiene allineato al livello
 * quando è automatico e lascia com'è quando è manuale. Solo se manca si ricava dal livello.
 */
export const getProficiencyBonus = (c: Pick<ICharacter, 'proficiencyBonus' | 'level'>): number =>
    Number.isFinite(c?.proficiencyBonus) ? c.proficiencyBonus : proficiencyForLevel(c?.level || 1);

export interface ArmorClassPart {
    label: string;
    value: number;
}

export interface ArmorClassBreakdown {
    /** CA mostrata: quella manuale se impostata, altrimenti quella calcolata. */
    total: number;
    computed: number;
    manual: boolean;
    parts: ArmorClassPart[];
    armor?: EquipmentItem;
    shield?: EquipmentItem;
    /** Oggetti con bonus alla CA esclusi perché richiedono una sintonia che manca. */
    inactiveBonuses: EquipmentItem[];
}

const isAbilityKey = (scores: AbilityScores, key: string): key is keyof AbilityScores =>
    Object.prototype.hasOwnProperty.call(scores, key);

const BASE_ARMOR_WITHOUT_VALUE = 10;

/** Parti della CA con un'armatura indossata (leggera: + DES; media: + DES fino a +2; pesante: nessun DES). */
const armorParts = (armor: EquipmentItem, dexMod: number): ArmorClassPart[] => {
    const base = armor.armorClass && armor.armorClass > 0 ? armor.armorClass : BASE_ARMOR_WITHOUT_VALUE;
    const parts: ArmorClassPart[] = [{ label: armor.name || 'Armatura', value: base }];
    const weight = armorWeight(armor);
    if (weight === 'light' && dexMod !== 0) parts.push({ label: ABILITY_SHORT.dexterity, value: dexMod });
    if (weight === 'medium' && dexMod !== 0) parts.push({ label: `${ABILITY_SHORT.dexterity} (max +2)`, value: Math.min(2, dexMod) });
    return parts;
};

const sumParts = (parts: ArmorClassPart[]) => parts.reduce((t, p) => t + p.value, 0);

export const getArmorClassBreakdown = (character: ICharacter): ArmorClassBreakdown => {
    const equipment = character?.equipment || [];
    const scores = character?.abilityScores;
    const dexMod = getModifier(scores?.dexterity ?? 10);

    // Con più armature equipaggiate (dati vecchi) vale quella che dà la CA più alta.
    const armors = equipment.filter(i => i.equipped && isBodyArmor(i));
    const armor = armors
        .map(a => ({ a, ac: sumParts(armorParts(a, dexMod)) }))
        .sort((x, y) => y.ac - x.ac)[0]?.a;

    let parts: ArmorClassPart[];
    if (armor) {
        parts = armorParts(armor, dexMod);
    } else {
        // Senza armatura: base (10, o 13 per Armatura del Mago) + modificatori.
        // Copre anche Difesa Senza Armatura di Monaco/Barbaro.
        const unarmored = character?.unarmoredDefense || { base: 10, abilities: [] };
        parts = [{ label: 'Base', value: unarmored.base ?? 10 }];
        (unarmored.abilities || []).forEach(ability => {
            if (!scores || !isAbilityKey(scores, ability)) return;
            const mod = getModifier(scores[ability]);
            if (mod !== 0) parts.push({ label: ABILITY_SHORT[ability], value: mod });
        });
    }

    const shield = equipment.find(i => i.equipped && isShield(i));
    if (shield) parts.push({ label: shield.name || 'Scudo', value: shield.armorClass && shield.armorClass > 0 ? shield.armorClass : 2 });

    // Bonus magici (Anello di Protezione, armatura +1…): solo se l'oggetto è attivo.
    const inactiveBonuses: EquipmentItem[] = [];
    equipment.forEach(item => {
        if (!item.equipped || typeof item.bonusAC !== 'number' || !Number.isFinite(item.bonusAC) || item.bonusAC === 0) return;
        if (isAttunementSatisfied(item)) parts.push({ label: `${item.name} (magico)`, value: item.bonusAC });
        else inactiveBonuses.push(item);
    });

    const computed = sumParts(parts);
    const override = character?.armorClassOverride;
    const manual = typeof override === 'number' && Number.isFinite(override);
    return { total: manual ? override : computed, computed, manual, parts, armor, shield, inactiveBonuses };
};

export const calculateArmorClass = (character: ICharacter): number =>
    character ? getArmorClassBreakdown(character).total : 10;

const spellAbilityMod = (character: ICharacter) =>
    character.spellcastingAbility ? getModifier(character.abilityScores[character.spellcastingAbility]) : 0;

export const calculateSpellSaveDC = (character: ICharacter): number =>
    8 + getProficiencyBonus(character) + (character ? spellAbilityMod(character) : 0);

export const calculateSpellAttackBonus = (character: ICharacter): number =>
    getProficiencyBonus(character) + (character ? spellAbilityMod(character) : 0);
