import { ReactNode } from 'react';
import { EquipmentItem } from '../../../characterTypes';
import { PlaySection, playEmptyClass } from '../PlaySection';
import { InventoryItemRow, type InventoryItemRowProps } from './InventoryItemRow';

interface InventoryItemListProps extends Omit<InventoryItemRowProps, 'item'> {
  title: string;
  icon?: ReactNode;
  items: EquipmentItem[];
}

/** Pannello di oggetti: righe compatte, una colonna su telefono e due da `md`. */
export const InventoryItemList = ({ title, icon, items, ...rowProps }: InventoryItemListProps) => (
  <PlaySection
    title={title}
    icon={icon}
    aside={<span className="font-mono text-sm tabular-nums text-muted-foreground">{items.length}</span>}
  >
    {items.length === 0 ? (
      <p className={playEmptyClass}>Nessun oggetto in questa sezione.</p>
    ) : (
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
        {items.map(item => <InventoryItemRow key={item.id} item={item} {...rowProps} />)}
      </ul>
    )}
  </PlaySection>
);
