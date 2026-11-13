import { FC } from 'react';

interface StatBoxProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: FC<{ className?: string }>;
    className?: string;
}

/**
 * Emblema di un valore di gioco in cornice incisa (`frame-rune`): icona
 * discreta in alto, numero grande al centro, etichetta sotto. In hover il
 * filo interno e il rombo prendono l'accento; l'icona lo segue.
 */
export const StatBox: FC<StatBoxProps> = ({ label, value, subValue, icon: Icon, className = '' }) => (
    <div className={`frame-rune group flex flex-col items-center justify-center px-3 pb-3 pt-4 text-center sm:pb-4 sm:pt-5 ${className}`}>
        {Icon && (
            <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/25 transition-colors duration-150 group-hover:bg-accent/20">
                <Icon className="h-3.5 w-3.5" />
            </span>
        )}
        <span className="font-mono text-4xl font-bold leading-none tabular-nums text-foreground sm:text-5xl">{value}</span>
        {subValue && <span className="mt-1 text-xs leading-none text-muted-foreground">{subValue}</span>}
        <p className="mt-2 text-label uppercase leading-tight text-muted-foreground">{label}</p>
    </div>
);
