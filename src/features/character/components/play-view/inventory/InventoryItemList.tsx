import { FC, ReactNode } from 'react';
import { EquipmentItem, ChargeResetType } from '../../../characterTypes';
import { ChevronDownIcon, SwordIcon, ShieldIcon, SparklesIcon, BackpackIcon, RefreshIcon, CheckIcon, MinusIcon, PlusIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { damageTypeLabel } from '../../../../../lib/labels';
import { getItemCharges, isBodyArmor, isShield, isWeapon, MAGIC_POWER_TYPES } from '../../../rules/equipment';
import { formatWeight, itemTotalWeight, type WeightUnit } from '../../../rules/encumbrance';
import { itemArmorValue, itemKindLabel, weaponPropertyLabel } from '../../../utils/itemLabels';
import { PlaySection, playChipClass, playEmptyClass } from '../PlaySection';

const getItemIcon = (item: EquipmentItem): FC<{ className?: string }> => {
  if (isWeapon(item)) return SwordIcon;
  if (isBodyArmor(item) || isShield(item)) return ShieldIcon;
  if (item.itemType && MAGIC_POWER_TYPES.includes(item.itemType)) return SparklesIcon;
  return BackpackIcon;
};

const RESET_LABELS: Record<ChargeResetType, string> = {
  longRest: 'riposo lungo',
  shortRest: 'riposo breve',
  dawn: 'all’alba',
  none: '',
};

const CONSUMABLE_TYPES = ['potion', 'scroll', 'gear'];

/** La quantità si cambia al volo per consumabili, munizioni e oggetti generici, e per qualunque oggetto in più copie. */
const hasQuantityStepper = (item: EquipmentItem) =>
  item.quantity !== 1 ||
  CONSUMABLE_TYPES.includes(item.itemType || '') ||
  (!item.itemType && !item.armorType && !isWeapon(item) && !isBodyArmor(item) && !isShield(item));

interface InventoryItemListProps {
  title: string;
  icon?: ReactNode;
  items: EquipmentItem[];
  expandedItem: string | null;
  /** Unità di peso se la regola del carico è attiva. */
  weightUnit?: WeightUnit;
  onToggleExpand: (itemId: string) => void;
  onToggleEquip: (itemId: string) => void;
  onToggleAttune: (itemId: string) => void;
  onUseCharge: (itemId: string) => void;
  onResetCharge: (itemId: string) => void;
  onAdjustQuantity: (itemId: string, delta: number) => void;
  onSelectImage: (image: { url: string; alt: string }) => void;
}

export const InventoryItemList = ({
  title, icon, items, expandedItem, weightUnit, onToggleExpand, onToggleEquip, onToggleAttune, onUseCharge, onResetCharge, onAdjustQuantity, onSelectImage,
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
          const charges = getItemCharges(item);
          const resetLabel = item.charges ? RESET_LABELS[item.charges.resetType] ?? '' : '';
          const armorValue = itemArmorValue(item);
          const weight = weightUnit ? itemTotalWeight(item) : 0;
          const depleted = item.quantity <= 0;
          return (
            <li key={item.id} className={`overflow-hidden rounded-2xl bg-background/50 transition-colors duration-150 hover:bg-background/70 ${depleted ? 'opacity-70' : ''}`}>
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
                    {!hasQuantityStepper(item) && <span className={`${playChipClass} font-mono`}>×{item.quantity}</span>}
                    {depleted && <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive">Esaurito</span>}
                    {item.damage && <span className={playChipClass}>Danni <span className="font-mono text-foreground">{item.damage}</span></span>}
                    {armorValue && <span className={playChipClass}>CA <span className="font-mono text-foreground">{armorValue}</span></span>}
                    {!!item.bonusAC && <span className={playChipClass}>CA <span className="font-mono text-foreground">+{item.bonusAC}</span></span>}
                    {weightUnit && weight > 0 && <span className={playChipClass}><span className="font-mono text-foreground">{formatWeight(weight, weightUnit)}</span></span>}
                    {item.requiresAttunement && item.isAttuned && <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">In sintonia</span>}
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

              {hasQuantityStepper(item) && (
                <div className="flex items-center justify-between gap-3 border-t border-foreground/10 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Quantità</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onAdjustQuantity(item.id, -1)} disabled={item.quantity <= 0} aria-label={`Togli uno: ${item.name}`} title="Togli uno">
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[2.5rem] text-center font-mono text-base font-bold tabular-nums text-foreground" aria-live="polite">{item.quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => onAdjustQuantity(item.id, 1)} aria-label={`Aggiungi uno: ${item.name}`} title="Aggiungi uno">
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {charges && (
                <div className="flex items-center justify-between gap-3 border-t border-foreground/10 px-3 py-2">
                  <p className="min-w-0 text-xs text-muted-foreground">
                    <span className="font-mono text-base font-bold tabular-nums text-foreground">{charges.current}</span>
                    <span className="font-mono">/{charges.max}</span> {charges.field === 'charges' ? 'cariche' : 'usi'}
                    {resetLabel && <span> · {resetLabel}</span>}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="secondary" onClick={() => onUseCharge(item.id)} disabled={charges.current <= 0}>
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
                  <p className="text-xs text-muted-foreground">
                    {[
                      itemKindLabel(item),
                      item.damageType && `Danni ${damageTypeLabel(item.damageType)}`,
                      ...(item.properties || []).map(weaponPropertyLabel),
                      item.requiresAttunement && !item.isAttuned && 'Richiede sintonia',
                    ].filter(Boolean).join(' · ')}
                  </p>
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
