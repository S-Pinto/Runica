import type { ILiveStats } from '../../character/characterTypes';
import { slotSummary } from '../../character/rules/campaign';

/** Slot incantesimo per livello come sigilli (pieno = disponibile, vuoto = speso). Solo lettura. */
export const SpellSlotPips = ({ slots }: { slots: ILiveStats['spellSlots'] | undefined }) => {
    const levels = slotSummary(slots);
    if (levels.length === 0) return null;
    return (
        <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Slot incantesimo">
            {levels.map(({ level, max, available }) => (
                <li key={level} className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-muted-foreground" aria-hidden>{level}</span>
                    <span className="flex items-center gap-0.5" aria-hidden>
                        {Array.from({ length: max }, (_, i) => (
                            // `rotate-45` insieme a `scale-75`: la trasformazione di Tailwind sostituisce la rotazione del sigillo.
                            <span key={i} className="seal rotate-45 scale-75" data-on={i < available} />
                        ))}
                    </span>
                    <span className="sr-only">Livello {level}: {available} su {max} disponibili</span>
                </li>
            ))}
        </ul>
    );
};
