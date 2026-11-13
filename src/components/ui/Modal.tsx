import { KeyboardEvent, ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { XMarkIcon } from './icons';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  // Schede complete (compagno): più colonne da `sm`.
  xl: 'sm:max-w-3xl',
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Icona opzionale accanto al titolo. */
  icon?: ReactNode;
  children: ReactNode;
  /** Barra fissa sotto il titolo (es. le tab): non scorre con il contenuto. */
  toolbar?: ReactNode;
  /** Azioni fisse in fondo al pannello (non scorrono con il contenuto). */
  footer?: ReactNode;
  size?: ModalSize;
}

/**
 * Guscio comune delle finestre: ancorato in basso su mobile, centrato da `sm`.
 * Chiude con Esc, con il pulsante e toccando il velo; tiene il focus dentro il
 * pannello e lo restituisce a chi l'ha aperto. `confirmDialog` e i toast
 * restano sopra (vedi zIndex in tailwind.config.js).
 */
export const Modal = ({ open, onClose, title, icon, children, toolbar, footer, size = 'md' }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim/70 backdrop-blur-sm animate-fadeIn sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`pb-safe flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border/70 bg-card/90 text-text shadow-floating backdrop-blur-xl backdrop-saturate-150 outline-none animate-sheetIn sm:rounded-2xl sm:animate-popIn ${SIZES[size]}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-2 pl-5 pr-2">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2.5 font-cinzel text-headline text-foreground">
            {icon && <span className="shrink-0 text-accent [&_svg]:h-5 [&_svg]:w-5">{icon}</span>}
            <span className="truncate">{title}</span>
          </h2>
          <Button variant="ghost" size="icon-lg" aria-label="Chiudi" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </header>
        {toolbar && <div className="shrink-0 border-b border-border">{toolbar}</div>}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
        {footer && <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};
