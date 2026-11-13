import { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Currency } from '../../characterTypes';
import { adjustItemCharges, adjustQuantity, countAttuned, splitEquipment } from '../../rules/equipment';
import { getEncumbrance } from '../../rules/encumbrance';
import { ImageModal } from '../../../../components/ui/ImageModal';
import { ShieldIcon, BackpackIcon } from '../../../../components/ui/icons';
import { InventoryItemList } from './inventory/InventoryItemList';
import { InventoryCurrencyBanner } from './inventory/InventoryCurrencyBanner';
import { EncumbranceMeter } from './inventory/EncumbranceMeter';
import { ItemDetailSheet } from './inventory/ItemDetailSheet';
import { useItemActions } from './inventory/useItemActions';

const InventoryTabViewContent = () => {
  const { character: maybeCharacter, updateCharacter } = useCharacter();
  const character = maybeCharacter!;
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const { toggleEquip, toggleAttune } = useItemActions();
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const equipment = character.equipment || [];

  const handleCurrencyChange = (type: keyof Currency, val: number) => {
    updateCharacter({
      currency: {
        ...character.currency,
        [type]: Math.max(0, val),
      },
    });
  };

  const attunedCount = useMemo(() => countAttuned(character.equipment), [character.equipment]);
  const encumbrance = useMemo(() => getEncumbrance(character), [character]);

  const { equippableItems, backpackItems } = useMemo(() => splitEquipment(character.equipment), [character.equipment]);

  const listProps = {
    weightUnit: encumbrance.enabled ? encumbrance.unit : undefined,
    onOpenDetails: setDetailItemId,
    onToggleEquip: toggleEquip,
    onToggleAttune: toggleAttune,
    onUseCharge: (itemId: string) => updateCharacter({ equipment: adjustItemCharges(equipment, itemId, -1) }),
    onResetCharge: (itemId: string) => updateCharacter({ equipment: adjustItemCharges(equipment, itemId, 'reset') }),
    onAdjustQuantity: (itemId: string, delta: number) => updateCharacter({ equipment: adjustQuantity(equipment, itemId, delta) }),
    onSelectImage: setSelectedImage,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ImageModal
        imageUrl={selectedImage?.url || ''}
        altText={selectedImage?.alt || ''}
        onClose={() => setSelectedImage(null)}
      />

      <ItemDetailSheet itemId={detailItemId} onClose={() => setDetailItemId(null)} />

      <InventoryCurrencyBanner currency={character.currency} attunedCount={attunedCount} onChange={handleCurrencyChange} />

      {encumbrance.enabled && <EncumbranceMeter state={encumbrance} />}

      <InventoryItemList title="Equipaggiamento" icon={<ShieldIcon className="text-muted-foreground" />} items={equippableItems} {...listProps} />
      <InventoryItemList title="Zaino" icon={<BackpackIcon className="text-muted-foreground" />} items={backpackItems} {...listProps} />
    </div>
  );
};

/** Renders InventoryTabViewContent only once the character is loaded, so its hooks never run conditionally. */
const InventoryTabView = () => {
    const { character } = useCharacter();
    return character ? <InventoryTabViewContent /> : null;
};

export default InventoryTabView;
