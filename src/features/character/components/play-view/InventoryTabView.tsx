import { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Currency } from '../../characterTypes';
import {
  adjustItemCharges, adjustQuantity, countAttuned, getEquipWarning, MAX_ATTUNED_ITEMS,
  splitEquipment, toggleAttunement, toggleEquippedItem,
} from '../../rules/equipment';
import { getEncumbrance } from '../../rules/encumbrance';
import { ImageModal } from '../../../../components/ui/ImageModal';
import { toast } from '../../../../components/ui/Dialogs';
import { ShieldIcon, BackpackIcon } from '../../../../components/ui/icons';
import { InventoryItemList } from './inventory/InventoryItemList';
import { InventoryCurrencyBanner } from './inventory/InventoryCurrencyBanner';
import { EncumbranceMeter } from './inventory/EncumbranceMeter';

const InventoryTabViewContent = () => {
  const { character: maybeCharacter, updateCharacter } = useCharacter();
  const character = maybeCharacter!;
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const equipment = character.equipment || [];

  const handleToggleEquip = (itemId: string) => {
    const newEquipment = toggleEquippedItem(equipment, itemId);
    if (!newEquipment) return;
    updateCharacter({ equipment: newEquipment });
    const warning = getEquipWarning(newEquipment, itemId);
    if (warning) toast.info(warning);
  };

  const handleCurrencyChange = (type: keyof Currency, val: number) => {
    updateCharacter({
      currency: {
        ...character.currency,
        [type]: Math.max(0, val),
      },
    });
  };

  const handleToggleAttune = (itemId: string) => {
    const result = toggleAttunement(equipment, itemId);
    if (result.ok) {
      updateCharacter({ equipment: result.equipment });
    } else if (result.reason === 'limit') {
      toast.info(`Puoi essere in sintonia con al massimo ${MAX_ATTUNED_ITEMS} oggetti magici.`);
    }
  };

  const attunedCount = useMemo(() => countAttuned(character.equipment), [character.equipment]);
  const encumbrance = useMemo(() => getEncumbrance(character), [character]);

  const { equippableItems, backpackItems } = useMemo(() => splitEquipment(character.equipment), [character.equipment]);

  const listProps = {
    expandedItem,
    weightUnit: encumbrance.enabled ? encumbrance.unit : undefined,
    onToggleExpand: (itemId: string) => setExpandedItem(prev => (prev === itemId ? null : itemId)),
    onToggleEquip: handleToggleEquip,
    onToggleAttune: handleToggleAttune,
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
