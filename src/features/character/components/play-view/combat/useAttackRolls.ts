import React, { useState } from 'react';
import { Attack, AbilityScores } from '../../../characterTypes';
import { rollDiceExpression, doubleDice } from '../../../utils/characterUtils';
import { getAttackSummary } from '../../AttackRow';

export interface RollResult {
    value: string;
    breakdown?: string;
    isCrit: boolean;
    isFail: boolean;
}

export type AttackResults = Record<string, { atk: RollResult[], dmg: RollResult[] }>;
export type RollMode = 'normal' | 'advantage' | 'disadvantage';

const ABILITY_MAP: Record<string, string> = {
    str: 'strength',
    dex: 'dexterity',
    con: 'constitution',
    int: 'intelligence',
    wis: 'wisdom',
    cha: 'charisma'
};

/** Stato e logica dei tiri per colpire e dei danni nella scheda di combattimento. */
export const useAttackRolls = (abilityScores: AbilityScores, proficiencyBonus: number) => {
    const [results, setResults] = useState<AttackResults>({});
    const [rollMode, setRollMode] = useState<RollMode>('normal');

    const handleAttackRoll = (e: React.MouseEvent, attack: Attack) => {
        e.stopPropagation();

        // Advantage/disadvantage: roll two d20 and keep the higher/lower one.
        const first = Math.floor(Math.random() * 20) + 1;
        const second = rollMode === 'normal' ? first : Math.floor(Math.random() * 20) + 1;
        const d20Roll = rollMode === 'advantage' ? Math.max(first, second) : rollMode === 'disadvantage' ? Math.min(first, second) : first;
        let total = d20Roll;
        const breakdownParts = [rollMode === 'normal' ? `d20(${d20Roll})` : `d20 ${rollMode === 'advantage' ? 'vantaggio' : 'svantaggio'}(${first}|${second} → ${d20Roll})`];

        // 1. Ability Modifier
        if (attack.attackAbility && abilityScores) {
            const abilityKey = (ABILITY_MAP[attack.attackAbility.toLowerCase()] || attack.attackAbility) as keyof AbilityScores;
            const score = abilityScores[abilityKey] || 10;
            const modifier = Math.floor((score - 10) / 2);
            if (modifier !== 0) {
                total += modifier;
                const sign = modifier >= 0 ? '+' : '';
                breakdownParts.push(`${sign}${modifier}(${attack.attackAbility.toUpperCase()})`);
            }
        }

        // 2. Proficiency
        if (attack.isProficient) {
            total += proficiencyBonus;
            breakdownParts.push(`+${proficiencyBonus}(comp.)`);
        }

        // 3. Custom/Magic Bonus
        const cleanBonus = attack.bonus?.toString().replace(/\s/g, '') || '0';
        let magicBonus = parseInt(cleanBonus, 10);
        if (isNaN(magicBonus)) {
            const match = attack.bonus?.match(/[+-]?\d+/);
            magicBonus = match ? parseInt(match[0], 10) : 0;
        }

        if (magicBonus !== 0) {
            total += magicBonus;
            const sign = magicBonus >= 0 ? '+' : '';
            breakdownParts.push(`${sign}${magicBonus}(magico)`);
        }

        const breakdown = breakdownParts.join(' + ').replace(/\+ \+/g, '+ ').replace(/\+ -/g, '- '); // Clean up signs

        const newRoll: RollResult = {
            value: total.toString(),
            breakdown,
            isCrit: d20Roll === 20,
            isFail: d20Roll === 1,
        };
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], atk: [...(prev[attack.id]?.atk || []), newRoll] } }));
    };

    const handleDamageRoll = (e: React.MouseEvent, attack: Attack) => {
        e.stopPropagation();

        // Same formula the card shows (dice + ability modifier + magic bonus), so display and roll agree.
        const summary = getAttackSummary(attack, abilityScores, proficiencyBonus);
        const baseFormula: string = (summary.isSave ? attack.damage : summary.damageFormula) || attack.damage || '';

        // A natural 20 on the latest attack roll doubles every damage die.
        const lastAttack = results[attack.id]?.atk?.slice(-1)[0];
        const isCrit = !summary.isSave && !!lastAttack?.isCrit;
        const formula = isCrit ? doubleDice(baseFormula) : baseFormula;

        const main = rollDiceExpression(formula);
        let totalDamage = main.total;
        const details = [`${main.total} ${attack.damageType || ''}`.trim()];
        const breakdownParts = [`${main.pretty}${attack.damageType ? ` (${attack.damageType})` : ''}`];

        (attack.additionalDamage || []).forEach(extra => {
            const extraResult = rollDiceExpression(isCrit ? doubleDice(extra.formula) : extra.formula);
            totalDamage += extraResult.total;
            details.push(`${extraResult.total} ${extra.type}`);
            breakdownParts.push(`${extraResult.pretty} (${extra.type})`);
        });

        const valueString = details.length > 1
            ? `${totalDamage} (${details.join(' + ')})`
            : `${totalDamage} ${attack.damageType || ''}`.trim();

        const newRoll: RollResult = {
            value: valueString,
            breakdown: (isCrit ? 'Critico, dadi raddoppiati: ' : '') + breakdownParts.join(' + '),
            isCrit,
            isFail: false,
        };
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], dmg: [...(prev[attack.id]?.dmg || []), newRoll] } }));
    };

    const clearResults = (attackId: string) => {
        setResults(prev => {
            const newState = { ...prev };
            delete newState[attackId];
            return newState;
        });
    };

    return { results, rollMode, setRollMode, handleAttackRoll, handleDamageRoll, clearResults };
};
