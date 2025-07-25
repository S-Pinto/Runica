import React, { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, rollDiceExpression } from '../../utils/characterUtils';

export const HitDiceTracker = () => {
    const { character, updateCharacter } = useCharacter();
    const [hitDiceRoll, setHitDiceRoll] = useState<string | null>(null);

    const conModifier = getModifier(character.abilityScores.constitution);

    const spendHitDie = () => {
        if (character.hitDice.used >= character.level || character.hp.current === 0) return;

        const { total: healing, pretty: rollDetails } = rollDiceExpression(`${character.hitDice.total}+${conModifier}`);
        // REGOLA CORRETTA: La guarigione minima è 0, non 1.
        const newCurrentHp = Math.min(character.hp.max, character.hp.current + Math.max(0, healing));

        setHitDiceRoll(`${rollDetails} HP`);
        updateCharacter({
            hp: { ...character.hp, current: newCurrentHp },
            hitDice: { ...character.hitDice, used: character.hitDice.used + 1 }
        });
    };

    const resetHitDice = () => {
        updateCharacter({ hitDice: { ...character.hitDice, used: 0 } });
        setHitDiceRoll(null);
    };

    return (
        <div className="bg-card p-4 rounded-lg border border-border">
            <h3 className="text-lg font-cinzel text-accent mb-3">Hit Dice</h3>
            <p className="text-center text-3xl font-bold font-mono text-foreground mb-3">{character.level - character.hitDice.used} / {character.level}</p>
            <div className="flex gap-2">
                <button onClick={spendHitDie} disabled={character.hitDice.used >= character.level || character.hp.current === 0} className="w-full bg-primary/80 hover:bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">Spend ({character.hitDice.total})</button>
                <button onClick={resetHitDice} className="bg-secondary/80 hover:bg-secondary text-secondary-foreground font-bold py-2 px-4 rounded-md transition-colors">Reset</button>
            </div>
            {hitDiceRoll && <p className="text-center text-accent font-mono mt-3 p-2 bg-muted/50 rounded-md">{hitDiceRoll}</p>}
        </div>
    );
};