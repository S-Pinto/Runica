import { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, rollDiceExpression } from '../../utils/characterUtils';
import { RefreshIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';

export const HitDiceTracker = () => {
    const { character, updateCharacter } = useCharacter();
    const [lastRoll, setLastRoll] = useState<string | null>(null);

    if (!character) return null;

    const conModifier = getModifier(character.abilityScores.constitution);
    const total = character.level;
    const used = character.hitDice.used;
    const remaining = total - used;
    const canSpend = used < total && character.hp.current > 0;

    // Clicking a used die un-marks it (and the ones after it); clicking an available die marks up to it.
    const toggleDie = (index: number) => {
        const newUsed = index < used ? index : index + 1;
        updateCharacter({ hitDice: { ...character.hitDice, used: Math.max(0, Math.min(total, newUsed)) } });
    };

    const spend = () => {
        if (!canSpend) return;
        const { total: healing, pretty } = rollDiceExpression(`${character.hitDice.total}+${conModifier}`);
        setLastRoll(pretty);
        updateCharacter({
            hp: { ...character.hp, current: Math.min(character.hp.max, character.hp.current + Math.max(0, healing)) },
            hitDice: { ...character.hitDice, used: used + 1 },
        });
    };

    const reset = () => {
        updateCharacter({ hitDice: { ...character.hitDice, used: 0 } });
        setLastRoll(null);
    };

    return (
        <section aria-labelledby="hit-dice-title" className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
                <h3 id="hit-dice-title" className="font-cinzel text-lg font-bold text-foreground">Dadi vita</h3>
                <span className="font-mono text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{remaining}</span>/{total} · {character.hitDice.total}
                </span>
            </div>

            <div className="flex flex-wrap gap-3 p-1" role="group" aria-label="Dadi vita usati">
                {Array.from({ length: total }).map((_, i) => {
                    const isUsed = i < used;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => toggleDie(i)}
                            aria-pressed={isUsed}
                            aria-label={`Dado vita ${i + 1}: ${isUsed ? 'usato' : 'disponibile'}`}
                            className={`h-6 w-6 m-1 rotate-45 rounded-md border-2 transition-all duration-300 ${
                                isUsed ? 'border-border bg-muted/30 opacity-50' : 'border-accent/60 bg-accent/15 hover:bg-accent/30'
                            }`}
                        />
                    );
                })}
            </div>

            <div className="mt-auto flex gap-2 pt-6">
                <Button onClick={spend} disabled={!canSpend} className="flex-1">
                    Tira e cura ({character.hitDice.total})
                </Button>
                <Button variant="secondary" size="icon" onClick={reset} aria-label="Ripristina dadi vita" title="Ripristina dadi vita">
                    <RefreshIcon className="h-4 w-4" />
                </Button>
            </div>

            {lastRoll && (
                <p className="mt-3 rounded-xl border border-success/30 bg-success/10 py-2 text-center font-mono text-sm text-success animate-fadeIn" aria-live="polite">
                    Cura: {lastRoll} PV
                </p>
            )}
        </section>
    );
};
