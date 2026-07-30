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

export const StatInput: React.FC<StatInputProps> = ({ label, value, onChange, placeholder, className = '', inputClassName = '', showModifier }) => {
  const handleIncrement = () => onChange((Number(value) || 0) + 1);

  const handleDecrement = () => {
    const numValue = Number(value) || 0;
    if (numValue > 0) {
      onChange(numValue - 1);
    }
  };

  const modifier = formatModifier(getModifier(Number(value)));
  const inputId = useId();

  // Pulsanti + e - ben definiti e ampi per mobile (w-9 h-9 min-w-[36px])
  const buttonClasses = "w-9 h-9 sm:w-8 sm:h-8 bg-secondary/80 hover:bg-accent text-secondary-foreground hover:text-accent-foreground rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40 flex items-center justify-center font-bold active:scale-95 shadow-sm flex-shrink-0";

  return (
    <div className={`flex flex-col items-center gap-1.5 w-full min-w-[100px] ${className}`}>
      {label && <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/90 select-none">{label}</label>}

      {showModifier && (
        <div className="bg-accent/20 border border-accent/40 text-accent text-xs font-bold px-2 py-0.5 rounded shadow-sm z-10">
          {modifier}
        </div>
      )}

      <div className="relative flex items-center justify-between w-full bg-background/50 backdrop-blur-sm border border-border/70 rounded-xl p-1 shadow-sm group focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-200 hover:bg-background/70">
        <button type="button" onClick={handleDecrement} className={buttonClasses} aria-label="Decrement value">
          <MinusIcon className="w-4 h-4" />
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
        <button type="button" onClick={handleIncrement} className={buttonClasses} aria-label="Increment value">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};