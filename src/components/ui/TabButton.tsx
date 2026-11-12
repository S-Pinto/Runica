interface TabButtonProps {
  id: string;
  /** id of the tab panel this button controls */
  controls: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton = ({ id, controls, label, isActive, onClick }: TabButtonProps) => (
  <button
    id={id}
    type="button"
    role="tab"
    aria-selected={isActive}
    aria-controls={controls}
    onClick={onClick}
    className={`relative group px-5 py-2.5 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent ${
      isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {label}
    <span
      aria-hidden
      className={`absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ${
        isActive
          ? 'left-0 right-0 bg-accent shadow-[0_0_8px_rgb(var(--color-accent)/0.6)]'
          : 'left-1/2 right-1/2 bg-accent/30 group-hover:left-0 group-hover:right-0'
      }`}
    />
  </button>
);
