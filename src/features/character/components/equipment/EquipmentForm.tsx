import React, { useMemo, useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { EquipmentItem, ItemRarity } from '../../characterTypes';
import { fieldNumericClass } from '../../../../components/ui/field';
import { InlineForm } from '../ui/InlineForm';
import { ImageUploader } from '../ImageUploader';
import { useAuth } from '../../../../providers/AuthProvider';
import { uploadItemImage } from '../../../../services/storageService';
import { toast } from '../../../../components/ui/Dialogs';
import { normalizeAbility } from '../../rules/attacks';
import {
  ammunitionCandidates, canAttune, cleanEffects, getItemPowers, hasLegacyPower, inferItemCategory, normalizeItemForSave,
} from '../../rules/equipment';
import { resolveOptionalRules } from '../../rules/encumbrance';
import { RARITY_LABELS, RARITY_ORDER, SUBTYPE_SUGGESTIONS } from '../../utils/itemLabels';
import { EquipmentFormData, inputClass, labelClass } from './formShared';
import { ArmorBasicFields } from './BasicStatFields';
import { AttunementFields } from './AttunementFields';
import { WeaponFields } from './WeaponFields';
import { FormSection } from './FormSection';
import { ItemEffectsFields } from './ItemEffectsFields';
import { ItemPowersFields } from './ItemPowersFields';
import { ItemLoreFields } from './ItemLoreFields';

/** Senza accesso l'immagine resta nella scheda come data URL, ma solo se piccola (Firestore e localStorage hanno limiti). */
const MAX_INLINE_IMAGE_CHARS = 200_000;

/** Stato iniziale del form: il potere del formato vecchio diventa una voce di `powers`, modificabile come le altre. */
const initialFormData = (initialData: Omit<EquipmentItem, 'id'> | EquipmentItem): EquipmentFormData => {
  const itemType = inferItemCategory(initialData);
  const data: EquipmentFormData = { ...initialData, itemType };
  // Armi del formato vecchio: il bonus magico stava in `armorClass`; lo si mostra nel suo campo.
  if (itemType === 'weapon' && initialData.armorType === 'weapon' && initialData.armorClass && !String(initialData.attackBonus ?? '').trim()) {
    data.attackBonus = initialData.armorClass > 0 ? `+${initialData.armorClass}` : String(initialData.armorClass);
  }
  if (!Array.isArray(initialData.powers) && hasLegacyPower({ id: '', ...initialData })) {
    data.powers = getItemPowers({ id: '', ...initialData }).map(p => ({ ...p, saveAbility: normalizeAbility(p.saveAbility) }));
    delete data.grantsSpellName;
    delete data.saveAbility;
    delete data.damage;
    delete data.damageType;
  }
  return data;
};

const countLabel = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : undefined);

/** Form per aggiungere o modificare un oggetto: base sempre a vista, il resto in sezioni comprimibili. */
export const EquipmentForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Omit<EquipmentItem, 'id'> | EquipmentItem;
  onSave: (data: Omit<EquipmentItem, 'id'> | EquipmentItem) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<EquipmentFormData>(() => initialFormData(initialData));
  // Le sezioni con dati si aprono al montaggio; lo stato iniziale non deve cambiare mentre si scrive.
  const [opened] = useState(() => ({
    effects: !!cleanEffects(formData.effects) || !!formData.bonusAC,
    powers: !!formData.powers?.length || !!formData.charges?.max || !!formData.uses?.max,
    lore: !!formData.description?.trim() || !!formData.traits?.length || !!formData.imageUrl,
  }));
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
    if (!character) return;
    if (!currentUser) {
      if (dataUrl.length > MAX_INLINE_IMAGE_CHARS) toast.error("Immagine troppo grande per la modalità senza accesso: accedi o usa un URL.");
      else handleChange('imageUrl', dataUrl);
      return;
    }
    const itemId = ownId ?? `temp_${Date.now()}`;
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
  const effectsCount = (formData.effects?.defenses?.length || 0) + (formData.effects?.saveBonuses?.length || 0) + (formData.effects?.senses?.length || 0);

  return (
    <>
      <InlineForm
        title={formData.id ? 'Modifica oggetto' : 'Nuovo oggetto'}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitLabel="Salva oggetto"
        className="mb-5"
        aside={formData.imageUrl ? <img src={formData.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : undefined}
      >
        {/* Base & rarità: sempre a vista. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <label htmlFor="name" className={labelClass}>Nome dell'oggetto</label>
            <input id="name" type="text" placeholder="Es. spada lunga" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="itemType" className={labelClass}>Categoria</label>
            <select id="itemType" value={category} onChange={e => handleChange('itemType', e.target.value as EquipmentItem['itemType'])} className={inputClass}>
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
          <div className="sm:col-span-4">
            <label htmlFor="subtype" className={labelClass}>Sottotipo</label>
            <input id="subtype" type="text" list="item-subtypes" placeholder="Es. Piastre" value={formData.subtype || ''} onChange={e => handleChange('subtype', e.target.value)} className={inputClass} />
            <datalist id="item-subtypes">{(SUBTYPE_SUGGESTIONS[category] || []).map(s => <option key={s} value={s} />)}</datalist>
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="rarity" className={labelClass}>Rarità</label>
            <select id="rarity" value={formData.rarity || ''} onChange={e => handleChange('rarity', (e.target.value || undefined) as ItemRarity | undefined)} className={inputClass}>
              <option value="">Nessuna (non magico)</option>
              {RARITY_ORDER.map(r => <option key={r} value={r}>{RARITY_LABELS[r]}</option>)}
            </select>
          </div>
          <div className={rules?.encumbrance ? 'sm:col-span-2' : 'sm:col-span-4'}>
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
        <ArmorBasicFields {...fieldProps} />
        <AttunementFields {...fieldProps} attunementFull={attunementFull} />

        {category === 'weapon' && (
          <FormSection title="Danni e bonus dell'arma" defaultOpen>
            <WeaponFields {...fieldProps} ammoCandidates={rules?.ammunition ? ammoCandidates : undefined} />
          </FormSection>
        )}

        <FormSection title="Proprietà passive e difese" hint={countLabel(effectsCount, 'voce', 'voci')} defaultOpen={opened.effects}>
          <ItemEffectsFields {...fieldProps} />
        </FormSection>

        <FormSection title="Poteri attivabili e cariche" hint={countLabel(formData.powers?.length || 0, 'potere', 'poteri')} defaultOpen={opened.powers}>
          <ItemPowersFields {...fieldProps} />
        </FormSection>

        <FormSection title="Note, proprietà e immagine" hint={countLabel(formData.traits?.length || 0, 'proprietà', 'proprietà')} defaultOpen={opened.lore}>
          <ItemLoreFields {...fieldProps} onUploadImage={() => setIsImageUploaderOpen(true)} />
        </FormSection>
      </InlineForm>
      <ImageUploader
        isOpen={isImageUploaderOpen}
        onClose={() => setIsImageUploaderOpen(false)}
        onImageReady={handleImageUpload}
      />
    </>
  );
};
