import { EquipmentItem } from '../../characterTypes';
import { FormFieldsProps, inputClass, labelClass } from './formShared';

/** Sintonizzazione e cariche attive (con tipo di reset). */
export const AttunementFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-accent/10 rounded-lg border border-accent/30">
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-accent">
        <input
          type="checkbox"
          checked={formData.requiresAttunement || false}
          onChange={e => onChange('requiresAttunement', e.target.checked)}
          className="rounded border-accent/50 bg-background/60 text-accent focus:ring-accent"
        />
        <span>🔮 Richiede Sintonizzazione</span>
      </label>
      {formData.requiresAttunement && (
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-accent pl-4">
          <input
            type="checkbox"
            checked={formData.isAttuned || false}
            onChange={e => onChange('isAttuned', e.target.checked)}
            className="rounded border-accent/50 bg-background/60 text-accent"
          />
          <span>Sintonizzato Attualmente</span>
        </label>
      )}
    </div>

    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="maxCharges" className={labelClass}>Cariche Max / Usi</label>
          <input
            id="maxCharges"
            type="number"
            min="0"
            placeholder="es. 1"
            value={formData.charges?.max || ''}
            onChange={e => {
              const max = parseInt(e.target.value) || 0;
              if (max > 0) {
                onChange('charges', {
                  current: formData.charges?.current ?? max,
                  max,
                  resetType: formData.charges?.resetType || 'longRest',
                });
              } else {
                onChange('charges', undefined);
              }
            }}
            className={inputClass}
          />
        </div>
        {formData.charges && formData.charges.max > 0 && (
          <div className="flex-1">
            <label htmlFor="resetType" className={labelClass}>Reset al</label>
            <select
              id="resetType"
              value={formData.charges.resetType}
              onChange={e => onChange('charges', { ...formData.charges!, resetType: e.target.value as NonNullable<EquipmentItem['charges']>['resetType'] })}
              className={inputClass}
            >
              <option value="longRest">Riposo Lungo</option>
              <option value="shortRest">Riposo Breve</option>
              <option value="dawn">Alba</option>
              <option value="none">Nessun Reset</option>
            </select>
          </div>
        )}
      </div>
    </div>
  </div>
);
