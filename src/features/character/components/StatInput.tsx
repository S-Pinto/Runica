import React from 'react';
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
  const handleIncrement = () => onChange(Number(value) + 1);
  const handleDecrement = () => onChange(Number(value) - 1);
  const modifier = formatModifier(getModifier(Number(value)));

  const buttonClasses = "p-1.5 bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col items-center">
      {showModifier && <div className="text-lg font-bold text-accent h-7 flex items-center mb-1">{modifier}</div>}
      <div className={`flex items-center gap-0.5 bg-input border border-border rounded-md p-1 ${className}`}>
        <button type="button" onClick={handleDecrement} className={buttonClasses}>
          <MinusIcon className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const rawValue = e.target.value;
            onChange(rawValue === '' ? '' : parseInt(rawValue, 10));
          }}
          placeholder={placeholder}
          className={`no-spinner w-12 bg-transparent border-0 text-center text-2xl font-bold text-foreground focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:text-sm ${inputClassName}`}
        />
        <button type="button" onClick={handleIncrement} className={buttonClasses}>
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      {label && <label className="block text-sm font-medium text-muted-foreground mt-2">{label}</label>}
    </div>
  );
};