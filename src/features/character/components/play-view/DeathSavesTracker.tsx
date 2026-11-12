import { useCharacter } from '../../CharacterProvider';
import { RefreshIcon, HeartIcon } from '../../../../components/ui/icons';

type SaveType = 'successes' | 'failures';

const ROWS: { type: SaveType; label: string; filled: string; empty: string; text: string; border: string }[] = [
    { type: 'successes', label: 'Successi', filled: 'bg-success border-success shadow-[0_0_12px_rgb(var(--color-success)/0.45)]', empty: 'hover:border-success/50', text: 'text-success', border: 'border-success/40' },
    { type: 'failures', label: 'Fallimenti', filled: 'bg-destructive border-destructive shadow-[0_0_12px_rgb(var(--color-destructive)/0.45)]', empty: 'hover:border-destructive/50', text: 'text-destructive', border: 'border-destructive/40' },
];

export const DeathSavesTracker = () => {
    const { character, updateCharacter } = useCharacter();
    if (!character) return null;
    const saves = character.deathSaves;

    const setSaves = (type: SaveType, count: number) =>
        updateCharacter({ deathSaves: { ...saves, [type]: Math.max(0, Math.min(3, count)) } });
    const reset = () => updateCharacter({ deathSaves: { successes: 0, failures: 0 } });
    const naturalTwenty = () =>
        updateCharacter({ hp: { ...character.hp, current: 1 }, deathSaves: { successes: 0, failures: 0 } });

    const isStable = saves.successes >= 3;
    const isDead = saves.failures >= 3;
    const isComplete = isStable || isDead;
    const hasSaves = saves.successes > 0 || saves.failures > 0;

    return (
        <section aria-labelledby="death-saves-title" className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            {isComplete && (
                <div
                    className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-card/90 backdrop-blur-sm animate-fadeIn ${isStable ? 'border-success/50' : 'border-destructive/50'}`}
                    role="status"
                >
                    {isStable ? <HeartIcon className="h-12 w-12 text-success" /> : <span className="text-5xl" aria-hidden>💀</span>}
                    <p className={`font-cinzel text-3xl font-bold ${isStable ? 'text-success' : 'text-destructive'}`}>
                        {isStable ? 'Stabile' : 'Morto'}
                    </p>
                    <button
                        type="button"
                        onClick={reset}
                        className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                    >
                        <RefreshIcon className="h-4 w-4" /> Azzera
                    </button>
                </div>
            )}

            <div className="mb-5 flex items-center justify-between">
                <h3 id="death-saves-title" className="font-cinzel text-lg font-bold leading-tight text-foreground">Tiri contro la morte</h3>
                <button
                        type="button"
                        onClick={reset}
                        disabled={!hasSaves || isComplete}
                        className="shrink-0 rounded-lg p-2 disabled:invisible text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                        aria-label="Azzera tiri contro la morte"
                    >
                        <RefreshIcon className="h-4 w-4" />
                    </button>
            </div>

            <div className="space-y-6">
                {ROWS.map((row) => (
                    <div key={row.type} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${row.text}`}>{row.label}</span>
                            {row.type === 'successes' ? (
                                <button
                                    type="button"
                                    onClick={naturalTwenty}
                                    disabled={isComplete || character.hp.current > 0}
                                    className={`rounded-lg border px-2 py-0.5 text-xs font-semibold opacity-80 transition-opacity hover:opacity-100 disabled:opacity-25 ${row.text} ${row.border}`}
                                    title="20 naturale: torni cosciente con 1 punto vita"
                                >
                                    20 naturale
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setSaves(row.type, saves[row.type] + 2)}
                                    disabled={isComplete}
                                    className={`rounded-lg border px-2 py-0.5 text-xs font-semibold opacity-80 transition-opacity hover:opacity-100 disabled:opacity-25 ${row.text} ${row.border}`}
                                    title="1 naturale o colpo critico subito: due fallimenti"
                                >
                                    +2
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2.5">
                            {[0, 1, 2].map((i) => {
                                const on = i < saves[row.type];
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSaves(row.type, on && i + 1 === saves[row.type] ? i : i + 1)}
                                        disabled={isComplete}
                                        aria-label={`${row.label}: ${i + 1}`}
                                        aria-pressed={on}
                                        className={`h-10 flex-1 rounded-xl border-2 transition-all duration-300 ${on ? row.filled : `border-border bg-background/40 ${row.empty}`}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
