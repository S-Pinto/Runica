import React, { useState, useMemo } from 'react';
import { useCharacter } from '../CharacterProvider';
import { EquipmentItem } from '../characterTypes';
import { PlusCircleIcon, TrashIcon, EditIcon, ChevronDownIcon } from '../../../components/ui/icons';

const DEFAULT_ITEM: Omit<EquipmentItem, 'id'> = {
  name: '',
  quantity: 1,
  description: '',
  equipped: false,
};

// Form for adding/editing items
const EquipmentForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Omit<EquipmentItem, 'id'> | EquipmentItem;
  onSave: (data: Omit<EquipmentItem, 'id'> | EquipmentItem) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: keyof EquipmentItem, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const inputClass = "w-full bg-zinc-800 p-2 rounded border border-zinc-600 focus:ring-amber-500 focus:border-amber-500 text-sm";
  const labelClass = "block text-xs font-medium text-zinc-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-700/80 p-4 rounded-lg border border-amber-500/30 space-y-4 mb-4">
      <h3 className="font-cinzel text-lg text-amber-400">{'id' in initialData ? 'Edit Item' : 'Add New Item'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className={labelClass}>Item Name</label>
          <input id="name" type="text" placeholder="e.g., Longsword" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="quantity" className={labelClass}>Quantity</label>
          <input id="quantity" type="number" value={formData.quantity} onChange={e => handleChange('quantity', parseInt(e.target.value) || 1)} min="1" className={`${inputClass} text-center`} />
        </div>
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} className={inputClass} rows={3}></textarea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="armorType" className={labelClass}>Armor Type</label>
          <select id="armorType" value={formData.armorType || ''} onChange={e => handleChange('armorType', e.target.value || undefined)} className={inputClass}>
            <option value="">Not Armor</option>
            <option value="light">Light Armor</option>
            <option value="medium">Medium Armor</option>
            <option value="heavy">Heavy Armor</option>
            <option value="shield">Shield</option>
          </select>
        </div>
        <div>
          <label htmlFor="armorClass" className={labelClass}>Armor Class (AC)</label>
          <input id="armorClass" type="number" placeholder="e.g., 14" value={formData.armorClass || ''} onChange={e => handleChange('armorClass', parseInt(e.target.value) || undefined)} className={inputClass} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-zinc-600 hover:bg-zinc-500 text-white font-bold py-2 px-4 rounded transition text-sm">Cancel</button>
        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded transition text-sm">Save Item</button>
      </div>
    </form>
  );
};

const ItemDisplayList = ({
  title,
  items,
  expandedItem,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  title: string;
  items: EquipmentItem[];
  expandedItem: string | null;
  onToggleExpand: (id: string) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (id: string) => void;
}) => (
  <div>
    <h4 className="text-base font-semibold text-zinc-300 border-b border-zinc-700 pb-2 mb-3">{title}</h4>
    <div className="space-y-2">
      {items.length === 0 && <p className="text-center text-zinc-500 text-xs py-2">Empty</p>}
      {items.map(item => (
        <div key={item.id} className="bg-zinc-700/50 rounded-lg text-sm">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => onToggleExpand(item.id)} className="flex-shrink-0 text-zinc-400 hover:text-white">
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`} />
              </button>
              <p className="font-semibold text-amber-300 truncate" title={item.name}>{item.name} <span className="text-xs text-zinc-400">(x{item.quantity})</span></p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => onEdit(item)} className="text-zinc-400 hover:text-amber-400 p-1"><EditIcon className="w-4 h-4"/></button>
              <button onClick={() => onDelete(item.id)} className="text-zinc-500 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4"/></button>
            </div>
          </div>
          {expandedItem === item.id && (
            <div className="p-3 border-t border-zinc-600/50 bg-zinc-900/30 space-y-2">
              {item.armorType && (
                <p><strong className="text-zinc-400 capitalize">{item.armorType} Armor</strong>
                   {item.armorClass ? <span className="text-zinc-300"> (AC: {item.armorClass})</span> : ''}
                </p>
              )}
              <p className="text-zinc-300 whitespace-pre-wrap">{item.description || 'No description.'}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export const EquipmentList = () => {
  const { character, updateCharacter } = useCharacter();
  const [editingItem, setEditingItem] = useState<EquipmentItem | 'new' | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleSave = (itemData: Omit<EquipmentItem, 'id'> | EquipmentItem) => {
    let updatedEquipment: EquipmentItem[];
    if ('id' in itemData) {
      updatedEquipment = (character.equipment || []).map(item => item.id === itemData.id ? itemData : item);
    } else {
      const newItem: EquipmentItem = { ...itemData, id: `item_${Date.now()}` };
      updatedEquipment = [...(character.equipment || []), newItem];
    }
    updateCharacter({ equipment: updatedEquipment });
    setEditingItem(null);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedEquipment = (character.equipment || []).filter(item => item.id !== itemId);
      updateCharacter({ equipment: updatedEquipment });
    }
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItem(prev => (prev === itemId ? null : itemId));
  };

  const { equippableItems, backpackItems } = useMemo(() => {
    const equippable: EquipmentItem[] = [];
    const backpack: EquipmentItem[] = [];
    (character.equipment || []).forEach(item => {
      if (item.armorType) {
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

  return (
    <div className="bg-zinc-900/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-amber-400">Inventory</h3>
        <button onClick={() => setEditingItem('new')} className="flex items-center gap-2 text-sm bg-amber-600 hover:bg-amber-500 px-3 py-2 rounded-md text-white transition">
          <PlusCircleIcon className="w-5 h-5" /> Add Item
        </button>
      </div>

      {editingItem && (
        <EquipmentForm
          initialData={editingItem === 'new' ? DEFAULT_ITEM : editingItem}
          onSave={handleSave}
          onCancel={() => setEditingItem(null)}
        />
      )}

      <div className="space-y-6">
        <ItemDisplayList 
          title="Equippable Gear"
          items={equippableItems}
          expandedItem={expandedItem}
          onToggleExpand={handleToggleExpand}
          onEdit={setEditingItem}
          onDelete={handleDelete}
        />
        <ItemDisplayList 
          title="Backpack"
          items={backpackItems}
          expandedItem={expandedItem}
          onToggleExpand={handleToggleExpand}
          onEdit={setEditingItem}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};
