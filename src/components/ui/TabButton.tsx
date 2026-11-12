import { FC } from 'react';

interface TabButtonProps {
  id: string;
  /** id of the tab panel this button controls */
  controls: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: FC<{ className?: string }>;
}

export const TabButton = ({ id, controls, label, isActive, onClick, icon: Icon }: TabButtonProps) => (
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
