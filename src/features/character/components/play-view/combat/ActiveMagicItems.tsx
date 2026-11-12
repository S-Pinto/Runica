import { useMemo } from 'react';
import { EquipmentItem } from '../../../characterTypes';

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
        <div className="bg-accent/10 backdrop-blur-sm p-4 rounded-2xl border border-accent/30 space-y-3">
            <h4 className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span> Oggetti magici equipaggiati
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeItems.map(item => (
                    <div key={item.id} className="bg-card/60 p-3 rounded-xl border border-accent/20 flex flex-col justify-between gap-2 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-foreground text-xs truncate">{item.name}</span>
                            <span className="text-[11px] font-mono font-bold text-accent bg-accent/20 px-2 py-0.5 rounded">
                                {item.charges?.current} / {item.charges?.max} Usi
                            </span>
                        </div>
                        {item.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                        )}
                        <button
                            onClick={() => handleUse(item.id)}
                            disabled={(item.charges?.current || 0) <= 0}
                            className="w-full py-1 bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-accent-foreground font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm"
                        >
                            ⚡ Usa capacità
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
