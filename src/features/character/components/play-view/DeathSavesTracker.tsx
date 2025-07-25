import React from 'react';
import { useCharacter } from '../../CharacterProvider';
import { RefreshIcon } from '../../../../components/ui/icons';

export const DeathSavesTracker = () => {
    const { character, updateCharacter } = useCharacter();
    const { deathSaves: saves } = character;

    const handleSetSaves = (type: 'successes' | 'failures', count: number) => {
        const newCount = Math.max(0, Math.min(3, count));
        updateCharacter({ deathSaves: { ...saves, [type]: newCount } });
    };

    // Aggiunta la gestione dei colpi critici
    const handleCrit = (type: 'successes' | 'failures') => {
        handleSetSaves(type, saves[type] + 2);
    };

    const handleReset = () => {
        updateCharacter({ deathSaves: { successes: 0, failures: 0 } });
    };

    const hasSaves = saves.successes > 0 || saves.failures > 0;
    const isStabilized = saves.successes >= 3;
    const isDead = saves.failures >= 3;
    const isComplete = isStabilized || isDead;

    return (
        <div className="bg-card p-4 rounded-lg border border-border flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-cinzel text-accent">Death Saves</h3>
                {hasSaves && (
                    <button onClick={handleReset} className="p-1.5 text-muted-foreground hover:text-accent transition-colors" aria-label="Reset Death Saves">
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Successes Row */}
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Successes</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} role="button" tabIndex={isComplete ? -1 : 0} aria-label={`Set successes to ${i + 1}`}
                                     onClick={() => !isComplete && handleSetSaves('successes', i + 1)} onKeyDown={(e) => !isComplete && e.key === 'Enter' && handleSetSaves('successes', i + 1)}
                                     className={`w-8 h-8 rounded-full transition-colors ${isComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${i < saves.successes ? 'bg-green-500' : 'bg-background border border-border hover:bg-muted'}`} />
                            ))}
                        </div>
                        <button onClick={() => handleCrit('successes')} disabled={isComplete || saves.successes >= 2} className="text-xs bg-background border border-border hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed">+2 Crit</button>
                    </div>
                </div>

                {/* Failures Row */}
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Failures</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} role="button" tabIndex={isComplete ? -1 : 0} aria-label={`Set failures to ${i + 1}`}
                                     onClick={() => !isComplete && handleSetSaves('failures', i + 1)} onKeyDown={(e) => !isComplete && e.key === 'Enter' && handleSetSaves('failures', i + 1)}
                                     className={`w-8 h-8 rounded-full transition-colors ${isComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${i < saves.failures ? 'bg-red-600' : 'bg-background border border-border hover:bg-muted'}`} />
                            ))}
                        </div>
                        <button onClick={() => handleCrit('failures')} disabled={isComplete || saves.failures >= 2} className="text-xs bg-background border border-border hover:bg-destructive hover:text-destructive-foreground rounded-md px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed">+2 Crit</button>
                    </div>
                </div>
            </div>

            {isStabilized && <p className="text-center text-lg font-bold text-green-400 uppercase tracking-wider">Stabilized</p>}
            {isDead && <p className="text-center text-2xl font-bold text-destructive uppercase tracking-widest animate-pulse">Dead</p>}
        </div>
    );
};