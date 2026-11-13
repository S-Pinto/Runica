import { ReactNode } from 'react';

interface PlaySectionProps {
    title: string;
    /** Icona accanto al titolo (già dimensionata dal pannello). */
    icon?: ReactNode;
    /** Controllo o valore allineato a destra del titolo. */
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}

/** Etichetta breve sopra un valore o un gruppo di controlli. */
export const playLabelClass = 'text-label uppercase text-muted-foreground';

/** Riga o riquadro interno a un pannello: un gradino sotto la card, senza ombra. */
export const playInsetClass = 'rounded-2xl bg-background/50';

/** Messaggio di elenco vuoto dentro un pannello. */
export const playEmptyClass = 'rounded-xl border border-dashed border-border-strong/50 px-4 py-6 text-center text-sm text-muted-foreground';

/** Etichetta piccola per dati secondari (quantità, tipo di danno, proprietà). */
export const playChipClass = 'inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground';

/**
 * Pannello della vista di gioco: card piatta con bordo, titolo inciso e
 * un'eventuale azione a destra. Tutte le schede usano questo guscio.
 */
export const PlaySection = ({ title, icon, aside, children, className = '' }: PlaySectionProps) => (
    <section aria-label={title} className={`tile p-4 sm:p-5 ${className}`}>
        <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
            <h3 className="flex min-w-0 items-center gap-2 text-label font-semibold uppercase tracking-widest text-muted-foreground">
                {icon && <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>}
                <span className="truncate">{title}</span>
            </h3>
            {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
        </div>
        {children}
    </section>
);
