import { EquipmentFormData, FormFieldsProps, inputClass, labelClass } from './formShared';

/** Danno / bonus al colpire di un'arma semplice e CA / bonus CA di armature e oggetti magici. */
export const WeaponBasicFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-background/40 rounded-lg border border-accent/20">
    <div>
      <label htmlFor="damage" className={labelClass}>Formula Danno</label>
      <input id="damage" type="text" placeholder="es. 1d8 o 2d6" value={formData.damage || ''} onChange={e => onChange('damage', e.target.value)} className={inputClass} />
    </div>
    <div>
      <label htmlFor="damageType" className={labelClass}>Tipo Danno</label>
      <input id="damageType" type="text" placeholder="es. Tagliente, Perforante" value={formData.damageType || ''} onChange={e => onChange('damageType', e.target.value)} className={inputClass} />
    </div>
    <div>
      <label htmlFor="attackBonus" className={labelClass}>Bonus magico al colpire</label>
      <input id="attackBonus" type="text" placeholder="es. +1" value={formData.attackBonus || ''} onChange={e => onChange('attackBonus', e.target.value)} className={inputClass} />
    </div>
  </div>
);

export const ArmorBasicFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-background/40 rounded-lg border border-accent/20">
    {formData.itemType === 'armor' && (
      <div>
        <label htmlFor="armorType" className={labelClass}>Tipo Armatura</label>
        <select id="armorType" value={formData.armorType || 'light'} onChange={e => onChange('armorType', (e.target.value || undefined) as EquipmentFormData['armorType'])} className={inputClass}>
          <option value="light">Armatura Leggera</option>
          <option value="medium">Armatura Media</option>
          <option value="heavy">Armatura Pesante</option>
        </select>
      </div>
    )}
    {(formData.itemType === 'armor' || formData.itemType === 'shield') && (
      <div>
        <label htmlFor="armorClass" className={labelClass}>Classe Armatura (CA Base / Scudo)</label>
        <input id="armorClass" type="number" placeholder={formData.itemType === 'shield' ? "es. 2" : "es. 14"} value={formData.armorClass || ''} onChange={e => onChange('armorClass', parseInt(e.target.value) || undefined)} className={inputClass} />
      </div>
    )}
    <div>
      <label htmlFor="bonusAC" className={labelClass}>Bonus CA Magico (es. +1 da Anello/Mantello)</label>
      <input id="bonusAC" type="number" placeholder="es. 1" value={formData.bonusAC || ''} onChange={e => onChange('bonusAC', parseInt(e.target.value) || undefined)} className={inputClass} />
    </div>
  </div>
);
