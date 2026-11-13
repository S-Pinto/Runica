import { fieldNumericClass } from '../../../../components/ui/field';
import { EquipmentFormData, FormFieldsProps, inputClass, labelClass } from './formShared';

/** Tipo e CA di armature e scudi, requisito di Forza delle armature. Il bonus magico alla CA è nelle proprietà passive. */
export const ArmorBasicFields = ({ formData, onChange }: FormFieldsProps) => {
  if (formData.itemType !== 'armor' && formData.itemType !== 'shield') return null;
  const isArmor = formData.itemType === 'armor';
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {isArmor && (
        <div>
          <label htmlFor="armorType" className={labelClass}>Tipo di armatura</label>
          <select id="armorType" value={['light', 'medium', 'heavy'].includes(formData.armorType || '') ? formData.armorType : 'light'} onChange={e => onChange('armorType', (e.target.value || undefined) as EquipmentFormData['armorType'])} className={inputClass}>
            <option value="light">Leggera (+ DES)</option>
            <option value="medium">Media (+ DES fino a +2)</option>
            <option value="heavy">Pesante (niente DES)</option>
          </select>
        </div>
      )}
      <div>
        <label htmlFor="armorClass" className={labelClass}>{isArmor ? 'CA base' : 'Bonus dello scudo'}</label>
        <input id="armorClass" type="number" inputMode="numeric" placeholder={isArmor ? '14' : '2'} value={formData.armorClass || ''} onChange={e => onChange('armorClass', parseInt(e.target.value) || undefined)} className={fieldNumericClass} />
      </div>
      {isArmor && (
        <div>
          <label htmlFor="strengthRequirement" className={labelClass}>Forza richiesta</label>
          <input id="strengthRequirement" type="number" inputMode="numeric" placeholder="—" value={formData.strengthRequirement || ''} onChange={e => onChange('strengthRequirement', parseInt(e.target.value) || undefined)} className={fieldNumericClass} />
        </div>
      )}
    </div>
  );
};
