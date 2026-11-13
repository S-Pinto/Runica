import { ReactNode } from 'react';

interface PlaySectionProps {
    /** Titolo del pannello; senza titolo (e senza `aside`) l'intestazione non compare. */
    title?: string;
    /** Icona accanto al titolo (già dimensionata dal pannello). */
    icon?: ReactNode;
    /** Controllo o valore allineato a destra del titolo. */
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
    /** Elemento radice: `section` (predefinito) o `div` dentro un'altra regione. */
    as?: 'section' | 'div';
    id?: string;
}

/** Etichetta breve sopra un valore o un gruppo di controlli. */
export const playLabelClass = 'text-label uppercase text-muted-foreground';

/** Riga o riquadro interno a un pannello: un gradino sotto la card, senza ombra. */
export const playInsetClass = 'rounded-2xl bg-background/50';

/** Messaggio di elenco vuoto dentro un pannello. */
export const playEmptyClass = 'rounded-2xl bg-background/40 px-4 py-6 text-center text-sm text-muted-foreground';

/** Titolo di un sottogruppo dentro un pannello (es. "Tiri salvezza"): Cinzel è il titolo di gruppo, non di contenitore. */
export const playGroupTitleClass = 'font-cinzel text-title text-foreground';

/** Etichetta piccola per dati secondari (quantità, tipo di danno, proprietà). */
export const playChipClass = 'inline-flex items-center gap-1 rounded-md bg-foreground/10 px-1.5 py-0.5 text-xs text-muted-foreground';

/**
 * Pannello della vista di gioco: tessera `.tile` (senza bordo), titolo inciso e
 * un'eventuale azione a destra. Tutte le schede usano questo guscio.
 */
export const PlaySection = ({ title, icon, aside, children, className = '', as: Root = 'section', id }: PlaySectionProps) => (
    <Root id={id} aria-label={Root === 'section' ? title : undefined} className={`tile p-4 sm:p-5 ${className}`}>
        {(title || aside) && (
            <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
                {title && (
                    // Il titolo va a capo (mai troncato): a 375px "Attacchi e trucchetti" sta accanto ad "Aggiungi".
                    <h3 className="flex min-w-0 items-center gap-2 text-label font-semibold uppercase leading-snug tracking-widest text-muted-foreground">
                        {icon && <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>}
                        <span className="min-w-0 break-words [text-wrap:balance]">{title}</span>
                    </h3>
                )}
                {aside && <div className="ml-auto flex shrink-0 items-center gap-2">{aside}</div>}
            </div>
        )}
        {children}
    </Root>
);
