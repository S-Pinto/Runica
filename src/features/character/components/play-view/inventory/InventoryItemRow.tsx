import { FC } from 'react';
import { ChargeResetType, EquipmentItem } from '../../../characterTypes';
import { BackpackIcon, CheckIcon, MinusIcon, PlusIcon, RefreshIcon, ShieldIcon, SparklesIcon, SwordIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { damageTypeLabel } from '../../../../../lib/labels';
import { getItemCharges, getItemPowers, isBodyArmor, isShield, isWeapon, MAGIC_POWER_TYPES } from '../../../rules/equipment';
import { formatWeight, itemTotalWeight, type WeightUnit } from '../../../rules/encumbrance';
import { itemArmorValue, itemKindLabel, RARITY_LABELS } from '../../../utils/itemLabels';

const getItemIcon = (item: EquipmentItem): FC<{ className?: string }> => {
  if (isWeapon(item)) return SwordIcon;
  if (isBodyArmor(item) || isShield(item)) return ShieldIcon;
  if ((item.itemType && MAGIC_POWER_TYPES.includes(item.itemType)) || item.rarity) return SparklesIcon;
  return BackpackIcon;
};

const RESET_LABELS: Record<ChargeResetType, string> = {
  longRest: 'riposo lungo',
  shortRest: 'riposo breve',
  dawn: 'all’alba',
  none: 'non si ricaricano',
};

/** Quando si ricaricano: cariche attuali o usi del formato vecchio. */
const resetLabel = (item: EquipmentItem) => {
  if (item.charges) return RESET_LABELS[item.charges.resetType];
  if (item.recovery === 'short' || item.recovery === 'shortRest') return RESET_LABELS.shortRest;
  if (item.recovery === 'long' || item.recovery === 'longRest') return RESET_LABELS.longRest;
  return '';
};

const CONSUMABLE_TYPES =['potion', 'scroll', 'gear'];
const WORN_TYPES = ['armor', 'shield', 'weapon', 'ring', 'amulet', 'helmet', 'wondrous'];
/** Oltre questo numero le cariche si mostrano come numero, non come sigilli. */
const MAX_SEALS = 8;

/** Consumabili, munizioni e oggetti generici: si cambia la quantità invece di equipaggiarli. */
const isConsumable = (item: EquipmentItem) =>
  CONSUMABLE_TYPES.includes(item.itemType || '') ||
  (!item.itemType && !item.armorType && !isWeapon(item) && !isBodyArmor(item) && !isShield(item));

/** Si indossa o si impugna: interruttore "equipaggiato". Un oggetto già equipaggiato lo mostra sempre, per poterlo togliere. */
const isEquippable = (item: EquipmentItem) =>
  !!item.equipped || !!item.requiresAttunement || !isConsumable(item) || WORN_TYPES.includes(item.itemType || '');

/** Valore chiave dell'oggetto, da leggere al volo: danni con i tipi extra, oppure CA. */
const keyStat = (item: EquipmentItem): string | null => {
  if (isWeapon(item) && item.damage?.trim()) {
    const extras = (item.additionalDamage || []).filter(d => d.formula?.trim()).map(d => `+${d.formula.trim()} ${damageTypeLabel(d.type)}`.trim());
    return [`${item.damage.trim()} ${damageTypeLabel(item.damageType)}`.trim(), ...extras].join(' · ');
  }
  const armor = itemArmorValue(item);
  if (armor) return `CA ${armor}${item.bonusAC ? ` ${item.bonusAC > 0 ? '+' : ''}${item.bonusAC}` : ''}`;
  if (item.bonusAC) return `CA ${item.bonusAC > 0 ? '+' : ''}${item.bonusAC}`;
  return null;
};

/** Interruttore quadrato da 44px: pieno in accento quando è attivo. */
const toggleClass = (on: boolean) =>
  `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] ${
    on ? 'bg-accent/20 text-accent' : 'bg-foreground/[0.06] text-muted-foreground/70 hover:bg-foreground/10 hover:text-foreground'
  }`;

export interface InventoryItemRowProps {
  item: EquipmentItem;
  /** Unità di peso se la regola del carico è attiva. */
  weightUnit?: WeightUnit;
  onOpenDetails: (itemId: string) => void;
  onToggleEquip: (itemId: string) => void;
  onToggleAttune: (itemId: string) => void;
  /** Cambia le cariche di `delta` (o le ricarica tutte con 'reset'). */
  onAdjustCharges: (itemId: string, delta: number | 'reset') => void;
  onAdjustQuantity: (itemId: string, delta: number) => void;
}

/**
 * Riga compatta di un oggetto: miniatura e testo aprono la Scheda Oggetto; a destra gli interruttori
 * (equipaggiato, sintonia) o la quantità; sotto, solo se ci sono, le cariche come sigilli.
 */
export const InventoryItemRow = ({ item, weightUnit, onOpenDetails, onToggleEquip, onToggleAttune, onAdjustCharges, onAdjustQuantity }: InventoryItemRowProps) => {
  const Icon = getItemIcon(item);
  const charges = getItemCharges(item);
  const stat = keyStat(item);
  const powers = getItemPowers(item).length;
  const weight = weightUnit ? itemTotalWeight(item) : 0;
  const equippable = isEquippable(item);
  const stepper = !equippable || (isConsumable(item) && item.quantity !== 1);
  const depleted = item.quantity <= 0;
  const attunementOff = !!item.requiresAttunement && !item.isAttuned;
  const meta = [
    [itemKindLabel(item), item.subtype?.trim()].filter(Boolean).join(' · '),
    !stepper && item.quantity !== 1 ? `×${item.quantity}` : '',
    powers ? (powers === 1 ? '1 potere' : `${powers} poteri`) : '',
    weightUnit && weight > 0 ? formatWeight(weight, weightUnit) : '',
  ].filter(Boolean);

  return (
    <li className={`flex flex-col rounded-2xl bg-background/50 transition-colors duration-150 hover:bg-background/70 ${depleted ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-3 p-2.5 pr-2">
        <button
          type="button"
          onClick={() => onOpenDetails(item.id)}
          aria-haspopup="dialog"
          aria-label={`Apri la scheda di ${item.name}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-input text-muted-foreground">
            {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Icon className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 break-words text-base font-semibold leading-snug text-foreground" title={item.name}>{item.name}</span>
            {stat && <span className="mt-0.5 block break-words font-mono text-sm tabular-nums leading-snug text-foreground">{stat}</span>}
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {item.rarity && <span className="font-medium text-accent">{RARITY_LABELS[item.rarity]}{(depleted || meta.length > 0) && ' · '}</span>}
              {depleted ? <span className="font-medium text-destructive">Esaurito</span> : meta.join(' · ')}
              {attunementOff && item.equipped && <span className="text-warning"> · senza sintonia</span>}
            </span>
          </span>
        </button>

        {stepper ? (
          <div className="flex shrink-0 items-center rounded-xl bg-foreground/[0.06]">
            <Button variant="ghost" size="icon" onClick={() => onAdjustQuantity(item.id, -1)} disabled={item.quantity <= 0} aria-label={`Togli uno: ${item.name}`} title="Togli uno">
              <MinusIcon className="h-4 w-4" />
            </Button>
            <span className="min-w-[2ch] text-center font-mono text-base font-bold tabular-nums text-foreground" aria-live="polite">{item.quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => onAdjustQuantity(item.id, 1)} aria-label={`Aggiungi uno: ${item.name}`} title="Aggiungi uno">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            {item.requiresAttunement && (
              <button
                type="button"
                onClick={() => onToggleAttune(item.id)}
                aria-pressed={!!item.isAttuned}
                aria-label={`${item.isAttuned ? 'Rompi la sintonia con' : 'Sintonizzati con'} ${item.name}`}
                title={item.isAttuned ? 'In sintonia' : 'Non in sintonia'}
                className={toggleClass(!!item.isAttuned)}
              >
                <SparklesIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleEquip(item.id)}
              aria-pressed={!!item.equipped}
              aria-label={`${item.equipped ? 'Togli' : 'Equipaggia'} ${item.name}`}
              title={item.equipped ? 'Equipaggiato' : 'Non equipaggiato'}
              className={toggleClass(!!item.equipped)}
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {charges && (
        <div className="mt-auto flex items-center gap-2 px-2.5 pb-2 pl-[4.375rem]">
          {charges.max <= MAX_SEALS ? (
            <div className="-ml-2.5 flex flex-wrap" role="group" aria-label={`Cariche di ${item.name}`}>
              {Array.from({ length: charges.max }).map((_, i) => {
                const available = i < charges.current;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onAdjustCharges(item.id, (available ? i : i + 1) - charges.current)}
                    aria-pressed={!available}
                    aria-label={`${item.name}, carica ${i + 1}: ${available ? 'disponibile' : 'spesa'}`}
                    className="group flex h-10 w-10 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span aria-hidden className="seal" data-on={available} />
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <span className="font-mono text-sm tabular-nums text-muted-foreground"><span className="font-bold text-foreground">{charges.current}</span>/{charges.max}</span>
              <Button variant="secondary" size="sm" className="h-10" onClick={() => onAdjustCharges(item.id, -1)} disabled={charges.current <= 0}>Usa</Button>
            </>
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {charges.max <= MAX_SEALS && <span className="font-mono tabular-nums">{charges.current}/{charges.max} </span>}
            {charges.field === 'charges' ? 'cariche' : 'usi'}
            {resetLabel(item) && ` · ${resetLabel(item)}`}
          </span>
          {charges.current < charges.max && (
            <Button variant="ghost" size="icon" onClick={() => onAdjustCharges(item.id, 'reset')} aria-label={`Ricarica ${item.name}`} title="Ricarica tutte le cariche">
              <RefreshIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </li>
  );
};
