import { FormEvent, ReactNode, useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { CheckIcon, EditIcon, TrashIcon, XMarkIcon } from '../../../../components/ui/icons';

interface InlineFormProps {
    title: string;
    onSubmit: (e: FormEvent) => void;
    onCancel: () => void;
    submitLabel?: string;
    /** Controllo a destra del titolo (es. scelta della modalità). */
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}

/**
 * Form di modifica aperto dentro una sezione dell'editor (attacco, privilegio,
 * oggetto, incantesimo, risorsa). Riquadro un gradino sotto la card con bordo
 * in accento: è l'elemento attivo della sezione. Azioni in fondo, la primaria a destra.
 */
export const InlineForm = ({ title, onSubmit, onCancel, submitLabel = 'Salva', aside, children, className = '' }: InlineFormProps) => (
    <form onSubmit={onSubmit} className={`animate-fadeIn rounded-2xl bg-background/50 ring-1 ring-accent/50 p-4 sm:p-5 ${className}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <h4 className="font-cinzel text-title font-bold text-foreground">{title}</h4>
            <span aria-hidden className="hidden h-px flex-1 bg-border sm:block" />
            {aside}
        </div>
        <div className="space-y-4">{children}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onCancel}>Annulla</Button>
            <Button type="submit">{submitLabel}</Button>
        </div>
    </form>
);

interface RowActionsProps {
    /** Nome della voce, per i lettori di schermo. */
    name: string;
    onEdit?: () => void;
    onDelete: () => void;
    disabled?: boolean;
}

/** Modifica ed elimina di una riga, con conferma sul posto prima di eliminare. */
export const RowActions = ({ name, onEdit, onDelete, disabled }: RowActionsProps) => {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Eliminare ${name}?`}>
                <span className="text-xs font-semibold text-destructive">Eliminare?</span>
                <Button variant="destructive" size="icon" aria-label="Conferma eliminazione" onClick={() => { setConfirming(false); onDelete(); }}>
                    <CheckIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Annulla eliminazione" onClick={() => setConfirming(false)}>
                    <XMarkIcon className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex shrink-0 items-center">
            {onEdit && (
                <Button variant="ghost" size="icon" aria-label={`Modifica ${name}`} title="Modifica" disabled={disabled} onClick={onEdit}>
                    <EditIcon className="h-4 w-4" />
                </Button>
            )}
            <Button variant="ghost" size="icon" aria-label={`Elimina ${name}`} title="Elimina" disabled={disabled} onClick={() => setConfirming(true)} className="hover:text-destructive">
                <TrashIcon className="h-4 w-4" />
            </Button>
        </div>
    );
};
