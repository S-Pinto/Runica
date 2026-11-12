import { ICharacter } from '../../characterTypes';
import { BackIcon, SaveIcon, TrashIcon, PrinterIcon, EllipsisVerticalIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { Menu, MenuItem } from '../../../../components/ui/Menu';

interface EditorHeaderProps {
    character: ICharacter;
    isNewCharacter: boolean;
    isDirty: boolean;
    isSaving: boolean;
    onBack: () => void;
    onSave: () => void;
    onDelete: () => void;
}

export const EditorHeader = ({ character, isNewCharacter, isDirty, isSaving, onBack, onSave, onDelete }: EditorHeaderProps) => {
    const editorMenu: MenuItem[] = [
        ...(!isNewCharacter ? [{ label: 'Stampa scheda', icon: <PrinterIcon />, onSelect: () => window.open(`/character/${character.id}/print`, '_blank') }] : []),
        { label: isNewCharacter ? 'Scarta personaggio' : 'Elimina personaggio', icon: <TrashIcon />, onSelect: onDelete, destructive: true },
    ];

    return (
        <header className="sticky top-20 z-40 -mx-4 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
            <button
                type="button"
                onClick={onBack}
                aria-label={isNewCharacter ? 'Annulla creazione' : 'Torna alla scheda'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <BackIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isNewCharacter ? 'Nuovo eroe' : 'Modifica scheda'}
                </p>
                <h1 className="truncate font-cinzel text-lg font-bold text-foreground sm:text-xl">
                    {character.name || (isNewCharacter ? 'Senza nome' : 'Personaggio')}
                </h1>
            </div>
            {isDirty && (
                <span className="hidden items-center gap-1.5 text-xs font-medium text-warning sm:flex" role="status">
                    <span className="h-2 w-2 rounded-full bg-warning" /> Modifiche non salvate
                </span>
            )}
            <Menu
                label="Altre azioni"
                trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
                items={editorMenu}
                triggerClassName="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={onSave} disabled={isSaving} title="Salva (Ctrl+S)" className="relative">
                <SaveIcon className="h-4 w-4" />
                {isSaving ? 'Salvataggio…' : 'Salva'}
                {isDirty && !isSaving && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-warning sm:hidden" aria-hidden />}
            </Button>
        </header>
    );
};
