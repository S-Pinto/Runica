import React, { useId } from 'react';
import { MinusIcon, PlusIcon } from '../../../components/ui/icons';
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

export const StatInput: React.FC<StatInputProps> = ({ label, value, onChange, placeholder, className = '', inputClassName = '', showModifier }) => {
  const handleIncrement = () => onChange((Number(value) || 0) + 1);

  const handleDecrement = () => {
    const numValue = Number(value) || 0;
    // Previene che il valore scenda sotto 0, utile per le statistiche
    if (numValue > 0) {
      onChange(numValue - 1);
    }
  };

  const modifier = formatModifier(getModifier(Number(value)));
  const inputId = useId();

  // Pulsanti più grandi e rotondi per una migliore accessibilità su mobile
  const buttonClasses = "p-2 bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  return (
    // Container principale: layout verticale, full-width e con spaziature migliorate
    <div className={`flex flex-col items-center gap-2 w-full ${className}`}>
      {/* 1. Label in alto per un layout mobile e accessibilità migliori */}
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-muted-foreground">{label}</label>}

      {/* 2. Modificatore più evidente */}
      {showModifier && (
        <div className="text-2xl font-bold text-accent h-8 flex items-center">
          {modifier}
        </div>
      )}

      {/* 3. Gruppo di input con stile moderno a "pillola" e reattivo */}
      <div className="flex items-center justify-between w-full max-w-[180px] bg-background border border-input rounded-full p-1">
        <button type="button" onClick={handleDecrement} className={buttonClasses}>
          <MinusIcon className="w-5 h-5" />
        </button>
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={(e) => {
            const rawValue = e.target.value;
            onChange(rawValue === '' ? '' : parseInt(rawValue, 10));
          }}
          placeholder={placeholder}
          // Rimuoviamo la larghezza fissa e usiamo flex-1 per renderlo flessibile
          className={`no-spinner flex-1 min-w-0 bg-transparent border-0 text-center text-4xl font-bold text-foreground focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:text-base ${inputClassName}`}
        />
        <button type="button" onClick={handleIncrement} className={buttonClasses}>
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};