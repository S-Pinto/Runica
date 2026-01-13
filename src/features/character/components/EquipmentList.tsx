import React, { useState, useMemo } from 'react';
import { useCharacter } from '../CharacterProvider';
import { EquipmentItem } from '../characterTypes';
import { PlusCircleIcon, TrashIcon, EditIcon, ChevronDownIcon, PhotoIcon } from '../../../components/ui/icons';
import { ImageUploader } from './ImageUploader';
import { useAuth } from '../../../providers/AuthProvider';
import { uploadItemImage } from '../../../services/storageService';

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
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false);
  const { currentUser } = useAuth();
  const { character } = useCharacter();

  const handleChange = (field: keyof EquipmentItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const handleImageUpload = async (dataUrl: string) => {
    if (!currentUser || !character) return;
    // If we don't have an ID yet (new item), we can't upload to a permanent path immediately 
    // OR we generate a temp ID. 
    // Better strategy: For new items, we wait to upload until we save? 
    // Actually, 'initialData' might not have an ID.
    // Let's generate a temporary ID if one is missing for the path, or use timestamp.
    const itemId = 'id' in initialData ? initialData.id : `temp_${Date.now()}`;

    try {
      const downloadUrl = await uploadItemImage(dataUrl, currentUser.uid, character.id, itemId);
      handleChange('imageUrl', downloadUrl);
    } catch (error) {
      console.error("Failed to upload item image:", error);
      alert("Failed to upload image.");
    }
  };

  const inputClass = "w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent text-sm";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-card/80 p-6 rounded-xl border border-accent/20 space-y-4 mb-6 shadow-lg animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <PlusCircleIcon className="w-32 h-32" />
        </div>

        <div className="flex justify-between items-center border-b border-border/40 pb-2">
          <h3 className="font-cinzel text-lg text-accent">{'id' in initialData ? 'Edit Item' : 'Add New Item'}</h3>
          {formData.imageUrl && (
            <div className="w-10 h-10 rounded overflow-hidden border border-border">
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label htmlFor="name" className={labelClass}>Item Name</label>
            <input id="name" type="text" placeholder="e.g., Longsword" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
          </div>
          <div className="md:col-span-4">
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
            <label htmlFor="armorClass" className={labelClass}>Armor Class (AC) / Bonus</label>
            <input id="armorClass" type="number" placeholder="e.g., 14 or +2" value={formData.armorClass || ''} onChange={e => handleChange('armorClass', parseInt(e.target.value) || undefined)} className={inputClass} />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border/30">
          <button
            type="button"
            onClick={() => setIsImageUploaderOpen(true)}
            className="flex items-center gap-2 text-sm text-accent hover:text-accent-light transition-colors"
          >
            <PhotoIcon className="w-4 h-4" />
            {formData.imageUrl ? 'Change Image' : 'Add Image'}
          </button>

          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded transition text-sm">Cancel</button>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition text-sm shadow-sm">Save Item</button>
          </div>
        </div>
      </form>
      <ImageUploader
        isOpen={isImageUploaderOpen}
        onClose={() => setIsImageUploaderOpen(false)}
        onImageReady={handleImageUpload}
      />
    </>
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
    <h4 className="text-base font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center justify-between">
      {title}
      <span className="text-xs bg-muted/40 px-2 py-0.5 rounded text-muted-foreground">{items.length}</span>
    </h4>
    <div className="space-y-2">
      {items.length === 0 && <p className="text-center text-muted-foreground text-xs py-4 border border-dashed border-border/30 rounded-lg">No items in {title.toLowerCase()}.</p>}
      {items.map(item => (
        <div key={item.id} className="bg-card/40 backdrop-blur-sm rounded-lg text-sm border border-border/30 hover:border-accent/30 transition-all">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => onToggleExpand(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`} />
              </button>

              {/* Item Thumbnail */}
              <div className="w-10 h-10 rounded bg-muted/30 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent/5 flex items-center justify-center text-accent/20">
                    <span className="text-[9px] font-bold uppercase">{item.name.substring(0, 2)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <p className="font-semibold text-accent truncate" title={item.name}>
                  {item.name}
                  {item.equipped && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">Equipped</span>}
                </p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onEdit(item)} className="text-muted-foreground hover:text-accent p-1.5 hover:bg-accent/10 rounded transition-colors"><EditIcon className="w-4 h-4" /></button>
              <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive p-1.5 hover:bg-destructive/10 rounded transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
          </div>
          {expandedItem === item.id && (
            <div className="p-3 border-t border-border/30 bg-muted/10 space-y-2">
              {item.armorType && (
                <div className="flex gap-4 text-xs">
                  <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                    <span className="text-muted-foreground capitalize mr-1">Type:</span>
                    <span className="font-medium">{item.armorType}</span>
                  </div>
                  {item.armorClass && (
                    <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                      <span className="text-muted-foreground capitalize mr-1">AC:</span>
                      <span className="font-medium">{item.armorClass}</span>
                    </div>
                  )}
                </div>
              )}
              {item.description && <p className="text-foreground/80 whitespace-pre-wrap text-[13px] leading-relaxed pl-1">{item.description}</p>}
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

  if (!character) return null;

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
    <div className="bg-card/20 p-6 rounded-xl border border-border/50 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-cinzel text-accent">Inventory</h3>
        <button
          onClick={() => setEditingItem('new')}
          className="flex items-center gap-2 text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span className="font-bold">Add Item</span>
        </button>
      </div>

      {editingItem && (
        <EquipmentForm
          initialData={editingItem === 'new' ? DEFAULT_ITEM : editingItem}
          onSave={handleSave}
          onCancel={() => setEditingItem(null)}
        />
      )}

      <div className="space-y-8 overflow-y-auto px-1 -mx-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
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
