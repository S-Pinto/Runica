import React, { useMemo, useState } from 'react';
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
import { ammunitionCandidates, canAttune, inferItemCategory, MAGIC_POWER_TYPES, normalizeItemForSave } from '../../rules/equipment';
import { resolveOptionalRules } from '../../rules/encumbrance';
import { EquipmentFormData, inputClass, labelClass } from './formShared';
import { ArmorBasicFields } from './BasicStatFields';
import { AttunementFields } from './AttunementFields';
import { WeaponFields } from './WeaponFields';
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
  const [formData, setFormData] = useState<EquipmentFormData>(() => {
    const itemType = inferItemCategory(initialData);
    // Armi del formato vecchio: il bonus magico stava in `armorClass`; lo si mostra nel suo campo.
    const legacyBonus = itemType === 'weapon' && initialData.armorType === 'weapon' && initialData.armorClass && !String(initialData.attackBonus ?? '').trim()
      ? (initialData.armorClass > 0 ? `+${initialData.armorClass}` : String(initialData.armorClass))
      : undefined;
    return { ...initialData, itemType, ...(legacyBonus ? { attackBonus: legacyBonus } : {}) };
  });
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false);
  const { currentUser } = useAuth();
  const { character } = useCharacter();
  const rules = character ? resolveOptionalRules(character) : null;
  const ownId = 'id' in initialData ? initialData.id : undefined;
  const ammoCandidates = useMemo(() => ammunitionCandidates(character?.equipment, ownId), [character?.equipment, ownId]);
  const attunementFull = !canAttune(character?.equipment, ownId);

  const handleChange = <K extends keyof EquipmentItem>(field: K, value: EquipmentItem[K] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(normalizeItemForSave(formData));
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
  const category = formData.itemType || 'gear';
  const hasArmorFields = ['armor', 'shield', 'wondrous', 'ring', 'amulet', 'helmet'].includes(category);
  const hasPowerFields = formData.armorType === 'magic' || MAGIC_POWER_TYPES.includes(category);

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
          <div className={rules?.encumbrance ? 'sm:col-span-5' : 'sm:col-span-6'}>
            <label htmlFor="name" className={labelClass}>Nome dell'oggetto</label>
            <input id="name" type="text" placeholder="Es. spada lunga" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
          </div>
          <div className={rules?.encumbrance ? 'sm:col-span-3' : 'sm:col-span-4'}>
            <label htmlFor="itemType" className={labelClass}>Categoria</label>
            <select
              id="itemType"
              value={category}
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
              <option value="gear">Oggetto da avventura o munizioni</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="quantity" className={labelClass}>Quantità</label>
            <input id="quantity" type="number" inputMode="numeric" value={formData.quantity} onChange={e => handleChange('quantity', Math.max(0, parseInt(e.target.value) || 0))} min="0" className={fieldNumericClass} />
          </div>
          {rules?.encumbrance && (
            <div className="sm:col-span-2">
              <label htmlFor="weight" className={labelClass}>Peso ({rules.weightUnit})</label>
              <input id="weight" type="number" inputMode="decimal" step="0.1" min="0" placeholder="0" value={formData.weight ?? ''} onChange={e => handleChange('weight', e.target.value === '' ? undefined : Math.max(0, parseFloat(e.target.value) || 0))} className={fieldNumericClass} />
            </div>
          )}
        </div>

        {category === 'weapon' && <WeaponFields {...fieldProps} ammoCandidates={rules?.ammunition ? ammoCandidates : undefined} />}
        {hasArmorFields && <ArmorBasicFields {...fieldProps} />}

        <AttunementFields {...fieldProps} attunementFull={attunementFull} />

        <div>
          <label htmlFor="description" className={labelClass}>Descrizione e note</label>
          <textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} className={`${inputClass} resize-y leading-relaxed`} rows={3}></textarea>
        </div>

        {hasPowerFields && <MagicPowerFields {...fieldProps} />}
        {/* Usi del formato vecchio: le cariche nuove sono in "Sintonizzazione e cariche". */}
        {!!formData.uses?.max && <UsesTrackingFields {...fieldProps} />}
      </InlineForm>
      <ImageUploader
        isOpen={isImageUploaderOpen}
        onClose={() => setIsImageUploaderOpen(false)}
        onImageReady={handleImageUpload}
      />
    </>
  );
};
