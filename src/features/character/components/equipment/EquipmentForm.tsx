import React, { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { EquipmentItem } from '../../characterTypes';
import { PhotoIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { fieldNumericClass } from '../../../../components/ui/field';
import { InlineForm } from '../ui/InlineForm';
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
      <InlineForm
        title={formData.id ? 'Modifica oggetto' : 'Nuovo oggetto'}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitLabel="Salva oggetto"
        className="mb-5"
        aside={
          <div className="flex items-center gap-2">
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-border object-cover" />
            )}
            <Button variant="secondary" onClick={() => setIsImageUploaderOpen(true)}>
              <PhotoIcon className="h-4 w-4" /> {formData.imageUrl ? 'Cambia immagine' : 'Immagine'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <label htmlFor="name" className={labelClass}>Nome dell'oggetto</label>
            <input id="name" type="text" placeholder="Es. spada lunga" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="itemType" className={labelClass}>Categoria</label>
            <select
              id="itemType"
              value={formData.itemType || 'gear'}
              onChange={e => handleChange('itemType', e.target.value as EquipmentItem['itemType'])}
              className={inputClass}
            >
              <option value="weapon">Arma</option>
              <option value="armor">Armatura</option>
              <option value="shield">Scudo</option>
              <option value="wondrous">Oggetto prodigioso o magico</option>
              <option value="ring">Anello magico</option>
              <option value="amulet">Amuleto o ciondolo</option>
              <option value="helmet">Elmo o copricapo</option>
              <option value="potion">Pozione o consumabile</option>
              <option value="scroll">Pergamena</option>
              <option value="gear">Oggetto da avventura</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="quantity" className={labelClass}>Quantità</label>
            <input id="quantity" type="number" inputMode="numeric" value={formData.quantity} onChange={e => handleChange('quantity', parseInt(e.target.value) || 1)} min="1" className={fieldNumericClass} />
          </div>
        </div>

        {formData.itemType === 'weapon' && <WeaponBasicFields {...fieldProps} />}
        {hasArmorFields && <ArmorBasicFields {...fieldProps} />}

        <AttunementFields {...fieldProps} />

        <div>
          <label htmlFor="description" className={labelClass}>Descrizione e note</label>
          <textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} className={`${inputClass} resize-y leading-relaxed`} rows={3}></textarea>
        </div>

        {formData.armorType === 'weapon' && <TacticalWeaponFields {...fieldProps} />}
        {formData.armorType === 'magic' && <MagicPowerFields {...fieldProps} />}
        {(formData.armorType === 'magic' || formData.armorType === 'weapon' || formData.uses?.max) && <UsesTrackingFields {...fieldProps} />}
      </InlineForm>
      <ImageUploader
        isOpen={isImageUploaderOpen}
        onClose={() => setIsImageUploaderOpen(false)}
        onImageReady={handleImageUpload}
      />
    </>
  );
};
