import { EquipmentItem } from '../../characterTypes';
import { fieldCheckRowClass, fieldGroupClass, fieldGroupTitleClass, fieldNumericClass } from '../../../../components/ui/field';
import { FormFieldsProps, inputClass, labelClass } from './formShared';

/** Sintonizzazione e cariche attive (con tipo di reset). */
export const AttunementFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className={fieldGroupClass}>
    <h5 className={`${fieldGroupTitleClass} mb-2`}>Sintonizzazione e cariche</h5>
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
      <div>
        <label className={fieldCheckRowClass}>
          <input
            type="checkbox"
            className="check-rune"
            checked={formData.requiresAttunement || false}
            onChange={e => onChange('requiresAttunement', e.target.checked)}
          />
          Richiede sintonizzazione
        </label>
        {formData.requiresAttunement && (
          <label className={`${fieldCheckRowClass} pl-7`}>
            <input
              type="checkbox"
              className="check-rune"
              checked={formData.isAttuned || false}
              onChange={e => onChange('isAttuned', e.target.checked)}
            />
            Sintonizzato ora
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="maxCharges" className={labelClass}>Cariche massime</label>
          <input
            id="maxCharges"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
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
            className={fieldNumericClass}
          />
        </div>
        {formData.charges && formData.charges.max > 0 && (
          <div className="min-w-0 flex-1">
            <label htmlFor="resetType" className={labelClass}>Si ricaricano</label>
            <select
              id="resetType"
              value={formData.charges.resetType}
              onChange={e => onChange('charges', { ...formData.charges!, resetType: e.target.value as NonNullable<EquipmentItem['charges']>['resetType'] })}
              className={inputClass}
            >
              <option value="longRest">Al riposo lungo</option>
              <option value="shortRest">Al riposo breve</option>
              <option value="dawn">All'alba</option>
              <option value="none">Mai</option>
            </select>
          </div>
        )}
      </div>
    </div>
  </div>
);
