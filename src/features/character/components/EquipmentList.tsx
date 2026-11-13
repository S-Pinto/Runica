import { useState, useMemo } from 'react';
import { useCharacter } from '../CharacterProvider';
import { EquipmentItem, Currency } from '../characterTypes';
import { PlusIcon, ShieldIcon, BackpackIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { RuneDivider } from '../../../components/ui/RuneDivider';
import { StyledSection } from './ui/StyledInputs';
import { toggleEquippedItem, splitEquipment } from '../rules/equipment';
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
    const newEquipment = toggleEquippedItem(character.equipment, itemId);
    if (newEquipment) updateCharacter({ equipment: newEquipment });
  };

  const { equippableItems, backpackItems } = useMemo(() => splitEquipment(character.equipment), [character.equipment]);

  const handleCurrencyChange = (type: keyof Currency, val: number) => {
    updateCharacter({
      currency: {
        ...character.currency,
        [type]: Math.max(0, val),
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <CurrencyBanner currency={character.currency} onChange={handleCurrencyChange} />

      <RuneDivider />

      <StyledSection
        title="Zaino ed equipaggiamento"
        action={
          <Button variant="secondary" onClick={() => setEditingItem('new')} disabled={editingItem !== null}>
            <PlusIcon className="h-4 w-4" /> Aggiungi
          </Button>
        }
      >
        {editingItem && (
          <EquipmentForm
            key={editingItem === 'new' ? 'new' : editingItem.id}
            initialData={editingItem === 'new' ? DEFAULT_ITEM : editingItem}
            onSave={handleSave}
            onCancel={() => setEditingItem(null)}
          />
        )}

        <div className="space-y-6">
          <ItemDisplayList
            title="Equipaggiati"
            icon={<ShieldIcon />}
            emptyText="Niente di equipaggiato."
            items={equippableItems}
            expandedItem={expandedItem}
            onToggleExpand={handleToggleExpand}
            onToggleEquip={handleToggleEquip}
            onEdit={setEditingItem}
            onDelete={handleDelete}
          />
          <ItemDisplayList
            title="Zaino"
            icon={<BackpackIcon />}
            emptyText="Lo zaino è vuoto."
            items={backpackItems}
            expandedItem={expandedItem}
            onToggleExpand={handleToggleExpand}
            onToggleEquip={handleToggleEquip}
            onEdit={setEditingItem}
            onDelete={handleDelete}
          />
        </div>
      </StyledSection>
    </div>
  );
};

/** Renders EquipmentListContent only once the character is loaded, so its hooks never run conditionally. */
export const EquipmentList = () => {
    const { character } = useCharacter();
    return character ? <EquipmentListContent /> : null;
};
