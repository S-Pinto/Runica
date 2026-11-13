import { useMemo } from 'react';
import { useCharacter } from '../../../CharacterProvider';
import { Modal } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import { BackpackIcon, CheckIcon, ShieldIcon, SparklesIcon, SwordIcon } from '../../../../../components/ui/icons';
import { formatActionDamageLines, formatActionHit, resolveItemPower, resolveWeaponAction } from '../../../rules/attacks';
import { getItemCharges, getItemPowers, isBodyArmor, isItemActive, isShield, isWeapon } from '../../../rules/equipment';
import { itemArmorValue, itemKindLabel, RARITY_LABELS, weaponPropertyLabel } from '../../../utils/itemLabels';
import { playChipClass, playInsetClass, playLabelClass } from '../PlaySection';
import { DetailBlock, ItemEffectsDetail, ItemPowersDetail } from './ItemDetailSections';
import { useItemActions } from './useItemActions';

const statusChip = 'rounded-md px-2 py-1 text-xs font-semibold';

/**
 * Scheda Oggetto: immagine, rarità, stato di sintonia, valori da arma o armatura, proprietà passive,
 * poteri con i loro usi, proprietà nominate e descrizione. Si apre da Inventario e Combattimento.
 */
export const ItemDetailSheet = ({ itemId, onClose }: { itemId: string | null; onClose: () => void }) => {
  const { character } = useCharacter();
  const { toggleEquip, toggleAttune, spendUse } = useItemActions();
  const item = character?.equipment?.find(i => i.id === itemId);

  const weaponAction = useMemo(() => (character && item && isWeapon(item) ? resolveWeaponAction(character, item) : null), [character, item]);
  const powerActions = useMemo(
    () => (character && item ? getItemPowers(item).map(p => resolveItemPower(character, item, p)) : []),
    [character, item],
  );

  if (!character || !item) return null;

  const Icon = isWeapon(item) ? SwordIcon : isBodyArmor(item) || isShield(item) ? ShieldIcon : item.rarity ? SparklesIcon : BackpackIcon;
  const active = isItemActive(item);
  const needsAttunement = !!item.requiresAttunement && !item.isAttuned;
  const armorValue = itemArmorValue(item);
  const charges = getItemCharges(item);
  const kind = [itemKindLabel(item), item.subtype?.trim()].filter(Boolean).join(' · ');
  const traits = (item.traits || []).filter(t => t.name?.trim() || t.description?.trim());

  return (
    <Modal
      open
      onClose={onClose}
      title={item.name}
      icon={<Icon />}
      size="lg"
      footer={
        <>
          {item.requiresAttunement && (
            <Button variant="secondary" onClick={() => toggleAttune(item.id)} aria-pressed={!!item.isAttuned} className={item.isAttuned ? 'border-accent/60 bg-accent/15 text-accent' : ''}>
              <SparklesIcon className="h-4 w-4" /> {item.isAttuned ? 'In sintonia' : 'Sintonizza'}
            </Button>
          )}
          <Button variant={item.equipped ? 'secondary' : 'primary'} onClick={() => toggleEquip(item.id)} aria-pressed={!!item.equipped}>
            {item.equipped && <CheckIcon className="h-4 w-4" />} {item.equipped ? 'Equipaggiato' : 'Equipaggia'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {item.imageUrl && (
          <div className="overflow-hidden rounded-2xl bg-background/60">
            <img src={item.imageUrl} alt="" className="mx-auto max-h-60 w-full object-contain" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`${playChipClass} text-foreground`}>{kind}</span>
          {item.rarity && <span className={`${statusChip} bg-accent/15 text-accent`}>{RARITY_LABELS[item.rarity]}</span>}
          {item.requiresAttunement && (
            <span className={`${statusChip} ${item.isAttuned ? 'bg-accent/15 text-accent' : 'bg-foreground/10 text-muted-foreground'}`}>
              {item.isAttuned ? 'In sintonia' : 'Richiede sintonia'}
            </span>
          )}
          {item.equipped && needsAttunement && <span className={`${statusChip} bg-warning/15 text-warning`}>Proprietà inattive senza sintonia</span>}
          {item.quantity !== 1 && <span className={`${playChipClass} font-mono`}>×{item.quantity}</span>}
        </div>

        {(weaponAction || armorValue || charges) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {weaponAction && (
              <>
                <div className={`${playInsetClass} p-3`}>
                  <p className={playLabelClass}>Colpire</p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{formatActionHit(weaponAction)}</p>
                </div>
                <div className={`${playInsetClass} col-span-2 p-3`}>
                  <p className={playLabelClass}>Danni</p>
                  {formatActionDamageLines(weaponAction).map((l, i) => (
                    <p key={i} className={`mt-1 font-mono tabular-nums text-foreground ${i === 0 ? 'text-lg font-bold' : 'text-sm'}`}>{i > 0 ? `+ ${l}` : l}</p>
                  ))}
                </div>
              </>
            )}
            {armorValue && (
              <div className={`${playInsetClass} p-3`}>
                <p className={playLabelClass}>{isShield(item) ? 'Bonus CA' : 'CA base'}</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{armorValue}</p>
              </div>
            )}
            {charges && (
              <div className={`${playInsetClass} p-3`}>
                <p className={playLabelClass}>{charges.field === 'charges' ? 'Cariche' : 'Usi'}</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{charges.current}<span className="text-base text-muted-foreground">/{charges.max}</span></p>
              </div>
            )}
          </div>
        )}
        {weaponAction && weaponAction.properties.length > 0 && (
          <p className="text-xs text-muted-foreground">{weaponAction.properties.map(weaponPropertyLabel).join(' · ')}</p>
        )}

        <ItemEffectsDetail item={item} inactive={!active} />
        <ItemPowersDetail actions={powerActions} item={item} onSpend={item.equipped ? a => spendUse(a, -1) : undefined} />

        {traits.length > 0 && (
          <DetailBlock title="Proprietà e storia">
            <dl className="space-y-3">
              {traits.map(t => (
                <div key={t.id}>
                  <dt className="font-cinzel text-sm font-bold text-accent">{t.name}</dt>
                  {t.description && <dd className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-text">{t.description}</dd>}
                </div>
              ))}
            </dl>
          </DetailBlock>
        )}

        <DetailBlock title="Descrizione">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {item.description?.trim() || <span className="text-muted-foreground">Nessuna descrizione.</span>}
          </p>
        </DetailBlock>
      </div>
    </Modal>
  );
};
