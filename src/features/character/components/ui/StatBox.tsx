
import { FC } from 'react';

interface StatBoxProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: FC<{ className?: string }>;
    className?: string;
}

export const StatBox: FC<StatBoxProps> = ({ label, value, subValue, icon: Icon, className }) => (
    <div className={`flex flex-col items-center justify-center p-4 bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg relative overflow-hidden group hover:border-accent/30 transition-all duration-300 ${className}`}>
        {Icon && (
            <div className="absolute top-2 right-2 text-accent/20 group-hover:text-accent/40 group-hover:scale-110 transition-all duration-300">
                <Icon className="w-8 h-8 md:w-10 md:h-10" />
            </div>
        )}
        <span className="text-3xl md:text-4xl font-black font-mono text-foreground z-10 drop-shadow-sm">{value}</span>
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1 z-10 group-hover:text-accent transition-colors">{label}</span>
        {subValue && <span className="text-[10px] text-muted-foreground/60 mt-0.5 z-10 font-medium">{subValue}</span>}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
);