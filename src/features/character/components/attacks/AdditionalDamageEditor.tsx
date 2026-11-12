import { Attack } from '../../characterTypes';
import { TrashIcon, PlusCircleIcon } from '../../../../components/ui/icons';
import { DAMAGE_TYPES, inputClass } from './attackFormShared';

type AdditionalDamage = NonNullable<Attack['additionalDamage']>;

/** Elenco dei danni extra di un attacco (formula + tipo) con aggiunta e rimozione. */
export const AdditionalDamageEditor = ({ extras, onChange }: { extras: AdditionalDamage | undefined; onChange: (value: AdditionalDamage) => void }) => {
  const formData = { additionalDamage: extras };
  const handleChange = (_field: 'additionalDamage', value: AdditionalDamage) => onChange(value);
  return (
        <div className="space-y-2 mt-3">
          {formData.additionalDamage?.map((extra, idx) => (
            <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-top-1">
              <input
                type="text"
                placeholder="Danno extra (es. 1d6)"
                value={extra.formula}
                onChange={e => {
                  const newExtras = [...(formData.additionalDamage || [])];
                  newExtras[idx] = { ...newExtras[idx], formula: e.target.value };
                  handleChange('additionalDamage', newExtras);
                }}
                className={`${inputClass} text-center font-mono font-bold`}
              />
              <select
                value={extra.type}
                onChange={e => {
                  const newExtras = [...(formData.additionalDamage || [])];
                  newExtras[idx] = { ...newExtras[idx], type: e.target.value };
                  handleChange('additionalDamage', newExtras);
                }}
                className={inputClass}
              >
                <option value="">-- Tipo --</option>
                {DAMAGE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const newExtras = [...(formData.additionalDamage || [])].filter((_, i) => i !== idx);
                  handleChange('additionalDamage', newExtras);
                }}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              handleChange('additionalDamage', [...(formData.additionalDamage || []), { formula: '', type: '' }]);
            }}
            className="text-[10px] font-black uppercase text-accent/70 hover:text-accent flex items-center gap-1 ml-1 tracking-widest mt-1"
          >
            <PlusCircleIcon className="w-3.5 h-3.5" /> Aggiungi danno di altro tipo
          </button>
        </div>
  );
};
