import { ReactNode } from 'react';
import { EquipmentItem } from '../../characterTypes';
import { TrashIcon, EditIcon, ChevronDownIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { playChipClass, playEmptyClass, playInsetClass } from '../play-view/PlaySection';
import { damageTypeLabel } from '../../../../lib/labels';
import { itemArmorValue, itemKindLabel, weaponPropertyLabel } from '../../utils/itemLabels';

export const ItemDisplayList = ({
  title,
  icon,
  emptyText,
  items,
  expandedItem,
  onToggleExpand,
  onToggleEquip,
  onEdit,
  onDelete,
}: {
  title: string;
  icon?: ReactNode;
  emptyText: string;
  items: EquipmentItem[];
  expandedItem: string | null;
  onToggleExpand: (id: string) => void;
  onToggleEquip: (id: string) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (id: string) => void;
}) => (
  <div>
    <h4 className="mb-3 flex items-center gap-2 text-label uppercase text-muted-foreground">
      {icon && <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
      {title}
      <span className="font-mono tabular-nums">{items.length}</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </h4>
    {items.length === 0 ? (
      <p className={playEmptyClass}>{emptyText}</p>
    ) : (
      <ul className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
        {items.map(item => {
          const open = expandedItem === item.id;
          const armorValue = itemArmorValue(item);
          const stats = [
            itemKindLabel(item),
            `Q.tà ${item.quantity}`,
            item.damage && `Danni ${item.damage}`,
            armorValue ? `CA ${armorValue}` : '',
            item.requiresAttunement ? (item.isAttuned ? 'In sintonia' : 'Sintonia richiesta') : '',
          ].filter(Boolean).join(' · ');
          return (
            <li key={item.id} className={`${playInsetClass} transition-colors duration-150 hover:bg-background/70`}>
              <div className="flex items-center gap-1 p-1">
                <button
                  type="button"
                  onClick={() => onToggleExpand(item.id)}
                  aria-expanded={open}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-input font-cinzel text-sm font-bold uppercase text-accent/70">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : item.name.substring(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <span className="truncate">{item.name}</span>
                      <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{stats}</span>
                  </span>
                </button>
                <Button
                  variant={item.equipped ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={!!item.equipped}
                  onClick={() => onToggleEquip(item.id)}
                  className="h-9"
                >
                  {item.equipped ? 'Equipaggiato' : 'Equipaggia'}
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Modifica ${item.name}`} title="Modifica" onClick={() => onEdit(item)}>
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Elimina ${item.name}`} title="Elimina" onClick={() => onDelete(item.id)} className="hover:text-destructive">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
              {open && (
                <div className="animate-fadeIn space-y-2 border-t border-foreground/10 px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={playChipClass}>{itemKindLabel(item)}</span>
                    {armorValue && <span className={playChipClass}>CA {armorValue}</span>}
                    {!!item.bonusAC && <span className={playChipClass}>CA magica +{item.bonusAC}</span>}
                    {item.damage && <span className={playChipClass}>Danni {item.damage} {damageTypeLabel(item.damageType)}</span>}
                    {(item.properties || []).map(p => <span key={p} className={playChipClass}>{weaponPropertyLabel(p)}</span>)}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                    {item.description || <span className="text-muted-foreground">Nessuna descrizione.</span>}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
