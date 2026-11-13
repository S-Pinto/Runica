import { FC } from 'react';

interface BentoStatProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: FC<{ className?: string }>;
    className?: string;
    /** Tessera d'accento (CA). */
    hero?: boolean;
    /** Tessera compatta (valori secondari). */
    small?: boolean;
}

/** Tessera bento senza bordo: numero d'impatto, etichetta in maiuscoletto. */
export const BentoStat = ({ label, value, sub, icon: Icon, className = '', hero, small }: BentoStatProps) => (
    <div className={`tile ${hero ? 'tile-hero' : ''} flex flex-col justify-between ${small ? 'gap-2 p-3 sm:p-4' : 'min-h-36 gap-3 p-4 sm:p-5'} ${className}`}>
        <div className="flex items-center justify-between gap-2">
            <p className="text-label font-semibold uppercase leading-tight tracking-widest text-muted-foreground">{label}</p>
            <Icon className={`${small ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 text-accent`} />
        </div>
        <div>
            <span className={`block font-mono font-black leading-none tracking-tighter tabular-nums ${hero ? 'text-accent' : 'text-foreground'} ${small ? 'text-3xl sm:text-4xl' : 'text-6xl sm:text-7xl'}`}>{value}</span>
            {sub && <span className="mt-1 block line-clamp-3 text-xs text-muted-foreground" title={sub}>{sub}</span>}
        </div>
    </div>
);
