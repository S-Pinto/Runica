import { damageTypeLabel } from '../../../../lib/labels';
import { DAMAGE_TYPES, inputClass } from './formShared';

interface DamageTypeSelectProps {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  /** Testo della voce vuota. */
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

/** Tipo di danno: chiavi inglesi salvate, etichette italiane; un tipo libero già salvato resta selezionabile. */
export const DamageTypeSelect = ({ id, value, onChange, placeholder = 'Tipo di danno', className = '', ...rest }: DamageTypeSelectProps) => {
  const legacy = value && !DAMAGE_TYPES.includes(value) ? value : null;
  return (
    <select id={id} aria-label={rest['aria-label']} value={value || ''} onChange={e => onChange(e.target.value)} className={`${inputClass} ${className}`}>
      <option value="">{placeholder}</option>
      {legacy && <option value={legacy}>{legacy}</option>}
      {DAMAGE_TYPES.map(type => <option key={type} value={type}>{damageTypeLabel(type)}</option>)}
    </select>
  );
};
