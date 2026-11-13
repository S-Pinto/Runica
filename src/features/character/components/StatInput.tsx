import React, { useId } from 'react';
import { PlusIcon, MinusIcon } from '../../../components/ui/icons';
import { getModifier, formatModifier } from '../utils/characterUtils';

interface StatInputProps {
  label?: string;
  value: number | '';
  onChange: (newValue: number | '') => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showModifier?: boolean;
}

const stepClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[background-color,color,transform] duration-150 ease-soft hover:bg-muted hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Valore numerico con passi +/−: il numero resta modificabile da tastiera. */
export const StatInput: React.FC<StatInputProps> = ({ label, value, onChange, placeholder, className = '', inputClassName = '', showModifier }) => {
  const handleIncrement = () => onChange((Number(value) || 0) + 1);

  const handleDecrement = () => {
    const numValue = Number(value) || 0;
    if (numValue > 0) {
      onChange(numValue - 1);
    }
  };

  const inputId = useId();

  return (
    <div className={`w-full min-w-[104px] ${className}`}>
      {(label || showModifier) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <label htmlFor={inputId} className="min-w-0 truncate text-label uppercase text-muted-foreground">{label}</label>}
          {showModifier && <span className="font-mono text-xs font-bold tabular-nums text-accent">{formatModifier(getModifier(Number(value)))}</span>}
        </div>
      )}

      <div className="flex items-center rounded-xl border border-border-strong/60 bg-background p-0.5 transition-colors duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 hover:border-border-strong">
        <button type="button" onClick={handleDecrement} className={stepClass} aria-label={label ? `Diminuisci ${label}` : 'Diminuisci'}>
          <MinusIcon className="h-4 w-4" />
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const rawValue = e.target.value;
            onChange(rawValue === '' ? '' : parseInt(rawValue, 10));
          }}
          placeholder={placeholder}
          className={`no-spinner w-full min-w-0 flex-1 border-0 bg-transparent px-0 py-1 text-center font-mono text-xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 ${inputClassName}`}
        />
        <button type="button" onClick={handleIncrement} className={stepClass} aria-label={label ? `Aumenta ${label}` : 'Aumenta'}>
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
