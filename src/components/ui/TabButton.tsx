import { FC } from 'react';

interface TabButtonProps {
  id: string;
  /** id of the tab panel this button controls */
  controls: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: FC<{ className?: string }>;
  /** `underline`: barra sotto la voce attiva; `pill`: segmento in un contenitore con `.tab-indicator` scorrevole (lo posiziona il genitore). */
  variant?: 'underline' | 'pill';
}

export const TabButton = ({ id, controls, label, isActive, onClick, icon: Icon, variant = 'underline' }: TabButtonProps) => {
  if (variant === 'pill') {
    return (
      <button
        id={id}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={controls}
        onClick={onClick}
        className={`relative z-10 flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isActive
            ? 'text-accent'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </button>
    );
  }

  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={controls}
      onClick={onClick}
      className={`relative group flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent ${
        isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      <span
        aria-hidden
        className={`absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ${
          isActive
            ? 'left-2 right-2 bg-accent shadow-[0_0_8px_rgb(var(--color-accent)/0.6)]'
            : 'left-1/2 right-1/2 bg-accent/30 group-hover:left-2 group-hover:right-2'
        }`}
      />
    </button>
  );
};
