import { TrashIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { playLabelClass } from '../PlaySection';
import { RollResult } from './useAttackRolls';

interface AttackRollResultsProps {
    results: { atk: RollResult[]; dmg: RollResult[] };
    onClear: () => void;
}

const rowClass = 'rounded-xl px-3 py-2 animate-fadeIn';

/** Danni: il totale in grande e, con più tipi, un parziale per tipo (dadi e modificatore) per resistenze e immunità. */
const DamageResult = ({ roll }: { roll: RollResult }) => {
    const parts = roll.parts || [];
    const multi = parts.length > 1;
    return (
        <div className={`${rowClass} ${roll.isCrit ? 'bg-success/15 ring-1 ring-success/30' : 'bg-foreground/10'} text-foreground`}>
            <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                    <p className={`text-sm font-semibold ${roll.isCrit ? 'text-success' : ''}`}>{roll.isCrit ? 'Danni critici' : 'Danni'}</p>
                    {!multi && roll.breakdown && <p className="text-xs text-muted-foreground">{roll.breakdown}</p>}
                </div>
                <span className="font-mono text-2xl font-bold leading-none tabular-nums">{roll.value}</span>
            </div>
            {multi && (
                <ul className="mt-2 space-y-1 border-t border-foreground/10 pt-2">
                    {parts.map((p, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 text-sm">
                                <span className={p.primary ? 'font-semibold text-foreground' : 'font-semibold text-accent'}>{p.typeLabel || 'Senza tipo'}</span>
                                <span className="ml-2 font-mono text-xs text-muted-foreground">
                                    {p.dice.length > 0 && `[${p.dice.join('+')}]`}{p.modifier ? ` ${p.modifier > 0 ? '+' : '-'} ${Math.abs(p.modifier)}` : ''}
                                </span>
                            </span>
                            <span className="font-mono text-lg font-bold tabular-nums">{p.total}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

/** Esiti dei tiri di un attacco: il totale in grande, il dettaglio dei dadi sotto. */
export const AttackRollResults = ({ results, onClear }: AttackRollResultsProps) => (
    <div className="mt-3 border-t border-foreground/10 pt-2" aria-live="polite">
        <div className="flex items-center justify-between">
            <span className={playLabelClass}>Risultati</span>
            <Button variant="ghost" size="icon" onClick={onClear} aria-label="Cancella i risultati" title="Cancella i risultati">
                <TrashIcon className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex flex-col gap-1.5">
            {results.atk?.map((roll, i) => {
                const tone = roll.isCrit
                    ? 'bg-success/15 text-success ring-1 ring-success/30'
                    : roll.isFail
                        ? 'bg-destructive/15 text-destructive ring-1 ring-destructive/30'
                        : 'bg-foreground/10 text-foreground';
                return (
                    <div key={`atk-${i}`} className={`${rowClass} flex items-baseline justify-between gap-3 ${tone}`}>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">
                                {roll.isCrit ? 'Colpo critico' : roll.isFail ? '1 naturale' : 'Colpire'}
                            </p>
                            {roll.breakdown && <p className="text-xs text-muted-foreground">{roll.breakdown}</p>}
                        </div>
                        <span className="font-mono text-2xl font-bold leading-none tabular-nums">{roll.value}</span>
                    </div>
                );
            })}
            {results.dmg?.map((roll, i) => <DamageResult key={`dmg-${i}`} roll={roll} />)}
        </div>
    </div>
);
