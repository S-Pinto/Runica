import { useCharacter } from '../../CharacterProvider';
import { RefreshIcon, HeartIcon } from '../../../../components/ui/icons';

export const DeathSavesTracker = () => {
    const { character, updateCharacter } = useCharacter();
    if (!character) return null;
    const { deathSaves: saves } = character;

    const handleSetSaves = (type: 'successes' | 'failures', count: number) => {
        const newCount = Math.max(0, Math.min(3, count));
        updateCharacter({ deathSaves: { ...saves, [type]: newCount } });
    };

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
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 flex flex-col relative overflow-hidden">
            {/* Status Overlays */}
            {isStabilized && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-500 rounded-2xl border-2 border-green-500/50">
                    <div className="bg-green-500/20 p-4 rounded-full mb-2 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <HeartIcon className="w-12 h-12 text-green-400 fill-green-400/20" />
                    </div>
                    <p className="text-3xl font-black text-green-400 uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] scale-110">Stabilized</p>
                </div>
            )}
            {isDead && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-500 rounded-2xl border-2 border-red-600/50">
                    <div className="bg-red-600/20 p-4 rounded-full mb-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                        <div className="w-12 h-12 flex items-center justify-center text-4xl">💀</div>
                    </div>
                    <p className="text-4xl font-black text-red-500 uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-pulse">Dead</p>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-cinzel text-accent flex items-center gap-2">
                    Death Saves
                </h3>
                {hasSaves && !isComplete && (
                    <button
                        onClick={handleReset}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                        aria-label="Reset Death Saves"
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                )}
                {isComplete && (
                    <button
                        onClick={handleReset}
                        className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-20"
                        aria-label="Reset Death Saves"
                    >
                        <RefreshIcon className="w-5 h-5 font-bold" />
                    </button>
                )}
            </div>

            <div className="space-y-8">
                {/* Successes Row */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-green-500/80">Successes</span>
                        <button
                            onClick={() => handleCrit('successes')}
                            disabled={isComplete || saves.successes >= 2}
                            className="text-[10px] font-bold bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg px-2 py-1 border border-green-500/20 transition-all disabled:opacity-20"
                        >
                            +2 CRIT
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {[...Array(3)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => !isComplete && handleSetSaves('successes', i + 1)}
                                disabled={isComplete}
                                className={`flex-1 h-10 rounded-xl transition-all duration-300 relative border-2 ${i < saves.successes
                                    ? 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                                    : 'bg-background/20 border-border/40 hover:border-green-500/40'
                                    }`}
                            >
                                {i < saves.successes && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Failures Row */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-red-500/80">Failures</span>
                        <button
                            onClick={() => handleCrit('failures')}
                            disabled={isComplete || saves.failures >= 2}
                            className="text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg px-2 py-1 border border-red-500/20 transition-all disabled:opacity-20"
                        >
                            +2 CRIT
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {[...Array(3)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => !isComplete && handleSetSaves('failures', i + 1)}
                                disabled={isComplete}
                                className={`flex-1 h-10 rounded-xl transition-all duration-300 relative border-2 ${i < saves.failures
                                    ? 'bg-red-600 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                                    : 'bg-background/20 border-border/40 hover:border-red-600/40'
                                    }`}
                            >
                                {i < saves.failures && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};