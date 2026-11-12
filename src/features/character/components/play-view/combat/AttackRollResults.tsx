import { TrashIcon } from '../../../../../components/ui/icons';
import { RollResult } from './useAttackRolls';

interface AttackRollResultsProps {
    results: { atk: RollResult[]; dmg: RollResult[] };
    onClear: () => void;
}

export const AttackRollResults = ({ results, onClear }: AttackRollResultsProps) => (
    <div className="mt-3 pt-3 border-t border-border/20 animate-in slide-in-from-top-2 fade-in duration-300">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Risultati</span>
            <button onClick={onClear} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Cancella risultati">
                <TrashIcon className="w-3.5 h-3.5" />
            </button>
        </div>
        <div className="flex flex-col gap-1.5">
            {results.atk?.map((roll, i) => (
                <div
                    key={`atk-${i}`}
                    className={`flex flex-col p-2 rounded-lg border text-xs font-mono shadow-sm animate-in slide-in-from-left-2 fade-in duration-300
                        ${roll.isCrit
                            ? 'bg-warning/20 border-warning/50 text-warning'
                            : roll.isFail
                                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                : 'bg-background/40 border-border/30 text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-bold tracking-wider opacity-70">COLPIRE:</span>
                        <span className="font-bold text-sm">
                            {roll.isCrit && 'CRITICO! '}
                            {roll.isFail && '1 NATURALE! '}
                            {roll.value}
                        </span>
                    </div>
                    {roll.breakdown && (
                        <div className="text-[10px] text-right opacity-60 mt-0.5 font-sans">
                            {roll.breakdown}
                        </div>
                    )}
                </div>
            ))}
            {results.dmg?.map((roll, i) => (
                <div key={`dmg-${i}`} className="flex flex-col p-2 rounded-lg border border-border/30 bg-background/40 text-xs font-mono shadow-sm animate-in slide-in-from-top-1 fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <span className="font-bold tracking-wider text-destructive/80">DANNI:</span>
                        <span className="font-bold text-sm text-destructive">{roll.value}</span>
                    </div>
                    {roll.breakdown && (
                        <div className="text-[10px] text-right opacity-60 mt-0.5 text-destructive/80 font-sans">
                            {roll.breakdown}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
);
