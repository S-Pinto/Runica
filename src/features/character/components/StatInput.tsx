import React, { useId } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../../../components/ui/icons';
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

  // Pulsanti significativamente più grandi su mobile (p-3) per una migliore accessibilità
  const buttonClasses = "p-3 sm:p-2 bg-secondary/80 hover:bg-accent text-secondary-foreground hover:text-accent-foreground rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center";

  return (
    // Container principale: layout verticale, full-width e con spaziature migliorate
    <div className={`flex flex-col items-center gap-2 w-full min-w-[100px] ${className}`}>
      {/* 1. Label in alto per un layout mobile e accessibilità migliori */}
      {label && <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/90">{label}</label>}

      {/* 2. Modificatore più evidente, se presente */}
      {showModifier && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-accent text-accent-foreground text-xs font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
          {modifier}
        </div>
      )}

      {/* 3. Gruppo di input con stile moderno a "vetro" */}
      <div className="relative flex items-center justify-between w-full bg-background/40 backdrop-blur-sm border border-border/60 rounded-xl p-1 shadow-sm group focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-200 hover:bg-background/60">
        <button type="button" onClick={handleDecrement} className={buttonClasses} aria-label="Decrement">
          <ChevronDownIcon className="w-4 h-4" />
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
          className={`no-spinner flex-1 min-w-0 bg-transparent border-0 text-center text-xl sm:text-2xl font-bold text-foreground focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30 ${inputClassName}`}
        />
        <button type="button" onClick={handleIncrement} className={buttonClasses} aria-label="Increment">
          <ChevronUpIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};