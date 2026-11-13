import { ExclamationTriangleIcon } from '../../../../../components/ui/icons';
import type { CombatNote } from '../../../rules/itemEffects';
import { PlaySection } from '../PlaySection';

/** Avvisi tattici degli oggetti equipaggiati (maledizioni, vincoli, requisito di Forza). Toccando la fonte si apre la Scheda Oggetto. */
export const CombatNotes = ({ notes, onOpenItem }: { notes: CombatNote[]; onOpenItem: (itemId: string) => void }) => {
    if (notes.length === 0) return null;
    return (
        <PlaySection title="Avvisi" icon={<ExclamationTriangleIcon className="text-warning" />}>
            <ul className="space-y-2">
                {notes.map((n, i) => (
                    <li key={`${n.itemId}-${i}`} className="flex items-start gap-3 rounded-2xl bg-warning/15 px-3 py-2.5">
                        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        <div className="min-w-0 text-sm">
                            <p className="text-foreground">{n.text}</p>
                            <button
                                type="button"
                                onClick={() => onOpenItem(n.itemId)}
                                className="mt-0.5 rounded text-xs font-semibold text-warning underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {n.source}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </PlaySection>
    );
};
