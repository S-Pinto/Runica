import { FC } from 'react';
import { playInsetClass } from '../play-view/PlaySection';

interface BentoStatProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: FC<{ className?: string }>;
    className?: string;
    /** Tessera d'accento (CA). */
    hero?: boolean;
    /** Tessera compatta (valori secondari). */
    small?: boolean;
    /**
     * Dentro un pannello (`PlaySection`/`StyledSection`): riquadro interno
     * (`playInsetClass`) invece di una seconda `.tile`, così niente tessere annidate.
     */
    inset?: boolean;
    /** Valore impostato a mano (override): chip "Manuale" e numero in `warning`. */
    manual?: boolean;
}

/** Tessera bento senza bordo: numero d'impatto, etichetta in maiuscoletto. */
export const BentoStat = ({ label, value, sub, icon: Icon, className = '', hero, small, inset, manual }: BentoStatProps) => {
    const surface = inset ? playInsetClass : `tile ${hero ? 'tile-hero' : ''}`;
    const tone = manual ? 'text-warning' : hero ? 'text-accent' : 'text-foreground';
    return (
        <div className={`${surface} flex min-w-0 flex-col justify-between ${small ? 'gap-2 p-3 sm:p-4' : 'min-h-36 gap-3 p-4 sm:p-5'} ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 text-label font-semibold uppercase leading-tight tracking-widest text-muted-foreground">{label}</p>
                {manual ? (
                    <span className="inline-flex shrink-0 items-center rounded-md bg-warning/15 px-1.5 py-0.5 text-xs font-semibold text-warning">Manuale</span>
                ) : (
                    Icon && <Icon className={`${small ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 text-accent`} />
                )}
            </div>
            <div>
                <span className={`block font-mono font-black leading-none tracking-tighter tabular-nums ${tone} ${small ? 'text-3xl sm:text-4xl' : 'text-6xl sm:text-7xl'}`}>{value}</span>
                {sub && <span className="mt-1 block line-clamp-3 text-xs text-muted-foreground" title={sub}>{sub}</span>}
            </div>
        </div>
    );
};
