import { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Currency } from '../../characterTypes';
import { toggleEquippedItem, splitEquipment } from '../../rules/equipment';
import { ImageModal } from '../../../../components/ui/ImageModal';
import { toast } from '../../../../components/ui/Dialogs';
import { ShieldIcon, BackpackIcon } from '../../../../components/ui/icons';
import { InventoryItemList } from './inventory/InventoryItemList';
import { InventoryCurrencyBanner } from './inventory/InventoryCurrencyBanner';

const InventoryTabViewContent = () => {
  const { character: maybeCharacter, updateCharacter } = useCharacter();
  const character = maybeCharacter!;
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);


  const handleToggleEquip = (itemId: string) => {
    const newEquipment = toggleEquippedItem(character.equipment, itemId);
    if (newEquipment) updateCharacter({ equipment: newEquipment });
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
    const item = character.equipment.find(i => i.id === itemId);
    if (!item) return;

    const currentAttuned = (character.equipment || []).filter(i => i.isAttuned).length;
    if (!item.isAttuned && currentAttuned >= 3) {
      toast.info('Puoi essere in sintonia con al massimo 3 oggetti magici.');
      return;
    }

    const newEquipment = character.equipment.map(i => i.id === itemId ? { ...i, isAttuned: !i.isAttuned } : i);
    updateCharacter({ equipment: newEquipment });
  };

  const handleUseCharge = (itemId: string) => {
    const newEquipment = character.equipment.map(item => {
      if (item.id === itemId && item.charges && item.charges.current > 0) {
        return {
          ...item,
          charges: {
            ...item.charges,
            current: item.charges.current - 1,
          },
        };
      }
      return item;
    });
    updateCharacter({ equipment: newEquipment });
  };

  const handleResetCharge = (itemId: string) => {
    const newEquipment = character.equipment.map(item => {
      if (item.id === itemId && item.charges) {
        return {
          ...item,
          charges: {
            ...item.charges,
            current: item.charges.max,
          },
        };
      }
      return item;
    });
    updateCharacter({ equipment: newEquipment });
  };

  const attunedCount = useMemo(() => {
    return (character.equipment || []).filter(item => item.isAttuned).length;
  }, [character.equipment]);

  const handleToggleExpand = (itemId: string) => {
    setExpandedItem(prev => (prev === itemId ? null : itemId));
  };

  const { equippableItems, backpackItems } = useMemo(() => splitEquipment(character.equipment), [character.equipment]);

  const listProps = {
    expandedItem,
    onToggleExpand: handleToggleExpand,
    onToggleEquip: handleToggleEquip,
    onToggleAttune: handleToggleAttune,
    onUseCharge: handleUseCharge,
    onResetCharge: handleResetCharge,
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
