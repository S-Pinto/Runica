import { EquipmentItem } from '../../characterTypes';
import { fieldCheckRowClass, fieldNumericClass } from '../../../../components/ui/field';
import { CHARGE_RESET_LABELS } from '../../utils/itemLabels';
import { FormFieldsProps, inputClass, labelClass } from './formShared';

/**
 * Sintonizzazione. `attunementFull`: già 3 altri oggetti in sintonia, quindi questo non si può sintonizzare.
 */
export const AttunementFields = ({ formData, onChange, attunementFull = false }: FormFieldsProps & { attunementFull?: boolean }) => (
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
      <>
        <label className={`${fieldCheckRowClass} pl-7 ${attunementFull && !formData.isAttuned ? 'cursor-not-allowed opacity-60' : ''}`}>
          <input
            type="checkbox"
            className="check-rune"
            checked={formData.isAttuned || false}
            disabled={attunementFull && !formData.isAttuned}
            onChange={e => onChange('isAttuned', e.target.checked)}
          />
          Sintonizzato ora
        </label>
        {attunementFull && !formData.isAttuned && (
          <p className="pl-7 text-xs text-muted-foreground">Sei già in sintonia con 3 oggetti: rompi una sintonia per aggiungerne un'altra.</p>
        )}
        <p className="pl-7 text-xs text-muted-foreground">Proprietà passive, bonus e poteri valgono solo in sintonia.</p>
      </>
    )}
  </div>
);

type ResetType = NonNullable<EquipmentItem['charges']>['resetType'];

/** Cariche dell'oggetto con il tipo di ricarica: i poteri possono spenderle. */
export const ChargesFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="flex gap-3">
    <div className="min-w-0 flex-1">
      <label htmlFor="maxCharges" className={labelClass}>Cariche dell'oggetto</label>
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
              current: Math.min(formData.charges?.current ?? max, max),
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
          onChange={e => onChange('charges', { ...formData.charges!, resetType: e.target.value as ResetType })}
          className={inputClass}
        >
          {(Object.keys(CHARGE_RESET_LABELS) as ResetType[]).map(k => <option key={k} value={k}>{CHARGE_RESET_LABELS[k]}</option>)}
        </select>
      </div>
    )}
  </div>
);
