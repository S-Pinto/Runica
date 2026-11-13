import { FC, ReactNode } from 'react';
import { EquipmentItem, ChargeResetType } from '../../../characterTypes';
import { ChevronDownIcon, SwordIcon, ShieldIcon, SparklesIcon, BackpackIcon, RefreshIcon, CheckIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { PlaySection, playChipClass, playEmptyClass } from '../PlaySection';

const MAGIC_TYPES = ['ring', 'amulet', 'wondrous', 'potion', 'scroll'];

const getItemIcon = (item: EquipmentItem): FC<{ className?: string }> => {
  if (item.itemType === 'weapon' || item.damage) return SwordIcon;
  if (item.itemType === 'armor' || item.itemType === 'shield' || item.armorType) return ShieldIcon;
  if (item.itemType && MAGIC_TYPES.includes(item.itemType)) return SparklesIcon;
  return BackpackIcon;
};

const RESET_LABELS: Record<ChargeResetType, string> = {
  longRest: 'riposo lungo',
  shortRest: 'riposo breve',
  dawn: 'all’alba',
  none: '',
};

interface InventoryItemListProps {
  title: string;
  icon?: ReactNode;
  items: EquipmentItem[];
  expandedItem: string | null;
  onToggleExpand: (itemId: string) => void;
  onToggleEquip: (itemId: string) => void;
  onToggleAttune: (itemId: string) => void;
  onUseCharge: (itemId: string) => void;
  onResetCharge: (itemId: string) => void;
  onSelectImage: (image: { url: string; alt: string }) => void;
}

export const InventoryItemList = ({
  title, icon, items, expandedItem, onToggleExpand, onToggleEquip, onToggleAttune, onUseCharge, onResetCharge, onSelectImage,
}: InventoryItemListProps) => (
  <PlaySection
    title={title}
    icon={icon}
    aside={<span className="font-mono text-sm tabular-nums text-muted-foreground">{items.length}</span>}
  >
    {items.length === 0 ? (
      <p className={playEmptyClass}>Nessun oggetto in questa sezione.</p>
    ) : (
      <ul className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
        {items.map(item => {
          const Icon = getItemIcon(item);
          const isExpanded = expandedItem === item.id;
          const resetLabel = item.charges ? RESET_LABELS[item.charges.resetType] ?? '' : '';
          return (
            <li key={item.id} className="overflow-hidden rounded-2xl bg-background/50 transition-colors duration-150 hover:bg-background/70">
              <div className="flex items-start gap-3 p-3">
                {item.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => onSelectImage({ url: item.imageUrl!, alt: item.name })}
                    aria-label={`Ingrandisci l'immagine di ${item.name}`}
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-input text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onToggleExpand(item.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center gap-1.5 rounded-lg py-0.5 text-left text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate" title={item.name}>{item.name}</span>
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`${playChipClass} font-mono`}>×{item.quantity}</span>
                    {item.damage && <span className={playChipClass}>Danni <span className="font-mono text-foreground">{item.damage}</span></span>}
                    {item.armorClass && <span className={playChipClass}>CA <span className="font-mono text-foreground">{item.armorClass}</span></span>}
                    {item.bonusAC && <span className={playChipClass}>CA <span className="font-mono text-foreground">+{item.bonusAC}</span></span>}
                    {item.isAttuned && <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">In sintonia</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 px-3 pb-3">
                <Button
                  variant="secondary"
                  onClick={() => onToggleEquip(item.id)}
                  aria-pressed={!!item.equipped}
                  className={`flex-1 ${item.equipped ? 'border-accent/60 bg-accent/15 text-accent' : ''}`}
                >
                  {item.equipped && <CheckIcon className="h-4 w-4" />}
                  {item.equipped ? 'Equipaggiato' : 'Equipaggia'}
                </Button>
                {item.requiresAttunement && (
                  <Button
                    variant="secondary"
                    onClick={() => onToggleAttune(item.id)}
                    aria-pressed={!!item.isAttuned}
                    title="Sintonia magica (massimo 3 oggetti)"
                    className={`flex-1 ${item.isAttuned ? 'border-accent/60 bg-accent/15 text-accent' : ''}`}
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {item.isAttuned ? 'In sintonia' : 'Sintonizza'}
                  </Button>
                )}
              </div>

              {item.charges && item.charges.max > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-foreground/10 px-3 py-2">
                  <p className="min-w-0 text-xs text-muted-foreground">
                    <span className="font-mono text-base font-bold tabular-nums text-foreground">{item.charges.current}</span>
                    <span className="font-mono">/{item.charges.max}</span> cariche
                    {resetLabel && <span> · {resetLabel}</span>}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="secondary" onClick={() => onUseCharge(item.id)} disabled={item.charges.current <= 0}>
                      Usa
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onResetCharge(item.id)} aria-label={`Ricarica ${item.name}`} title="Ricarica tutte le cariche">
                      <RefreshIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {isExpanded && (
                <div className="space-y-2 border-t border-foreground/10 px-3 py-3 animate-fadeIn">
                  {(item.armorType || item.damageType) && (
                    <p className="text-xs text-muted-foreground">
                      {[item.armorType && `Armatura: ${item.armorType}`, item.damageType && `Tipo di danno: ${item.damageType}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
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
  </PlaySection>
);
