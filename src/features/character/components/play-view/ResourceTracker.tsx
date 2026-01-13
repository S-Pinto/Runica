import { FC } from 'react';
import { ICharacter, CustomResource } from '../../characterTypes';
import { SharedSpellSlotsTracker } from './../SharedSpellSlotsTracker';

interface ResourceTrackerProps {
    title: string;
    slots: ICharacter['spellSlots'] | CustomResource[];
    onSlotChange: (newSlots: any) => void;
    isCustom?: boolean;
}

export const ResourceTracker: FC<ResourceTrackerProps> = ({ title, slots, onSlotChange, isCustom = false }) => {
    const toggleSlot = (key: string | number, index: number) => {
        if (isCustom) {
            const customSlots = slots as CustomResource[];
            const resourceIndex = customSlots.findIndex(r => r.id === key);
            if (resourceIndex === -1) return;
            const resource = customSlots[resourceIndex];
            const newUsed = index < resource.used ? index : index + 1;
            const newResources = [...customSlots];
            newResources[resourceIndex] = { ...resource, used: newUsed };
            onSlotChange(newResources);
        } else {
            const spellSlots = slots as ICharacter['spellSlots'];
            const levelData = spellSlots[key as number];
            const newUsed = index < levelData.used ? index : index + 1;
            onSlotChange({ ...spellSlots, [key]: { ...levelData, used: newUsed } });
        }
    };

    // Wrapper for SharedSpellSlotsTracker to match signature
    const handleSharedChange = (level: number, used: number) => {
        const spellSlots = slots as ICharacter['spellSlots'];
        const currentSlots = spellSlots[level] || { max: 0, used: 0 };
        onSlotChange({ ...spellSlots, [level]: { ...currentSlots, used } });
    };

    const entries: CustomResource[] | [string, { max: number; used: number; }][] = isCustom
        ? [...(slots as CustomResource[])].sort((a, b) => a.name.localeCompare(b.name))
        : Object.entries(slots as ICharacter['spellSlots']);

    const hasSlots = isCustom
        ? (entries as CustomResource[]).some(entry => entry.max > 0)
        : (entries as [string, { max: number; used: number; }][]).some(([, data]) => data.max > 0);

    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5">
            <h3 className="text-xl font-cinzel text-accent mb-6 flex justify-between items-center">
                <span>{title}</span>
                {isCustom && <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted-foreground/50">Custom</span>}
            </h3>
            {!hasSlots && (
                <div className="bg-muted/10 rounded-xl border border-dashed border-border/50 py-8 px-4 text-center">
                    <p className="text-muted-foreground text-sm italic">Nothing to track here yet.</p>
                </div>
            )}
            <div className="space-y-5">
                {entries.map((entry) => {
                    let key: string | number;
                    let data: { max: number; used: number; name?: string };
                    if (isCustom) {
                        key = (entry as CustomResource).id;
                        data = entry as CustomResource;
                    } else {
                        key = (entry as [string, { max: number; used: number }])[0];
                        data = (entry as [string, { max: number; used: number }])[1];
                    }

                    if (data.max === 0) return null;

                    if (!isCustom) {
                        // Use Shared Component for Spells
                        return (
                            <SharedSpellSlotsTracker
                                key={key}
                                level={Number(key)}
                                slots={{ max: data.max, used: data.used }}
                                onChange={handleSharedChange}
                                compact={false} // Use detailed view
                            />
                        );
                    }

                    // Custom Resource Layout (kept separate as SharedSpellSlotsTracker is specific to Levels)
                    const levelLabel = (data as CustomResource).name;
                    return (
                        <div key={key} className="flex flex-col gap-3 group">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-accent/70 transition-colors" title={levelLabel}>
                                    {levelLabel}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground/60">{data.used} / {data.max}</span>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {Array.from({ length: data.max }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleSlot(key, i)}
                                        className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 relative overflow-hidden ${i < data.used
                                            ? 'bg-accent border-accent shadow-[0_0_12px_rgba(var(--color-accent),0.4)] scale-105'
                                            : 'bg-background/20 border-border/60 hover:border-accent/40 hover:bg-accent/5'
                                            }`}
                                        aria-label={`Slot ${i + 1} for ${levelLabel}. ${i < data.used ? 'Used' : 'Available'}`}
                                    >
                                        {i < data.used && (
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};