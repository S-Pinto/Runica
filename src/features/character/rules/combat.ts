// Calcoli di combattimento: CA, CD incantesimi, bonus di attacco, azioni. Funzioni pure.
import type { ICharacter, AbilityScores, Attack } from '../characterTypes';
import { WEAPON_MASTERIES } from '../../../data/weaponProperties';
import { getModifier, formatModifier } from '../utils/characterUtils';
import { proficiencyForLevel } from './progression';

export type CharacterAction = Attack & { sourceName?: string };

const isAbilityKey = (scores: AbilityScores, key: string | undefined): key is keyof AbilityScores =>
    key !== undefined && Object.prototype.hasOwnProperty.call(scores, key);

export const calculateArmorClass = (character: ICharacter): number => {
    if (!character) {
        return 10;
    }

    const dexModifier = getModifier(character.abilityScores.dexterity);
    let calculatedAC = 0;

    const equippedArmor = character.equipment?.find(
        (item) => item.equipped && ['light', 'medium', 'heavy'].includes(item.armorType || '')
    );

    const equippedShield = character.equipment?.find(
        (item) => item.equipped && item.armorType === 'shield'
    );

    if (equippedArmor) {
        const armorAC = equippedArmor.armorClass || 0;
        switch (equippedArmor.armorType) {
            case 'light':
                calculatedAC = armorAC + dexModifier;
                break;
            case 'medium':
                calculatedAC = armorAC + Math.min(2, dexModifier);
                break;
            case 'heavy':
                calculatedAC = armorAC;
                break;
        }
    } else {
        // Senza armatura: base (10, o 13 per Armatura del Mago) + modificatori.
        // Copre anche Difesa Senza Armatura di Monaco/Barbaro.
        const unarmoredDefense = character.unarmoredDefense || { base: 10, abilities: [] };
        let unarmoredAC = unarmoredDefense.base;
        unarmoredDefense.abilities.forEach(ability => {
            unarmoredAC += getModifier(character.abilityScores[ability]);
        });
        calculatedAC = unarmoredAC;
    }

    if (equippedShield) {
        calculatedAC += equippedShield.armorClass || 2; // +2 se lo scudo non specifica la CA
    }

    // Bonus CA di ogni oggetto magico equipaggiato (Anello di Protezione, elmo, ecc.)
    (character.equipment || []).forEach(item => {
        if (item.equipped && item.bonusAC && typeof item.bonusAC === 'number') {
            calculatedAC += item.bonusAC;
        }
    });

    return calculatedAC;
};

export const calculateSpellSaveDC = (character: ICharacter): number => {
    if (!character || !character.spellcastingAbility) {
        return 8 + proficiencyForLevel(character?.level || 1);
    }
    const abilityMod = getModifier(character.abilityScores[character.spellcastingAbility]);
    return 8 + proficiencyForLevel(character.level) + abilityMod;
};

export const calculateSpellAttackBonus = (character: ICharacter): number => {
    if (!character || !character.spellcastingAbility) {
        return proficiencyForLevel(character?.level || 1);
    }
    const abilityMod = getModifier(character.abilityScores[character.spellcastingAbility]);
    return proficiencyForLevel(character.level) + abilityMod;
};

export const getAllActions = (character: ICharacter): CharacterAction[] => {
    const actions: CharacterAction[] = [];
    if (!character) return actions;

    const getAbilityMod = (ability?: string) => {
        const score = isAbilityKey(character.abilityScores, ability) ? character.abilityScores[ability] : undefined;
        return getModifier(score || 10);
    };

    // 1. Armi equipaggiate
    character.equipment?.filter(i => i.equipped && i.armorType === 'weapon').forEach(weapon => {
        const bonus = (weapon.armorClass || 0); // armorClass è riusato come bonus magico
        const abilityMod = getAbilityMod(weapon.attackAbility || 'strength');
        const profBonus = weapon.isProficient ? character.proficiencyBonus : 0;
        const totalHit = (weapon.attackAbility || weapon.isProficient) ? (abilityMod + profBonus + bonus) : bonus;

        let notes = weapon.mastery ? weapon.mastery : '';
        if (weapon.mastery && WEAPON_MASTERIES[weapon.mastery]) {
            notes = `${WEAPON_MASTERIES[weapon.mastery].name}: ${WEAPON_MASTERIES[weapon.mastery].description}`;
        }

        actions.push({
            id: weapon.id,
            name: weapon.name,
            bonus: formatModifier(totalHit),
            damage: weapon.damage || '1d4',
            damageType: weapon.damageType,
            damageAbility: weapon.damageAbility,
            attackAbility: weapon.attackAbility,
            isProficient: weapon.isProficient,
            additionalDamage: weapon.additionalDamage,
            mastery: weapon.mastery,
            properties: weapon.properties,
            sourceType: 'weapon',
            sourceId: weapon.id,
            sourceName: 'Equipped',
            notes: notes
        });
    });

    // 2. Oggetti magici equipaggiati con azioni
    character.equipment?.filter(i => i.equipped && i.armorType === 'magic').forEach(item => {
        const dc = calculateSpellSaveDC(character);
        const bonus = calculateSpellAttackBonus(character);

        actions.push({
            id: `magic-${item.id}`,
            name: item.grantsSpellName || item.name,
            bonus: item.saveAbility ? `${dc}` : formatModifier(bonus),
            damage: item.damage || 'Item Effect',
            damageType: item.damageType,
            saveAbility: item.saveAbility,
            sourceType: 'item',
            sourceId: item.id,
            sourceName: item.name,
            uses: item.uses,
            recovery: item.recovery === 'longRest' ? 'long' : item.recovery === 'shortRest' ? 'short' : item.recovery
        });
    });

    // 3. Trucchetti (livello 0) con danno
    character.spells?.filter(s => s.level === 0 && s.damage).forEach(spell => {
        const bonus = calculateSpellAttackBonus(character);
        const dc = calculateSpellSaveDC(character);

        actions.push({
            id: spell.id,
            name: spell.name,
            bonus: spell.saveAbility ? `${dc}` : formatModifier(bonus),
            damage: spell.damage!,
            damageType: spell.damageType,
            saveAbility: spell.saveAbility,
            sourceType: 'spell',
            sourceId: spell.id,
            sourceName: 'Cantrip'
        });
    });

    // 4. Privilegi marcati come azioni
    character.featuresAndTraits?.filter(f => f.isAction).forEach(feat => {
        actions.push({
            id: feat.id,
            name: feat.name,
            bonus: '---',
            damage: 'See Description',
            sourceType: 'feat',
            sourceId: feat.id,
            sourceName: 'Feature',
            uses: feat.uses,
            recovery: feat.recovery,
            properties: [feat.recovery].filter(Boolean) as string[]
        });
    });

    // 5. Attacchi manuali
    character.attacks?.forEach(attack => {
        actions.push({
            ...attack,
            sourceType: 'custom',
            sourceName: 'Special'
        });
    });

    return actions;
};

export const updateActionUsage = (character: ICharacter, action: Attack, delta: number): Partial<ICharacter> => {
    if (!action.sourceId || !action.sourceType || !action.uses) return {};

    switch (action.sourceType) {
        case 'item':
        case 'weapon': {
            const updatedEquipment = character.equipment.map(item => {
                if (item.id === action.sourceId) {
                    const newCurrent = Math.max(0, Math.min(item.uses?.max || 0, (item.uses?.current || 0) + delta));
                    return { ...item, uses: { ...item.uses!, current: newCurrent } };
                }
                return item;
            });
            return { equipment: updatedEquipment };
        }
        case 'feat': {
            const updatedFeatures = character.featuresAndTraits.map(feat => {
                if (feat.id === action.sourceId) {
                    const newCurrent = Math.max(0, Math.min(feat.uses?.max || 0, (feat.uses?.current || 0) + delta));
                    return { ...feat, uses: { ...feat.uses!, current: newCurrent } };
                }
                return feat;
            });
            return { featuresAndTraits: updatedFeatures };
        }
        default:
            return {};
    }
};
