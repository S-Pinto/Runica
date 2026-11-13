import { useCharacter } from '../../CharacterProvider';
import { RefreshIcon, HeartIcon, SkullIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { PlaySection } from './PlaySection';

type SaveType = 'successes' | 'failures';

const ROWS: { type: SaveType; label: string; text: string }[] = [
    { type: 'successes', label: 'Successi', text: 'text-success' },
    { type: 'failures', label: 'Fallimenti', text: 'text-destructive' },
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
        <PlaySection
            title="Tiri contro la morte"
            className="relative overflow-hidden"
            aside={
                <Button variant="ghost" size="icon" onClick={reset} disabled={!hasSaves || isComplete} className="disabled:invisible" aria-label="Azzera tiri contro la morte">
                    <RefreshIcon className="h-4 w-4" />
                </Button>
            }
        >
            {isComplete && (
                <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card/95 backdrop-blur-md animate-fadeIn"
                    role="status"
                >
                    {isStable ? <HeartIcon className="h-10 w-10 text-success" /> : <SkullIcon className="h-10 w-10 text-destructive" />}
                    <p className={`font-cinzel text-2xl font-bold ${isStable ? 'text-success' : 'text-destructive'}`}>
                        {isStable ? 'Stabile' : 'Morto'}
                    </p>
                    <Button variant="secondary" onClick={reset} className="mt-2">
                        <RefreshIcon className="h-4 w-4" /> Azzera
                    </Button>
                </div>
            )}

            <div className="space-y-4">
                {ROWS.map((row) => (
                    <div key={row.type} className="space-y-2">
                        <div className="flex min-h-9 items-center justify-between">
                            <span className={`text-label uppercase ${row.text}`}>{row.label}</span>
                            {row.type === 'successes' ? (
                                <button
                                    type="button"
                                    onClick={naturalTwenty}
                                    disabled={isComplete || character.hp.current > 0}
                                    className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors duration-150 bg-success/10 hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 ${row.text}`}
                                    title="20 naturale: torni cosciente con 1 punto vita"
                                >
                                    20 naturale
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setSaves(row.type, saves[row.type] + 2)}
                                    disabled={isComplete}
                                    className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors duration-150 bg-destructive/10 hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 ${row.text}`}
                                    title="1 naturale o colpo critico subito: due fallimenti"
                                >
                                    +2 fallimenti
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {[0, 1, 2].map((i) => {
                                const on = i < saves[row.type];
                                return (
                                    <input
                                        key={i}
                                        type="checkbox"
                                        className="check-rune"
                                        data-size="lg"
                                        data-tone={row.type === 'successes' ? 'success' : 'destructive'}
                                        checked={on}
                                        onChange={() => setSaves(row.type, on && i + 1 === saves[row.type] ? i : i + 1)}
                                        disabled={isComplete}
                                        aria-label={`${row.label}: ${i + 1}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </PlaySection>
    );
};
