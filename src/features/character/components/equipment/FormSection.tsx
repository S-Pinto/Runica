import { ReactNode } from 'react';
import { ChevronDownIcon } from '../../../../components/ui/icons';
import { fieldGroupClass, fieldGroupTitleClass } from '../../../../components/ui/field';

interface FormSectionProps {
  title: string;
  /** Riassunto breve accanto al titolo (es. "2 poteri"). */
  hint?: string;
  /** Aperta al montaggio: le sezioni con dati si aprono da sole, le vuote restano chiuse. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Sezione comprimibile del form oggetto: semplice per gli oggetti comuni, completa per quelli leggendari. */
export const FormSection = ({ title, hint, defaultOpen = false, children }: FormSectionProps) => (
  <details open={defaultOpen} className={`group ${fieldGroupClass} p-0 sm:p-0`}>
    <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 sm:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <h5 className={fieldGroupTitleClass}>{title}</h5>
      {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      <ChevronDownIcon className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180" />
    </summary>
    <div className="space-y-4 border-t border-border/60 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">{children}</div>
  </details>
);
