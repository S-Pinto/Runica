type Tone = 'accent' | 'success' | 'destructive' | 'warning';

const ACTIVE: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  destructive: 'bg-destructive/15 text-destructive',
  warning: 'bg-warning/15 text-warning',
};

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Colore della voce quando è attiva (predefinito: accento). */
  tone?: Tone;
}

interface SegmentedControlProps<T extends string> {
  /** Nome del gruppo per i lettori di schermo. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Scelta esclusiva fra poche voci (modalità del tiro, filtri): un `radiogroup` con bersagli da 40px. */
export const SegmentedControl = <T extends string>({ label, options, value, onChange, className = '' }: SegmentedControlProps<T>) => (
  <div role="radiogroup" aria-label={label} className={`flex rounded-xl border border-border-strong/60 bg-background/40 p-0.5 ${className}`}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(option.value)}
          className={`h-9 min-w-0 flex-1 whitespace-nowrap rounded-[10px] px-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            active ? ACTIVE[option.tone ?? 'accent'] : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
