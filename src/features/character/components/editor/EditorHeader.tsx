import { ICharacter } from '../../characterTypes';
import { BackIcon, SaveIcon, TrashIcon, PrinterIcon, EllipsisVerticalIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { Menu, MenuItem } from '../../../../components/ui/Menu';
import { useNavigate } from 'react-router-dom';
import { openPrintSheet } from '../../utils/printSheet';

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
    const navigate = useNavigate();
    const editorMenu: MenuItem[] = [
        ...(!isNewCharacter ? [{ label: 'Stampa scheda', icon: <PrinterIcon />, onSelect: () => openPrintSheet(character.id, navigate) }] : []),
        { label: isNewCharacter ? 'Scarta personaggio' : 'Elimina personaggio', icon: <TrashIcon />, onSelect: onDelete, destructive: true },
    ];

    return (
        // Barra fissa sotto l'header: il contenuto vi scorre sotto, quindi resta in vetro come l'header.
        <header className="sticky top-header z-40 -mx-4 flex items-center gap-2 border-b border-border bg-background/90 px-3 py-2.5 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
            <Button variant="ghost" size="icon-lg" onClick={onBack} aria-label={isNewCharacter ? 'Annulla creazione' : 'Torna alla scheda'}>
                <BackIcon className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
                <h1 className="truncate font-cinzel text-headline text-foreground sm:text-2xl">
                    {character.name || (isNewCharacter ? 'Senza nome' : 'Personaggio')}
                </h1>
                <p className="truncate text-xs text-muted-foreground" role="status">
                    {isNewCharacter ? 'Nuovo eroe' : 'Modifica della scheda'}
                    {isDirty && (
                        <span className="text-warning">
                            {' · '}
                            <span aria-hidden className="mr-1 inline-block h-1.5 w-1.5 rotate-45 bg-warning align-middle" />
                            Modifiche non salvate
                        </span>
                    )}
                </p>
            </div>
            <Menu
                label="Altre azioni"
                trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
                items={editorMenu}
                triggerClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong/60 text-muted-foreground transition-colors duration-150 hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={onSave} disabled={isSaving} title="Salva (Ctrl+S)" className="h-11">
                <SaveIcon className="h-4 w-4" />
                {isSaving ? 'Salvataggio…' : 'Salva'}
            </Button>
        </header>
    );
};
