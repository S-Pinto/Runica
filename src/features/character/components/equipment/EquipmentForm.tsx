import React, { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { EquipmentItem } from '../../characterTypes';
import { PhotoIcon } from '../../../../components/ui/icons';
import { ImageUploader } from '../ImageUploader';
import { useAuth } from '../../../../providers/AuthProvider';
import { uploadItemImage } from '../../../../services/storageService';
import { toast } from '../../../../components/ui/Dialogs';
import { EquipmentFormData, inputClass, labelClass } from './formShared';
import { WeaponBasicFields, ArmorBasicFields } from './BasicStatFields';
import { AttunementFields } from './AttunementFields';
import { TacticalWeaponFields } from './TacticalWeaponFields';
import { MagicPowerFields, UsesTrackingFields } from './MagicItemFields';

/** Form per aggiungere o modificare un oggetto dell'equipaggiamento. */
export const EquipmentForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Omit<EquipmentItem, 'id'> | EquipmentItem;
  onSave: (data: Omit<EquipmentItem, 'id'> | EquipmentItem) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<EquipmentFormData>({
    ...initialData,
    itemType: initialData.itemType || (initialData.armorType === 'shield' ? 'shield' : (initialData.armorType ? 'armor' : (initialData.damage ? 'weapon' : 'gear'))),
  });
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false);
  const { currentUser } = useAuth();
  const { character } = useCharacter();

  const handleChange = <K extends keyof EquipmentItem>(field: K, value: EquipmentItem[K] | undefined) => {
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
      toast.error('Caricamento immagine non riuscito.');
    }
  };

  const fieldProps = { formData, onChange: handleChange };
  const hasArmorFields = ['armor', 'shield', 'wondrous', 'ring', 'amulet', 'helmet'].includes(formData.itemType || '');

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-card/95 backdrop-blur-md p-6 rounded-xl border border-accent/20 space-y-5 mb-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-2">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32 pointer-events-none" />

        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <h3 className="font-cinzel text-xl font-bold text-accent italic">
            {formData.id ? 'Modifica oggetto' : 'Nuovo oggetto'}
          </h3>
          <div className="flex items-center gap-3">
            {formData.imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-accent/30 shadow-inner">
                <img src={formData.imageUrl} alt="Anteprima" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsImageUploaderOpen(true)}
              className="p-2 bg-background/50 hover:bg-accent/10 border border-border/50 rounded-lg text-accent transition-all"
              title="Carica immagine"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label htmlFor="name" className={labelClass}>Nome dell'oggetto</label>
            <input id="name" type="text" placeholder="Es. spada lunga, armatura a piastre, pozione di guarigione" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="quantity" className={labelClass}>Quantità</label>
            <input id="quantity" type="number" value={formData.quantity} onChange={e => handleChange('quantity', parseInt(e.target.value) || 1)} min="1" className={`${inputClass} text-center font-mono`} />
          </div>
        </div>

        <div>
          <label htmlFor="itemType" className={labelClass}>Categoria</label>
          <select
            id="itemType"
            value={formData.itemType || 'gear'}
            onChange={e => handleChange('itemType', e.target.value as EquipmentItem['itemType'])}
            className={inputClass}
          >
            <option value="weapon">⚔️ Arma</option>
            <option value="armor">🛡️ Armatura</option>
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

        {formData.itemType === 'weapon' && <WeaponBasicFields {...fieldProps} />}
        {hasArmorFields && <ArmorBasicFields {...fieldProps} />}

        <AttunementFields {...fieldProps} />

        <div>
          <label htmlFor="description" className={labelClass}>Descrizione / Note</label>
          <textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} className={inputClass} rows={2}></textarea>
        </div>

        {formData.armorType === 'weapon' && <TacticalWeaponFields {...fieldProps} />}
        {formData.armorType === 'magic' && <MagicPowerFields {...fieldProps} />}
        {(formData.armorType === 'magic' || formData.armorType === 'weapon' || formData.uses?.max) && <UsesTrackingFields {...fieldProps} />}

        <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
          <button type="button" onClick={onCancel} className="bg-muted/40 hover:bg-muted/60 text-foreground font-bold py-2 px-6 rounded-lg transition-all text-sm uppercase tracking-wider">Annulla</button>
          <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-8 rounded-lg transition-all text-sm shadow-md hover:shadow-primary/20 uppercase tracking-widest">Salva oggetto</button>
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
