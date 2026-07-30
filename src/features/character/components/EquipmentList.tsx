import React, { useState, useMemo } from 'react';
import { useCharacter } from '../CharacterProvider';
import { EquipmentItem, Currency } from '../characterTypes';
import { PlusCircleIcon, TrashIcon, EditIcon, ChevronDownIcon, PhotoIcon } from '../../../components/ui/icons';
import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../data/weaponProperties';
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
  const [formData, setFormData] = useState<Omit<EquipmentItem, 'id'> & { id?: string }>({
    ...initialData,
    itemType: initialData.itemType || (initialData.armorType === 'shield' ? 'shield' : (initialData.armorType ? 'armor' : (initialData.damage ? 'weapon' : 'gear'))),
  });
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false);
  const { currentUser } = useAuth();
  const { character } = useCharacter();

  const handleChange = (field: keyof EquipmentItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const dataToSave = { ...formData };
    if (dataToSave.itemType === 'weapon') {
      delete dataToSave.armorType;
      delete dataToSave.armorClass;
    } else if (dataToSave.itemType === 'armor' || dataToSave.itemType === 'shield') {
      if (dataToSave.itemType === 'shield') {
        dataToSave.armorType = 'shield';
      }
      delete dataToSave.damage;
      delete dataToSave.damageType;
    }

    onSave(dataToSave);
  };

  const handleImageUpload = async (dataUrl: string) => {
    if (!currentUser || !character) return;
    const itemId = 'id' in initialData ? initialData.id : `temp_${Date.now()}`;
    try {
      const downloadUrl = await uploadItemImage(dataUrl, currentUser.uid, character.id, itemId);
      handleChange('imageUrl', downloadUrl);
    } catch (error) {
      console.error("Failed to upload item image:", error);
      alert("Failed to upload image.");
    }
  };

  const DAMAGE_TYPES = [
    'Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic',
    'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'
  ];

  const inputClass = "w-full bg-input p-2.5 rounded-lg border border-border focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm font-medium transition-all";
  const labelClass = "block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider ml-1";

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-card/95 backdrop-blur-md p-6 rounded-xl border border-accent/20 space-y-5 mb-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-2">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32 pointer-events-none" />

        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <h3 className="font-cinzel text-xl font-bold text-accent italic">
            {formData.id ? 'Refine Artifact' : 'Forge New Entry'}
          </h3>
          <div className="flex items-center gap-3">
            {formData.imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-accent/30 shadow-inner">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsImageUploaderOpen(true)}
              className="p-2 bg-background/50 hover:bg-accent/10 border border-border/50 rounded-lg text-accent transition-all"
              title="Upload Image"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label htmlFor="name" className={labelClass}>Item Name</label>
            <input id="name" type="text" placeholder="e.g., Longsword, Plate Armor, Potion of Healing" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="quantity" className={labelClass}>Quantity</label>
            <input id="quantity" type="number" value={formData.quantity} onChange={e => handleChange('quantity', parseInt(e.target.value) || 1)} min="1" className={`${inputClass} text-center font-mono`} />
          </div>
        </div>

        <div>
          <label htmlFor="itemType" className={labelClass}>Categoria Oggetto</label>
          <select
            id="itemType"
            value={formData.itemType || 'gear'}
            onChange={e => handleChange('itemType', e.target.value as any)}
            className={inputClass}
          >
            <option value="weapon">⚔️ Arma</option>
            <option value="armor">🛡️ Armatura Body</option>
            <option value="shield">🛡️ Scudo</option>
            <option value="wondrous">✨ Oggetto Prodigioso / Magico</option>
            <option value="ring">💍 Anello Magico</option>
            <option value="amulet">📿 Amuleto / Ciondolo</option>
            <option value="helmet">🪖 Elmo / Copricapo</option>
            <option value="potion">🧪 Pozione / Consumabile</option>
            <option value="scroll">📜 Pergamena</option>
            <option value="gear">🎒 Oggetto da Avventura / Zaino</option>
          </select>
        </div>

        {/* Weapon Fields */}
        {formData.itemType === 'weapon' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-background/40 rounded-lg border border-accent/20">
            <div>
              <label htmlFor="damage" className={labelClass}>Formula Danno</label>
              <input id="damage" type="text" placeholder="es. 1d8 o 2d6" value={formData.damage || ''} onChange={e => handleChange('damage', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="damageType" className={labelClass}>Tipo Danno</label>
              <input id="damageType" type="text" placeholder="es. Tagliente, Perforante" value={formData.damageType || ''} onChange={e => handleChange('damageType', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="attackBonus" className={labelClass}>Bonus Magico / Hit</label>
              <input id="attackBonus" type="text" placeholder="es. +1" value={formData.attackBonus || ''} onChange={e => handleChange('attackBonus', e.target.value)} className={inputClass} />
            </div>
          </div>
        )}

        {/* Armor / Shield / Magic AC Fields */}
        {(formData.itemType === 'armor' || formData.itemType === 'shield' || formData.itemType === 'wondrous' || formData.itemType === 'ring' || formData.itemType === 'amulet' || formData.itemType === 'helmet') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-background/40 rounded-lg border border-accent/20">
            {formData.itemType === 'armor' && (
              <div>
                <label htmlFor="armorType" className={labelClass}>Tipo Armatura</label>
                <select id="armorType" value={formData.armorType || 'light'} onChange={e => handleChange('armorType', e.target.value || undefined)} className={inputClass}>
                  <option value="light">Armatura Leggera</option>
                  <option value="medium">Armatura Media</option>
                  <option value="heavy">Armatura Pesante</option>
                </select>
              </div>
            )}
            {(formData.itemType === 'armor' || formData.itemType === 'shield') && (
              <div>
                <label htmlFor="armorClass" className={labelClass}>Classe Armatura (CA Base / Scudo)</label>
                <input id="armorClass" type="number" placeholder={formData.itemType === 'shield' ? "es. 2" : "es. 14"} value={formData.armorClass || ''} onChange={e => handleChange('armorClass', parseInt(e.target.value) || undefined)} className={inputClass} />
              </div>
            )}
            <div>
              <label htmlFor="bonusAC" className={labelClass}>Bonus CA Magico (es. +1 da Anello/Mantello)</label>
              <input id="bonusAC" type="number" placeholder="es. 1" value={formData.bonusAC || ''} onChange={e => handleChange('bonusAC', parseInt(e.target.value) || undefined)} className={inputClass} />
            </div>
          </div>
        )}

        {/* Sintonizzazione (Attunement) & Cariche Attive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-300">
              <input
                type="checkbox"
                checked={formData.requiresAttunement || false}
                onChange={e => handleChange('requiresAttunement', e.target.checked)}
                className="rounded border-purple-500/50 bg-background/60 text-purple-500 focus:ring-purple-500"
              />
              <span>🔮 Richiede Sintonizzazione</span>
            </label>
            {formData.requiresAttunement && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-purple-200 pl-4">
                <input
                  type="checkbox"
                  checked={formData.isAttuned || false}
                  onChange={e => handleChange('isAttuned', e.target.checked)}
                  className="rounded border-purple-500/50 bg-background/60 text-purple-500"
                />
                <span>Sintonizzato Attualmente</span>
              </label>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="maxCharges" className={labelClass}>Cariche Max / Usi</label>
                <input
                  id="maxCharges"
                  type="number"
                  min="0"
                  placeholder="es. 1"
                  value={formData.charges?.max || ''}
                  onChange={e => {
                    const max = parseInt(e.target.value) || 0;
                    if (max > 0) {
                      handleChange('charges', {
                        current: formData.charges?.current ?? max,
                        max,
                        resetType: formData.charges?.resetType || 'longRest',
                      });
                    } else {
                      handleChange('charges', undefined);
                    }
                  }}
                  className={inputClass}
                />
              </div>
              {formData.charges && formData.charges.max > 0 && (
                <div className="flex-1">
                  <label htmlFor="resetType" className={labelClass}>Reset al</label>
                  <select
                    id="resetType"
                    value={formData.charges.resetType}
                    onChange={e => handleChange('charges', { ...formData.charges!, resetType: e.target.value as any })}
                    className={inputClass}
                  >
                    <option value="longRest">Riposo Lungo</option>
                    <option value="shortRest">Riposo Breve</option>
                    <option value="dawn">Alba</option>
                    <option value="none">Nessun Reset</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Descrizione / Note</label>
          <textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} className={inputClass} rows={2}></textarea>
        </div>

        {/* Tactical Weapon Details (Mirroring AttackForm) */}
        {formData.armorType === 'weapon' && (
          <div className="space-y-4 p-4 bg-accent/5 rounded-xl border border-accent/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-accent/30 flex-1" />
              <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">Weapon Combat Stats</h4>
              <div className="h-px bg-accent/30 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Hit Ability</label>
                <select value={formData.attackAbility || ''} onChange={e => handleChange('attackAbility', e.target.value)} className={inputClass}>
                  <option value="">None (Flat)</option>
                  {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="md:col-span-4 flex items-center justify-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  <input type="checkbox" checked={formData.isProficient || false} onChange={e => handleChange('isProficient', e.target.checked)} className="accent-accent w-4 h-4" />
                  Proficiency Bonus
                </label>
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Mastery</label>
                <select value={formData.mastery || ''} onChange={e => handleChange('mastery', e.target.value)} className={inputClass}>
                  <option value="">None</option>
                  {Object.keys(WEAPON_MASTERIES).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 space-y-1">
                <label className={labelClass}>Base Damage</label>
                <input type="text" placeholder="1d8" value={formData.damage || ''} onChange={e => handleChange('damage', e.target.value)} className={`${inputClass} font-mono font-bold text-center`} />
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className={labelClass}>Dmg Add</label>
                <select value={formData.damageAbility || ''} onChange={e => handleChange('damageAbility', e.target.value)} className={inputClass}>
                  <option value="">None</option>
                  {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(a => <option key={a} value={a}>+{a.substring(0, 3).toUpperCase()}</option>)}
                </select>
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Dmg Type</label>
                <select value={formData.damageType || ''} onChange={e => handleChange('damageType', e.target.value)} className={inputClass}>
                  <option value="">-- Type --</option>
                  {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Properties</label>
              <div className="flex flex-wrap gap-2 p-3 bg-background/30 rounded-xl border border-border/30 min-h-[3rem]">
                {Object.keys(WEAPON_PROPERTIES).map(prop => {
                  const isActive = formData.properties?.includes(prop);
                  return (
                    <button
                      key={prop}
                      type="button"
                      onClick={() => {
                        const currentProps = formData.properties || [];
                        const newProps = isActive
                          ? currentProps.filter(p => p !== prop)
                          : [...currentProps, prop];
                        handleChange('properties', newProps);
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-md border transition-all duration-200 font-semibold uppercase tracking-wide
                        ${isActive
                          ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_-4px_rgba(var(--color-accent),0.5)]'
                          : 'bg-background/50 text-muted-foreground border-border/50 hover:border-accent/50 hover:text-foreground'
                        }`}
                      title={WEAPON_PROPERTIES[prop].description}
                    >
                      {prop}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {formData.additionalDamage?.map((extra, idx) => (
                <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2">
                  <input type="text" placeholder="Extra (e.g. 1d6)" value={extra.formula} onChange={e => {
                    const newExtras = [...(formData.additionalDamage || [])];
                    newExtras[idx] = { ...newExtras[idx], formula: e.target.value };
                    handleChange('additionalDamage', newExtras);
                  }} className={`${inputClass} flex-1 text-center font-mono`} />
                  <select value={extra.type} onChange={e => {
                    const newExtras = [...(formData.additionalDamage || [])];
                    newExtras[idx] = { ...newExtras[idx], type: e.target.value };
                    handleChange('additionalDamage', newExtras);
                  }} className={`${inputClass} flex-1`}>
                    {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <button type="button" onClick={() => handleChange('additionalDamage', formData.additionalDamage?.filter((_, i) => i !== idx))} className="p-2 text-muted-foreground hover:text-destructive"><TrashIcon className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => handleChange('additionalDamage', [...(formData.additionalDamage || []), { formula: '', type: '' }])} className="text-[10px] font-black uppercase text-accent/70 hover:text-accent flex items-center gap-1 ml-1 tracking-widest">
                <PlusCircleIcon className="w-3.5 h-3.5" /> Append Mixed Damage
              </button>
            </div>
          </div>
        )}

        {/* Enchanted Artifact Details */}
        {formData.armorType === 'magic' && (
          <div className="space-y-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-purple-500/30 flex-1" />
              <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Artifact Power</h4>
              <div className="h-px bg-purple-500/30 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 space-y-1">
                <label className={labelClass}>Special Ability / Spell</label>
                <input type="text" placeholder="e.g. Fireball" value={formData.grantsSpellName || ''} onChange={e => handleChange('grantsSpellName', e.target.value)} className={inputClass} />
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Save Attribute</label>
                <select value={formData.saveAbility || ''} onChange={e => handleChange('saveAbility', e.target.value)} className={inputClass}>
                  <option value="">None (Attack Roll)</option>
                  {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7 space-y-1">
                <label className={labelClass}>Power Effect / Damage</label>
                <input type="text" placeholder="8d6" value={formData.damage || ''} onChange={e => handleChange('damage', e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div className="md:col-span-5 space-y-1">
                <label className={labelClass}>Effect Type</label>
                <select value={formData.damageType || ''} onChange={e => handleChange('damageType', e.target.value)} className={inputClass}>
                  <option value="">-- Type --</option>
                  {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Limited Resource/Charge Tracking */}
        {(formData.armorType === 'magic' || formData.armorType === 'weapon' || formData.uses?.max) && (
          <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-3">
            <h4 className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              Resource & Charge Capacity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Max Charges</label>
                <input type="number" value={formData.uses?.max || ''} onChange={e => {
                  const max = parseInt(e.target.value) || 0;
                  handleChange('uses', { max, current: formData.uses?.current ?? max });
                }} className={`${inputClass} text-center font-mono`} />
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Current</label>
                <input type="number" value={formData.uses?.current ?? ''} onChange={e => handleChange('uses', { ...formData.uses, current: parseInt(e.target.value) || 0 })} className={`${inputClass} text-center font-mono`} />
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Recovery Cycle</label>
                <select value={formData.recovery || 'none'} onChange={e => handleChange('recovery', e.target.value)} className={inputClass}>
                  <option value="none">Irreplaceable</option>
                  <option value="short">Short Rest</option>
                  <option value="long">Long Rest</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
          <button type="button" onClick={onCancel} className="bg-muted/40 hover:bg-muted/60 text-foreground font-bold py-2 px-6 rounded-lg transition-all text-sm uppercase tracking-wider">Dismiss</button>
          <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-8 rounded-lg transition-all text-sm shadow-md hover:shadow-primary/20 uppercase tracking-widest">Enchant & Save</button>
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
  onToggleEquip,
  onEdit,
  onDelete,
}: {
  title: string;
  items: EquipmentItem[];
  expandedItem: string | null;
  onToggleExpand: (id: string) => void;
  onToggleEquip: (id: string) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (id: string) => void;
}) => (
  <div>
    <h4 className="text-base font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center justify-between">
      {title}
      <span className="text-xs bg-muted/40 px-2 py-0.5 rounded text-muted-foreground">{items.length}</span>
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  {item.equipped && <span className="ml-2 text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Equipped</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} {item.damage && `• Dmg: ${item.damage}`} {item.armorClass ? `• AC: ${item.armorClass}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onToggleEquip(item.id)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-sm ${
                  item.equipped
                    ? 'bg-primary text-primary-foreground shadow-primary/20'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50'
                }`}
              >
                {item.equipped ? 'Equipped' : 'Equip'}
              </button>
              <button onClick={() => onEdit(item)} className="text-muted-foreground hover:text-accent p-1.5 hover:bg-accent/10 rounded transition-colors"><EditIcon className="w-4 h-4" /></button>
              <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive p-1.5 hover:bg-destructive/10 rounded transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
          </div>
          {expandedItem === item.id && (
            <div className="p-3 border-t border-border/30 bg-muted/10 space-y-2">
              <div className="flex flex-wrap gap-2 text-xs">
                {item.armorType && (
                  <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                    <span className="text-muted-foreground capitalize mr-1">Armor:</span>
                    <span className="font-medium">{item.armorType}</span>
                  </div>
                )}
                {item.armorClass && (
                  <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                    <span className="text-muted-foreground capitalize mr-1">AC:</span>
                    <span className="font-medium">{item.armorClass}</span>
                  </div>
                )}
                {item.damage && (
                  <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                    <span className="text-muted-foreground capitalize mr-1">Damage:</span>
                    <span className="font-medium">{item.damage} {item.damageType}</span>
                  </div>
                )}
              </div>
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

  const totalGp = useMemo(() => {
    const c = character.currency || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    const total = (c.pp || 0) * 10 + (c.gp || 0) + (c.ep || 0) * 0.5 + (c.sp || 0) * 0.1 + (c.cp || 0) * 0.01;
    return total.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [character.currency]);

  return (
    <div className="space-y-6">
      {/* Top Currency Banner */}
      <div className="bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <h3 className="text-xl font-cinzel text-accent flex items-center gap-2">
            <span>🪙</span> Monete & Portamonete
          </h3>
          <div className="bg-accent/10 text-accent px-3.5 py-1 rounded-xl border border-accent/20 text-xs font-bold font-mono">
            Valore Totale Stimato: <span className="text-white text-sm font-black">{totalGp} GP</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { key: 'pp', label: 'PP (Platino)', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
            { key: 'gp', label: 'GP (Oro)', color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400' },
            { key: 'ep', label: 'EP (Elettro)', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' },
            { key: 'sp', label: 'SP (Argento)', color: 'border-slate-400/30 bg-slate-400/5 text-slate-200' },
            { key: 'cp', label: 'CP (Rame)', color: 'border-orange-600/30 bg-orange-600/5 text-orange-400' },
          ].map((coin) => {
            const val = character.currency[coin.key as keyof Currency] || 0;
            return (
              <div key={coin.key} className={`p-3 rounded-xl border ${coin.color} flex flex-col items-center justify-between gap-2 shadow-sm`}>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{coin.label}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange(coin.key as keyof Currency, val - 1)}
                    className="w-7 h-7 rounded-lg bg-background/50 hover:bg-background border border-border/50 text-foreground font-bold flex items-center justify-center transition-colors text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handleCurrencyChange(coin.key as keyof Currency, parseInt(e.target.value) || 0)}
                    className="w-14 bg-background/60 text-center font-mono font-bold text-base rounded border border-border/40 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange(coin.key as keyof Currency, val + 1)}
                    className="w-7 h-7 rounded-lg bg-background/50 hover:bg-background border border-border/50 text-foreground font-bold flex items-center justify-center transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Inventory Gear List */}
      <div className="bg-card/20 backdrop-blur-md p-6 rounded-2xl border border-border/50 space-y-6">
        <div className="flex justify-between items-center border-b border-border/40 pb-4">
          <div>
            <h3 className="text-xl font-cinzel text-accent">Zaino ed Equipaggiamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Gestisci tutti i tuoi oggetti, armi, armature e consumabili</p>
          </div>
          <button
            onClick={() => setEditingItem('new')}
            className="flex items-center gap-2 text-sm bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>Aggiungi Oggetto</span>
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
            title="🛡️ Armi, Armature & Oggetti Equipaggiati"
            items={equippableItems}
            expandedItem={expandedItem}
            onToggleExpand={handleToggleExpand}
            onToggleEquip={handleToggleEquip}
            onEdit={setEditingItem}
            onDelete={handleDelete}
          />
          <ItemDisplayList
            title="🎒 Zaino & Oggetti da Avventura"
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
