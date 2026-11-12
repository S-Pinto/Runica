import { ReactNode, useEffect, useRef, useState } from 'react';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}

interface MenuProps {
  /** Accessible label for the trigger button. */
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  triggerClassName?: string;
  align?: 'start' | 'end';
  placement?: 'top' | 'bottom';
}

/** Small dropdown menu: opens on click, closes on outside click, Esc or selection. */
export const Menu = ({ label, trigger, items, triggerClassName = '', align = 'end', placement = 'bottom' }: MenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = itemRefs.current.findIndex((el) => el === document.activeElement);
        const next = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        itemRefs.current[next]?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, items.length]);

  return (
    // Stop events so a parent clickable/draggable card doesn't react.
    <div
      ref={rootRef}
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-30 min-w-44 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-1 shadow-2xl animate-popIn ${
            align === 'end' ? 'right-0' : 'left-0'
          } ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {items.map((item, i) => (
            <button
              key={item.label}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none [&_svg]:h-4 [&_svg]:w-4 ${
                item.destructive
                  ? 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
                  : 'text-text hover:bg-muted/40 focus:bg-muted/40'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
