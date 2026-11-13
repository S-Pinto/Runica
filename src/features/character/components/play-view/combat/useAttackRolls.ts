import React, { useState } from 'react';
import { rollAttack, rollDamage, type ResolvedAction, type RollMode } from '../../../rules/attacks';

export type { RollMode };

export interface RollResult {
    value: string;
    breakdown?: string;
    isCrit: boolean;
    isFail: boolean;
}

export type AttackResults = Record<string, { atk: RollResult[]; dmg: RollResult[] }>;

interface UseAttackRollsOptions {
    /** Chiamato a ogni tiro per colpire di un'arma con munizioni collegate. */
    onAttackRolled?: (action: ResolvedAction) => void;
}

/**
 * Stato dei tiri per colpire e dei danni nella scheda di combattimento. I calcoli sono in `rules/attacks`.
 * Un 20 naturale rende critico solo il primo tiro di danni successivo.
 */
export const useAttackRolls = ({ onAttackRolled }: UseAttackRollsOptions = {}) => {
    const [results, setResults] = useState<AttackResults>({});
    const [pendingCrit, setPendingCrit] = useState<Record<string, boolean>>({});
    const [rollMode, setRollMode] = useState<RollMode>('normal');

    const push = (id: string, key: 'atk' | 'dmg', roll: RollResult) =>
        setResults(prev => ({ ...prev, [id]: { atk: prev[id]?.atk || [], dmg: prev[id]?.dmg || [], [key]: [...(prev[id]?.[key] || []), roll] } }));

    const handleAttackRoll = (e: React.MouseEvent, action: ResolvedAction) => {
        e.stopPropagation();
        const r = rollAttack(action, rollMode);
        push(action.id, 'atk', { value: String(r.total), breakdown: r.breakdown, isCrit: r.isCrit, isFail: r.isFumble });
        setPendingCrit(prev => ({ ...prev, [action.id]: r.isCrit }));
        onAttackRolled?.(action);
    };

    const handleDamageRoll = (e: React.MouseEvent, action: ResolvedAction, versatile = false) => {
        e.stopPropagation();
        const crit = action.roll === 'attack' && !!pendingCrit[action.id];
        const r = rollDamage(action, { crit, versatile });
        push(action.id, 'dmg', { value: r.value, breakdown: r.breakdown, isCrit: r.isCrit, isFail: false });
        if (crit) setPendingCrit(prev => ({ ...prev, [action.id]: false }));
    };

    const clearResults = (actionId: string) => {
        setResults(prev => {
            const next = { ...prev };
            delete next[actionId];
            return next;
        });
        setPendingCrit(prev => ({ ...prev, [actionId]: false }));
    };

    return { results, rollMode, setRollMode, handleAttackRoll, handleDamageRoll, clearResults, pendingCrit };
};
