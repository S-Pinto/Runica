import { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, rollDiceExpression } from '../../utils/characterUtils';

export const HitDiceTracker = () => {
    const { character, updateCharacter } = useCharacter();
    if (!character) return null;
    const [hitDiceRoll, setHitDiceRoll] = useState<string | null>(null);

    const conModifier = getModifier(character.abilityScores.constitution);
    const totalHitDice = character.level;
    const usedHitDice = character.hitDice.used;

    const toggleHitDie = (index: number) => {
        // Se l'indice cliccato è minore di quelli usati, stiamo "deselezionando" (error correction)
        // Se è maggiore o uguale, stiamo marcando come usato.
        const newUsed = index < usedHitDice ? index : index + 1;

        updateCharacter({
            hitDice: { ...character.hitDice, used: Math.max(0, Math.min(totalHitDice, newUsed)) }
        });
    };

    const handleAutoSpend = () => {
        if (usedHitDice >= totalHitDice || character.hp.current === 0) return;

        const { total: healing, pretty: rollDetails } = rollDiceExpression(`${character.hitDice.total}+${conModifier}`);
        const newCurrentHp = Math.min(character.hp.max, character.hp.current + Math.max(0, healing));

        setHitDiceRoll(`${rollDetails} HP`);
        updateCharacter({
            hp: { ...character.hp, current: newCurrentHp },
            hitDice: { ...character.hitDice, used: usedHitDice + 1 }
        });
    };

    const resetHitDice = () => {
        updateCharacter({ hitDice: { ...character.hitDice, used: 0 } });
        setHitDiceRoll(null);
    };

    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 flex flex-col">
            <h3 className="text-xl font-cinzel text-accent mb-6 flex justify-between items-center">
                <span>Hit Dice</span>
                <span className="text-xs font-mono text-muted-foreground/60">{totalHitDice - usedHitDice} / {totalHitDice}</span>
            </h3>

            <div className="flex-grow flex flex-col gap-6">
                {/* Visual Representation (Pills) */}
                <div className="flex flex-wrap gap-2.5">
                    {Array.from({ length: totalHitDice }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => toggleHitDie(i)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 relative overflow-hidden group ${i < usedHitDice
                                ? 'bg-accent border-accent shadow-[0_0_12px_rgba(var(--color-accent),0.4)] scale-105'
                                : 'bg-background/20 border-border/60 hover:border-accent/40 hover:bg-accent/5'
                                }`}
                            aria-label={`Hit Die ${i + 1}. ${i < usedHitDice ? 'Used' : 'Available'}`}
                        >
                            <span className="sr-only">Toggle Hit Die</span>
                            {/* Inner icon/dot */}
                            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${i < usedHitDice ? 'opacity-100 scale-100' : 'opacity-20 scale-50 group-hover:opacity-40'}`}>
                                <div className={`w-2 h-2 rounded-full ${i < usedHitDice ? 'bg-white shadow-[0_0_4px_white]' : 'bg-foreground'}`} />
                            </div>
                            {i < usedHitDice && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={handleAutoSpend}
                            disabled={usedHitDice >= totalHitDice || character.hp.current === 0}
                            className="flex-grow bg-accent/90 hover:bg-accent text-accent-foreground font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95 disabled:bg-muted/50 disabled:text-muted-foreground/50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(var(--color-accent),0.2)]"
                        >
                            Roll & Heal ({character.hitDice.total})
                        </button>
                        <button
                            onClick={resetHitDice}
                            className="bg-secondary/20 hover:bg-secondary text-secondary-foreground font-bold py-2.5 px-6 rounded-xl transition-all border border-secondary/30 active:scale-95 whitespace-nowrap"
                        >
                            Reset
                        </button>
                    </div>

                    {hitDiceRoll && (
                        <div className="text-center text-accent font-mono py-2 bg-accent/10 rounded-xl border border-accent/20 animate-in fade-in slide-in-from-top-2 duration-300">
                            Heal: <span className="font-bold">{hitDiceRoll}</span>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-4 text-[10px] text-muted-foreground/50 italic leading-tight text-center">
                Tap a die to mark it as used manually,<br />or use "Roll & Heal" for automatic action.
            </p>
        </div>
    );
};