import { fieldGroupClass, fieldNumericClass } from '../../../../components/ui/field';
import { EquipmentFormData, FormFieldsProps, inputClass, labelClass } from './formShared';

/** CA di armature e scudi e bonus magico alla CA (anche per anelli, amuleti, elmi). */
export const ArmorBasicFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className={`${fieldGroupClass} grid grid-cols-1 gap-3 sm:grid-cols-3`}>
    {formData.itemType === 'armor' && (
      <div>
        <label htmlFor="armorType" className={labelClass}>Tipo di armatura</label>
        <select id="armorType" value={['light', 'medium', 'heavy'].includes(formData.armorType || '') ? formData.armorType : 'light'} onChange={e => onChange('armorType', (e.target.value || undefined) as EquipmentFormData['armorType'])} className={inputClass}>
          <option value="light">Leggera (+ DES)</option>
          <option value="medium">Media (+ DES fino a +2)</option>
          <option value="heavy">Pesante (niente DES)</option>
        </select>
      </div>
    )}
    {(formData.itemType === 'armor' || formData.itemType === 'shield') && (
      <div>
        <label htmlFor="armorClass" className={labelClass}>{formData.itemType === 'shield' ? 'Bonus dello scudo' : 'CA base'}</label>
        <input id="armorClass" type="number" inputMode="numeric" placeholder={formData.itemType === 'shield' ? '2' : '14'} value={formData.armorClass || ''} onChange={e => onChange('armorClass', parseInt(e.target.value) || undefined)} className={fieldNumericClass} />
      </div>
    )}
    <div>
      <label htmlFor="bonusAC" className={labelClass}>Bonus magico alla CA</label>
      <input id="bonusAC" type="number" inputMode="numeric" placeholder="1" value={formData.bonusAC || ''} onChange={e => onChange('bonusAC', parseInt(e.target.value) || undefined)} className={fieldNumericClass} />
      {formData.requiresAttunement && <p className="mt-1 text-xs text-muted-foreground">Vale solo quando sei in sintonia.</p>}
    </div>
  </div>
);
