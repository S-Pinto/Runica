import { fieldGroupClass, fieldNumericClass } from '../../../../components/ui/field';
import { EquipmentFormData, FormFieldsProps, inputClass, labelClass } from './formShared';

/** Danno / bonus al colpire di un'arma semplice e CA / bonus CA di armature e oggetti magici. */
export const WeaponBasicFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className={`${fieldGroupClass} grid grid-cols-1 gap-3 sm:grid-cols-3`}>
    <div>
      <label htmlFor="damage" className={labelClass}>Formula del danno</label>
      <input id="damage" type="text" placeholder="1d8" value={formData.damage || ''} onChange={e => onChange('damage', e.target.value)} className={fieldNumericClass} />
    </div>
    <div>
      <label htmlFor="damageType" className={labelClass}>Tipo di danno</label>
      <input id="damageType" type="text" placeholder="Tagliente" value={formData.damageType || ''} onChange={e => onChange('damageType', e.target.value)} className={inputClass} />
    </div>
    <div>
      <label htmlFor="attackBonus" className={labelClass}>Bonus magico</label>
      <input id="attackBonus" type="text" placeholder="+1" value={formData.attackBonus || ''} onChange={e => onChange('attackBonus', e.target.value)} className={fieldNumericClass} />
    </div>
  </div>
);

export const ArmorBasicFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className={`${fieldGroupClass} grid grid-cols-1 gap-3 sm:grid-cols-3`}>
    {formData.itemType === 'armor' && (
      <div>
        <label htmlFor="armorType" className={labelClass}>Tipo di armatura</label>
        <select id="armorType" value={formData.armorType || 'light'} onChange={e => onChange('armorType', (e.target.value || undefined) as EquipmentFormData['armorType'])} className={inputClass}>
          <option value="light">Leggera</option>
          <option value="medium">Media</option>
          <option value="heavy">Pesante</option>
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
    </div>
  </div>
);
