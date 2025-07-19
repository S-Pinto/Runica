import { EquipmentItem } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { TrashIcon, EditIcon, PlusCircleIcon } from '../../../components/ui/icons';
import React, { useState, useMemo } from 'react';

const DEFAULT_ITEM: Omit<EquipmentItem, 'id'> = {
  name: '',
  quantity: 1,
  description: '',
  equipped: false,
};

const ItemForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: EquipmentItem | Omit<EquipmentItem, 'id'>;
  onSave: (data: EquipmentItem | Omit<EquipmentItem, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: keyof Omit<EquipmentItem, 'id'>, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };
  
  const inputClass = "w-full bg-zinc-800 p-2 rounded border border-zinc-600 focus:ring-amber-500 focus:border-amber-500";
  const ARMOR_TYPES: EquipmentItem['armorType'][] = ['light', 'medium', 'heavy', 'shield'];

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-700/80 p-4 rounded-lg border border-amber-500/30 space-y-4 mb-4">
      <h3 className="font-cinzel text-lg text-amber-400">{'id' in initialData ? 'Edit Item' : 'Add New Item'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input type="text" placeholder="Item Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={`${inputClass} sm:col-span-2`} />
        <input type="number" placeholder="Qty" value={formData.quantity} onChange={e => handleChange('quantity', parseInt(e.target.value))} min="1" className={`${inputClass} text-center`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-zinc-400">Armor Type</label>
                <select
                    value={formData.armorType || ''}
                    onChange={e => handleChange('armorType', e.target.value || undefined)}
                    className={inputClass}
                >
                    <option value="">Not Armor</option>
                    {ARMOR_TYPES.map(type => <option key={type} value={type} className="capitalize">{type}</option>)}
                </select>
            </div>
            {formData.armorType && (
                <div>
                    <label className="block text-xs font-medium text-zinc-400">
                        {formData.armorType === 'shield' ? 'AC Bonus' : 'Base AC'}
                    </label>
                    <input
                        type="number"
                        placeholder="AC"
                        value={formData.armorClass || ''}
                        onChange={e => handleChange('armorClass', parseInt(e.target.value) || 0)}
                        className={inputClass}
                    />
                </div>
            )}
        </div>

      <textarea placeholder="Description (optional)" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={3} className={`${inputClass} resize-y`}></textarea>
      
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-zinc-600 hover:bg-zinc-500 text-white font-bold py-2 px-4 rounded transition">Cancel</button>
        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded transition">Save Item</button>
      </div>
    </form>
  );
};

export const EquipmentList = () => {
  const { character, updateCharacter } = useCharacter();
  const [editingItem, setEditingItem] = useState<EquipmentItem | 'new' | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    if (!character) return null;

  const handleSaveItem = (itemData: EquipmentItem | Omit<EquipmentItem, 'id'>) => {
    let updatedEquipment: EquipmentItem[];
    if ('id' in itemData) {
      updatedEquipment = character.equipment.map(f => f.id === itemData.id ? itemData : f);
    } else {
      const newItem: EquipmentItem = { ...itemData, id: `item_${Date.now()}` };
      updatedEquipment = [...character.equipment, newItem];
    }
    updateCharacter({ equipment: updatedEquipment });
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedEquipment = character.equipment.filter(f => f.id !== itemId);
      updateCharacter({ equipment: updatedEquipment });
    }
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const sortedEquipment = useMemo(() => {
    return [...(character.equipment || [])].sort((a,b) => a.name.localeCompare(b.name));
  }, [character.equipment]);

  return (
    <div className="bg-zinc-800/80 p-4 rounded-lg border border-zinc-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-amber-400">Equipment</h3>
        <button onClick={() => setEditingItem('new')} className="flex items-center gap-2 text-sm bg-amber-600 hover:bg-amber-500 px-3 py-2 rounded-md text-white transition">
          <PlusCircleIcon className="w-5 h-5" /> Add Item
        </button>
      </div>

      {editingItem && (
        <ItemForm
          initialData={editingItem === 'new' ? DEFAULT_ITEM : editingItem}
          onSave={handleSaveItem}
          onCancel={() => setEditingItem(null)}
        />
      )}

      <div className="space-y-2 overflow-y-auto pr-2 -mr-2 flex-grow">
        {sortedEquipment.length === 0 && !editingItem && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-zinc-500 text-sm py-4">Your backpack is empty.</p>
          </div>
        )}
        {sortedEquipment.map(item => (
          <div key={item.id} className="bg-zinc-700/50 rounded-lg text-sm">
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleExpand(item.id)}>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-amber-300">{item.name}</span>
                <span className="text-zinc-400 text-xs">(x{item.quantity})</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} className="text-zinc-400 hover:text-amber-400 p-1"><EditIcon className="w-4 h-4"/></button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="text-zinc-500 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4"/></button>
              </div>
            </div>
            {expandedItems[item.id] && (item.description || item.armorType) && (
              <div className="p-3 border-t border-zinc-600/50 bg-zinc-900/30">
                {item.armorType && <p className="text-xs text-sky-300 capitalize mb-1">Type: {item.armorType} {item.armorType !== 'shield' ? `(Base AC ${item.armorClass})` : `(AC Bonus +${item.armorClass})`}</p>}
                {item.description && <p className="text-zinc-300 whitespace-pre-wrap">{item.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
