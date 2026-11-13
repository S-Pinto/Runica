import { fieldGroupClass, fieldGroupTitleClass, fieldNumericClass } from '../../../../components/ui/field';
import { ABILITY_SHORT } from '../../../../lib/labels';
import { DAMAGE_TYPES, FormFieldsProps, inputClass, labelClass } from './formShared';

const SAVE_OPTIONS = [
  { value: 'str', label: ABILITY_SHORT.strength },
  { value: 'dex', label: ABILITY_SHORT.dexterity },
  { value: 'con', label: ABILITY_SHORT.constitution },
  { value: 'int', label: ABILITY_SHORT.intelligence },
  { value: 'wis', label: ABILITY_SHORT.wisdom },
  { value: 'cha', label: ABILITY_SHORT.charisma },
];

/** Potere dell'oggetto magico: capacità/incantesimo, tiro salvezza, effetto. */
export const MagicPowerFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className={`${fieldGroupClass} space-y-3`}>
    <h5 className={fieldGroupTitleClass}>Potere dell'oggetto</h5>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
      <div className="sm:col-span-8">
        <label htmlFor="item-power" className={labelClass}>Capacità speciale o incantesimo</label>
        <input id="item-power" type="text" placeholder="Es. Palla di fuoco" value={formData.grantsSpellName || ''} onChange={e => onChange('grantsSpellName', e.target.value)} className={inputClass} />
      </div>
      <div className="sm:col-span-4">
        <label htmlFor="item-save" className={labelClass}>Tiro salvezza su</label>
        <select id="item-save" value={formData.saveAbility || ''} onChange={e => onChange('saveAbility', e.target.value)} className={inputClass}>
          <option value="">Nessuno (tiro per colpire)</option>
          {SAVE_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
      <div className="sm:col-span-7">
        <label htmlFor="item-effect" className={labelClass}>Effetto o danni</label>
        <input id="item-effect" type="text" placeholder="8d6" value={formData.damage || ''} onChange={e => onChange('damage', e.target.value)} className={fieldNumericClass} />
      </div>
      <div className="sm:col-span-5">
        <label htmlFor="item-effect-type" className={labelClass}>Tipo di effetto</label>
        <select id="item-effect-type" value={formData.damageType || ''} onChange={e => onChange('damageType', e.target.value)} className={inputClass}>
          <option value="">Tipo di danno</option>
          {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
    </div>
  </div>
);

/** Contatore di cariche limitate (usi massimi/attuali e ricarica). */
export const UsesTrackingFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className={`${fieldGroupClass} space-y-3`}>
    <h5 className={fieldGroupTitleClass}>Usi limitati</h5>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label htmlFor="item-uses-max" className={labelClass}>Massimi</label>
        <input id="item-uses-max" type="number" inputMode="numeric" value={formData.uses?.max || ''} onChange={e => {
          const max = parseInt(e.target.value) || 0;
          onChange('uses', { max, current: formData.uses?.current ?? max });
        }} className={fieldNumericClass} />
      </div>
      <div>
        <label htmlFor="item-uses-current" className={labelClass}>Attuali</label>
        <input id="item-uses-current" type="number" inputMode="numeric" value={formData.uses?.current ?? ''} onChange={e => onChange('uses', { max: formData.uses?.max ?? 0, current: parseInt(e.target.value) || 0 })} className={fieldNumericClass} />
      </div>
      <div>
        <label htmlFor="item-uses-recovery" className={labelClass}>Si ricarica con</label>
        <select id="item-uses-recovery" value={formData.recovery || 'none'} onChange={e => onChange('recovery', e.target.value as FormFieldsProps['formData']['recovery'])} className={inputClass}>
          <option value="none">Non si ricarica</option>
          <option value="short">Riposo breve</option>
          <option value="long">Riposo lungo</option>
        </select>
      </div>
    </div>
  </div>
);
