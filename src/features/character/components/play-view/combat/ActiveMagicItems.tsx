import { useMemo } from 'react';
import { EquipmentItem } from '../../../characterTypes';
import { BoltIcon, MinusIcon, PlusIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { adjustItemCharges, getItemCharges, hasActivePower, isAttunementSatisfied, isWeapon } from '../../../rules/equipment';
import { PlaySection } from '../PlaySection';

/**
 * Oggetti magici equipaggiati con cariche da spendere in combattimento.
 * Armi e oggetti con un potere hanno le cariche sulla propria riga d'attacco, quindi qui non si ripetono.
 */
export const ActiveMagicItems = ({ equipment, onUpdate }: { equipment: EquipmentItem[]; onUpdate: (newEquip: EquipmentItem[]) => void }) => {
    const activeItems = useMemo(
        () => (equipment || []).filter(item => item.equipped && getItemCharges(item) && !isWeapon(item) && !hasActivePower(item)),
        [equipment],
    );

    if (activeItems.length === 0) return null;

    return (
        <PlaySection title="Oggetti magici equipaggiati" icon={<BoltIcon className="text-muted-foreground" />}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeItems.map(item => {
                    const charges = getItemCharges(item)!;
                    const attuned = isAttunementSatisfied(item);
                    return (
                        <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-background/50 p-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    <span className="font-mono text-sm font-bold tabular-nums text-foreground">{charges.current}</span>
                                    <span className="font-mono">/{charges.max}</span> cariche
                                    {!attuned && <span className="text-warning"> · non in sintonia</span>}
                                </p>
                                {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onUpdate(adjustItemCharges(equipment, item.id, 1))}
                                    disabled={charges.current >= charges.max}
                                    aria-label={`Recupera una carica di ${item.name}`}
                                    title="Recupera una carica"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => onUpdate(adjustItemCharges(equipment, item.id, -1))}
                                    disabled={charges.current <= 0 || !attuned}
                                    title={attuned ? 'Spendi una carica' : 'Serve la sintonia per usare le cariche'}
                                >
                                    <MinusIcon className="h-4 w-4" /> Usa
                                </Button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </PlaySection>
    );
};
