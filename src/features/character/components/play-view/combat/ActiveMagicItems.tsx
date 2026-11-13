import { useMemo } from 'react';
import { EquipmentItem } from '../../../characterTypes';
import { BoltIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { PlaySection } from '../PlaySection';

/** Oggetti magici equipaggiati che hanno cariche da spendere in combattimento. */
export const ActiveMagicItems = ({ equipment, onUpdate }: { equipment: EquipmentItem[]; onUpdate: (newEquip: EquipmentItem[]) => void }) => {
    const activeItems = useMemo(() => {
        return (equipment || []).filter(item => item.equipped && item.charges && item.charges.max > 0);
    }, [equipment]);

    if (activeItems.length === 0) return null;

    const handleUse = (itemId: string) => {
        const updated = equipment.map(item => {
            if (item.id === itemId && item.charges && item.charges.current > 0) {
                return {
                    ...item,
                    charges: { ...item.charges, current: item.charges.current - 1 }
                };
            }
            return item;
        });
        onUpdate(updated);
    };

    return (
        <PlaySection title="Oggetti magici equipaggiati" icon={<BoltIcon className="text-muted-foreground" />}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeItems.map(item => (
                    <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                <span className="font-mono text-sm font-bold tabular-nums text-foreground">{item.charges?.current}</span>
                                <span className="font-mono">/{item.charges?.max}</span> cariche
                            </p>
                            {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                        <Button variant="secondary" onClick={() => handleUse(item.id)} disabled={(item.charges?.current || 0) <= 0}>
                            Usa
                        </Button>
                    </li>
                ))}
            </ul>
        </PlaySection>
    );
};
