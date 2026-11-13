/**
 * Themed replacements for window.confirm / window.alert.
 *
 * Usable anywhere, including non-React services:
 *   if (await confirmDialog({ title: 'Eliminare?', destructive: true })) { ... }
 *   toast.success('Salvato');  toast.error('Errore di rete');
 *
 * <DialogHost /> must be mounted once near the app root.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

// ---------- store ----------

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for deletions and other irreversible actions. */
  destructive?: boolean;
  /** Hide the cancel button (alert-style dialog). */
  hideCancel?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

type ToastVariant = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface State {
  confirm: PendingConfirm | null;
  toasts: Toast[];
}

let state: State = { confirm: null, toasts: [] };
const listeners = new Set<() => void>();
const setState = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let hostMounted = false;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  if (!hostMounted) {
    // Fallback so callers keep working if the host is missing (e.g. tests).
    return Promise.resolve(window.confirm([options.title, options.message].filter(Boolean).join('\n\n')));
  }
  return new Promise((resolve) => {
    state.confirm?.resolve(false); // only one dialog at a time
    setState({ confirm: { ...options, resolve } });
  });
}

/** Blocking message the user must acknowledge (e.g. before a reload). */
export function alertDialog(title: string, message?: string): Promise<void> {
  return confirmDialog({ title, message, confirmLabel: 'OK', hideCancel: true }).then(() => undefined);
}

let toastId = 0;
function pushToast(message: string, variant: ToastVariant) {
  if (!hostMounted) {
    window.alert(message);
    return;
  }
  const id = ++toastId;
  setState({ toasts: [...state.toasts, { id, message, variant }] });
  setTimeout(() => setState({ toasts: state.toasts.filter((t) => t.id !== id) }), variant === 'error' ? 6000 : 3500);
}

export const toast = {
  success: (m: string) => pushToast(m, 'success'),
  error: (m: string) => pushToast(m, 'error'),
  info: (m: string) => pushToast(m, 'info'),
};

// ---------- view ----------

const TOAST_STYLES: Record<ToastVariant, string> = {
  success: 'border-success/40 [&_.dot]:bg-success',
  error: 'border-destructive/50 [&_.dot]:bg-destructive',
  info: 'border-accent/40 [&_.dot]:bg-accent',
};

function ConfirmModal({ pending }: { pending: PendingConfirm }) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const close = (ok: boolean) => {
    pending.resolve(ok);
    setState({ confirm: null });
  };

  useEffect(() => {
    // Il focus torna a chi ha aperto la conferma (es. il pulsante dentro una finestra).
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div
      className="fixed inset-0 z-dialog flex items-end sm:items-center justify-center p-4 bg-scrim/70 backdrop-blur-sm animate-fadeIn"
      onMouseDown={(e) => e.target === e.currentTarget && close(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="pb-safe w-full max-w-md rounded-2xl border border-border bg-card shadow-floating p-6 animate-popIn"
      >
        <h2 id="dialog-title" className="font-cinzel text-headline text-foreground">
          {pending.title}
        </h2>
        {pending.message && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{pending.message}</p>
        )}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          {!pending.hideCancel && (
            <Button variant="ghost" onClick={() => close(false)}>
              {pending.cancelLabel ?? 'Annulla'}
            </Button>
          )}
          <Button
            ref={confirmRef}
            variant={pending.destructive ? 'destructive' : 'primary'}
            onClick={() => close(true)}
          >
            {pending.confirmLabel ?? 'Conferma'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DialogHost() {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hostMounted = true;
    setMounted(true);
    return () => {
      hostMounted = false;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      {snapshot.confirm && <ConfirmModal pending={snapshot.confirm} />}
      <div
        aria-live="polite"
        className="fixed z-toast bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96 pointer-events-none"
      >
        {snapshot.toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-text shadow-raised animate-popIn ${TOAST_STYLES[t.variant]}`}
          >
            <span className="dot mt-1.5 h-2 w-2 shrink-0 rounded-full" />
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </>,
    document.body,
  );
}
