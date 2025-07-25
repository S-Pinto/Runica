import React from 'react';
import { ICharacter, CustomResource } from '../../characterTypes';

interface ResourceTrackerProps {
    title: string;
    slots: ICharacter['spellSlots'] | CustomResource[];
    onSlotChange: (newSlots: any) => void;
    isCustom?: boolean;
}

export const ResourceTracker: React.FC<ResourceTrackerProps> = ({ title, slots, onSlotChange, isCustom = false }) => {
    const toggleSlot = (key: string | number, index: number) => {
        if (isCustom) {
            const customSlots = slots as CustomResource[];
            const resourceIndex = customSlots.findIndex(r => r.id === key);
            if (resourceIndex === -1) return;
            const resource = customSlots[resourceIndex];
            const newUsed = index < resource.used ? index : index + 1; // click to toggle
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

    const entries: CustomResource[] | [string, { max: number; used: number; }][] = isCustom
        ? (slots as CustomResource[])
        : Object.entries(slots as ICharacter['spellSlots']);

    const hasSlots = isCustom
        ? (entries as CustomResource[]).some(entry => entry.max > 0)
        : (entries as [string, { max: number; used: number; }][]).some(([, data]) => data.max > 0);

    return (
        <div className="bg-card p-4 rounded-lg border border-border">
            <h3 className="text-lg font-cinzel text-accent mb-3">{title}</h3>
            {!hasSlots && <p className="text-muted-foreground text-sm text-center">No resources available.</p>}
            <div className="space-y-3">
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
                    const level = isCustom ? (data as CustomResource).name : `Lvl ${key}`;
                    if (data.max === 0) return null;

                    return (
                        <div key={key} className="flex items-center">
                            <span className="font-bold text-muted-foreground w-24 truncate" title={level}>{level}:</span>
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: data.max }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleSlot(key, i)}
                                        className={`w-5 h-5 rounded-md border-2 transition-colors ${i < data.used ? 'bg-primary border-primary/80' : 'bg-muted border-border hover:border-accent'}`}
                                        aria-label={`Slot ${i + 1} for ${level}. ${i < data.used ? 'Used' : 'Available'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};