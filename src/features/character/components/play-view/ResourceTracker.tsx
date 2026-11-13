import { FC } from 'react';
import { ICharacter, CustomResource } from '../../characterTypes';
import { PlaySection, playLabelClass } from './PlaySection';

interface ResourceTrackerProps {
    title: string;
    slots: ICharacter['spellSlots'] | CustomResource[];
    onSlotChange: (newSlots: any) => void;
    isCustom?: boolean;
}

interface ResourceRow {
    key: string;
    label: string;
    max: number;
    used: number;
}

/**
 * Slot incantesimo o risorse personalizzate. Come per i dadi vita, il segno pieno è
 * una risorsa ancora disponibile; toccandolo la si spende (o la si recupera).
 */
export const ResourceTracker: FC<ResourceTrackerProps> = ({ title, slots, onSlotChange, isCustom = false }) => {
    const rows: ResourceRow[] = isCustom
        ? [...(slots as CustomResource[])]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(r => ({ key: r.id, label: r.name, max: r.max, used: r.used }))
        : Object.entries(slots as ICharacter['spellSlots'])
            .map(([level, data]) => ({ key: level, label: `Livello ${level}`, max: data.max, used: data.used }));

    const visibleRows = rows.filter(row => row.max > 0);

    const setUsed = (row: ResourceRow, used: number) => {
        if (isCustom) {
            onSlotChange((slots as CustomResource[]).map(r => (r.id === row.key ? { ...r, used } : r)));
        } else {
            const spellSlots = slots as ICharacter['spellSlots'];
            const level = Number(row.key);
            onSlotChange({ ...spellSlots, [level]: { ...(spellSlots[level] || { max: 0, used: 0 }), used } });
        }
    };

    return (
        <PlaySection title={title}>
            {visibleRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ancora niente da tracciare.</p>
            ) : (
                <div className="space-y-4">
                    {visibleRows.map(row => (
                        <div key={row.key}>
                            <div className="flex items-baseline justify-between gap-3">
                                <span className={`${playLabelClass} min-w-0 truncate`} title={row.label}>{row.label}</span>
                                <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                                    <span className="font-bold text-foreground">{row.max - row.used}</span>/{row.max}
                                </span>
                            </div>
                            <div className="-ml-1.5 mt-1 flex flex-wrap" role="group" aria-label={row.label}>
                                {Array.from({ length: row.max }).map((_, i) => {
                                    const isUsed = i < row.used;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setUsed(row, isUsed ? i : i + 1)}
                                            aria-pressed={isUsed}
                                            aria-label={`${row.label}, ${i + 1}: ${isUsed ? 'usato' : 'disponibile'}`}
                                            className="group flex h-10 w-10 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <span
                                                aria-hidden
                                                className={`h-6 w-6 rounded-lg border-2 transition-colors duration-150 ${
                                                    isUsed ? 'border-border-strong/50 bg-transparent group-hover:border-accent/60' : 'border-accent bg-accent group-hover:bg-accent-dark'
                                                }`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PlaySection>
    );
};
