import type { NarrativeVitals } from '../../character/characterTypes';
import { NARRATIVE_VITALS_LABELS } from '../../character/rules/campaign';

export const VITALS_TONE: Record<NarrativeVitals, string> = {
    healthy: 'bg-success/15 text-success',
    wounded: 'bg-warning/15 text-warning',
    critical: 'bg-destructive/15 text-destructive',
    down: 'bg-destructive/25 text-destructive',
};

const FILL: Record<NarrativeVitals, string> = {
    healthy: 'bg-success',
    wounded: 'bg-warning',
    critical: 'bg-destructive',
    down: 'bg-destructive',
};

/** Gradini accesi per stato: Sano 4, Ferito 2, Critico 1, A terra 0. */
const STEPS: Record<NarrativeVitals, number> = { healthy: 4, wounded: 2, critical: 1, down: 0 };

/** Stato narrativo (modalità senza numeri): chip colorato con l'etichetta. */
export const VitalsBadge = ({ vitals }: { vitals: NarrativeVitals }) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${VITALS_TONE[vitals]}`}>
        <span className="sr-only">Stato: </span>{NARRATIVE_VITALS_LABELS[vitals]}
    </span>
);

/** Barra a quattro gradini, senza numeri: il colore non è l'unica informazione (c'è anche il chip). */
export const VitalsBar = ({ vitals }: { vitals: NarrativeVitals }) => (
    <div className="grid grid-cols-4 gap-1" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={`h-2.5 rounded-full transition-colors duration-300 ease-soft ${i < STEPS[vitals] ? FILL[vitals] : 'bg-background/60'}`} />
        ))}
    </div>
);
