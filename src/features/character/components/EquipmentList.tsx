import { useState, useMemo } from 'react';
import { useCharacter } from '../CharacterProvider';
import { EquipmentItem, Currency } from '../characterTypes';
import { PlusCircleIcon } from '../../../components/ui/icons';
import { confirmDialog } from '../../../components/ui/Dialogs';
import { EquipmentForm } from './equipment/EquipmentForm';
import { ItemDisplayList } from './equipment/ItemDisplayList';
import { CurrencyBanner } from './equipment/CurrencyBanner';

const DEFAULT_ITEM: Omit<EquipmentItem, 'id'> = {
  name: '',
  quantity: 1,
  description: '',
  equipped: false,
};

const EquipmentListContent = () => {
  const { character: maybeCharacter, updateCharacter } = useCharacter();
  const character = maybeCharacter!;
  const [editingItem, setEditingItem] = useState<EquipmentItem | 'new' | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);


  const handleSave = (itemData: Omit<EquipmentItem, 'id'> | EquipmentItem) => {
    let updatedEquipment: EquipmentItem[];
    // If it's a new item (no ID property in 'itemData' if it was passed as Omit, or we check if it matches an existing one)
    // But wait, if we are editing an existing item 'itemData' has ID.
    // If we are adding new, 'itemData' might not have ID, OR it might have a temp ID we added during image upload.

    // Logic: check if we are editing an existing valid item in the list
    const isExisting = 'id' in itemData && character.equipment.some(e => e.id === itemData.id);

    if (isExisting) {
      updatedEquipment = character.equipment.map(item => item.id === (itemData as EquipmentItem).id ? (itemData as EquipmentItem) : item);
    } else {
      // It's new. Use the ID provided (if temp ID from image upload) or generate one.
      const newItem: EquipmentItem = {
        ...itemData,
        id: ('id' in itemData && itemData.id.startsWith('temp_')) ? `item_${Date.now()}` : ('id' in itemData ? itemData.id : `item_${Date.now()}`)
      };
      updatedEquipment = [...(character.equipment || []), newItem];
    }
    updateCharacter({ equipment: updatedEquipment });
    setEditingItem(null);
  };

  const handleDelete = async (itemId: string) => {
    if (await confirmDialog({ title: 'Eliminare questo oggetto?', confirmLabel: 'Elimina', destructive: true })) {
      const updatedEquipment = (character.equipment || []).filter(item => item.id !== itemId);
      updateCharacter({ equipment: updatedEquipment });
    }
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItem(prev => (prev === itemId ? null : itemId));
  };

  const handleToggleEquip = (itemId: string) => {
    const clickedItem = character.equipment.find(item => item.id === itemId);
    if (!clickedItem) return;

    const isEquipping = !clickedItem.equipped;
    const isClickedBodyArmor = clickedItem.itemType === 'armor' || ['light', 'medium', 'heavy'].includes(clickedItem.armorType || '');
    const isClickedShield = clickedItem.itemType === 'shield' || clickedItem.armorType === 'shield';

    const newEquipment = character.equipment.map(item => {
      if (item.id === itemId) {
        return { ...item, equipped: isEquipping };
      }
      if (isEquipping) {
        const isItemBodyArmor = item.itemType === 'armor' || ['light', 'medium', 'heavy'].includes(item.armorType || '');
        const isItemShield = item.itemType === 'shield' || item.armorType === 'shield';

        if (isClickedBodyArmor && isItemBodyArmor) return { ...item, equipped: false };
        if (isClickedShield && isItemShield) return { ...item, equipped: false };
      }
      return item;
    });
    updateCharacter({ equipment: newEquipment });
  };

  const { equippableItems, backpackItems } = useMemo(() => {
    const equippable: EquipmentItem[] = [];
    const backpack: EquipmentItem[] = [];
    (character.equipment || []).forEach(item => {
      if (item.equipped || item.itemType === 'weapon' || item.itemType === 'armor' || item.itemType === 'shield' || item.armorType || item.damage) {
        equippable.push(item);
      } else {
        backpack.push(item);
      }
    });
    return {
      equippableItems: equippable.sort((a, b) => a.name.localeCompare(b.name)),
      backpackItems: backpack.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [character.equipment]);

  const handleCurrencyChange = (type: keyof Currency, val: number) => {
    updateCharacter({
      currency: {
        ...character.currency,
        [type]: Math.max(0, val),
      },
    });
  };

  return (
    <div className="space-y-6">
      <CurrencyBanner currency={character.currency} onChange={handleCurrencyChange} />

      {/* Main Inventory Gear List */}
      <div className="bg-card/20 backdrop-blur-md p-6 rounded-2xl border border-border/50 space-y-6">
        <div className="flex justify-between items-center border-b border-border/40 pb-4">
          <div>
            <h3 className="text-xl font-cinzel text-accent">Zaino ed equipaggiamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Armi, armature, oggetti e consumabili</p>
          </div>
          <button
            onClick={() => setEditingItem('new')}
            className="flex items-center gap-2 text-sm bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>Aggiungi oggetto</span>
          </button>
        </div>

        {editingItem && (
          <EquipmentForm
            initialData={editingItem === 'new' ? DEFAULT_ITEM : editingItem}
            onSave={handleSave}
            onCancel={() => setEditingItem(null)}
          />
        )}

        <div className="space-y-8">
          <ItemDisplayList
            title="🛡️ Equipaggiati"
            items={equippableItems}
            expandedItem={expandedItem}
            onToggleExpand={handleToggleExpand}
            onToggleEquip={handleToggleEquip}
            onEdit={setEditingItem}
            onDelete={handleDelete}
          />
          <ItemDisplayList
            title="🎒 Zaino"
            items={backpackItems}
            expandedItem={expandedItem}
            onToggleExpand={handleToggleExpand}
            onToggleEquip={handleToggleEquip}
            onEdit={setEditingItem}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

/** Renders EquipmentListContent only once the character is loaded, so its hooks never run conditionally. */
export const EquipmentList = () => {
    const { character } = useCharacter();
    return character ? <EquipmentListContent /> : null;
};
