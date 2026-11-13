import { fieldNumericClass } from '../../../../components/ui/field';
import { FormFieldsProps, inputClass, labelClass } from './formShared';

/** Contatore di cariche limitate (usi massimi/attuali e ricarica). */
export const UsesTrackingFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="space-y-2">
    <p className={labelClass}>Usi limitati (formato precedente)</p>
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
