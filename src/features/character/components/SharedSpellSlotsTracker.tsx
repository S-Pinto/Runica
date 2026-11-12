import React from 'react';
import { RefreshIcon } from '../../../components/ui/icons';

interface SpellSlotsTrackerProps {
    level: number;
    slots: { max: number; used: number };
    onChange: (level: number, used: number) => void;
    compact?: boolean;
}

export const SharedSpellSlotsTracker: React.FC<SpellSlotsTrackerProps> = ({
    level,
    slots,
    onChange,
    compact = false
}) => {
    if (level === 0 || slots.max <= 0) return null;

    const containerClass = compact ? "flex items-center gap-1.5 ml-4" : "flex flex-col gap-3 group";

    // Wrapper for compact vs detailed view
    if (compact) {
        return (
            <div className={containerClass}>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Slot</span>
                <div className="flex items-center gap-1">
                    {Array.from({ length: slots.max }).map((_, i) => {
                        const isUsed = i < slots.used;
                        return (
                            <button
                                key={i}
                                onClick={() => onChange(level, isUsed ? i : i + 1)}
                                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${isUsed
                                        ? 'bg-transparent border-destructive/50 hover:bg-destructive/10'
                                        : 'bg-accent border-accent shadow-[0_0_8px_rgb(var(--accent)/0.5)] hover:bg-accent-light'
                                    }`}
                                title={isUsed ? "Recupera slot" : "Usa slot"}
                            />
                        );
                    })}
                </div>
                <button
                    onClick={() => onChange(level, 0)}
                    className="ml-2 text-muted-foreground hover:text-accent p-0.5 rounded-full transition-colors"
                    title="Ripristina gli slot del livello"
                >
                    <RefreshIcon className="w-3 h-3" />
                </button>
            </div>
        );
    }

    // Detailed View (for Play View / Resource Tracker style)
    return (
        <div className="flex flex-col gap-3 group">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-accent/70 transition-colors">
                    Livello {level}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/60">{slots.used} / {slots.max}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
                {Array.from({ length: slots.max }).map((_, i) => {
                    const isUsed = i < slots.used;
                    return (
                        <button
                            key={i}
                            onClick={() => onChange(level, isUsed ? i : i + 1)}
                            className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 relative overflow-hidden ${isUsed
                                    ? 'bg-accent border-accent shadow-[0_0_12px_rgb(var(--color-accent)/0.4)] scale-105'
                                    : 'bg-background/20 border-border/60 hover:border-accent/40 hover:bg-accent/5'
                                }`}
                            aria-label={`Livello ${level}, slot ${i + 1}: ${isUsed ? 'usato' : 'disponibile'}`}
                        >
                            {isUsed && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};
