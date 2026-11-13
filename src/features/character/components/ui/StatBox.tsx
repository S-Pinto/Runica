import { FC } from 'react';

interface StatBoxProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: FC<{ className?: string }>;
    className?: string;
}

export const StatBox: FC<StatBoxProps> = ({ label, value, subValue, icon: Icon, className = '' }) => (
    <div className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-3 transition-colors duration-150 hover:border-accent/40 sm:p-4 ${className}`}>
        {/* Sul telefono l'icona lascia spazio al numero: lì conta l'altezza della riga. */}
        {Icon && (
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-150 group-hover:bg-accent/20 sm:flex md:hidden xl:flex">
                <Icon className="h-5 w-5" />
            </div>
        )}
        <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground sm:text-3xl">{value}</span>
                {subValue && <span className="truncate text-xs text-muted-foreground">{subValue}</span>}
            </div>
            <p className="mt-1 text-xs font-medium leading-tight text-muted-foreground">{label}</p>
        </div>
    </div>
);
