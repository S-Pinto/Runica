import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICharacter } from '../../characterTypes';
import { SaveIcon, TrashIcon, PrinterIcon, EllipsisVerticalIcon } from '../../../../components/ui/icons';
import { Button, buttonClass } from '../../../../components/ui/Button';
import { Menu, MenuItem } from '../../../../components/ui/Menu';
import { openPrintSheet } from '../../utils/printSheet';
import { HeroHeader } from '../play-view/HeroHeader';
import { playChipClass } from '../play-view/PlaySection';

interface EditorHeaderProps {
    character: ICharacter;
    isNewCharacter: boolean;
    isDirty: boolean;
    isSaving: boolean;
    onBack: () => void;
    onSave: () => void;
    onDelete: () => void;
}

const dirtyChipClass = playChipClass.replace('text-muted-foreground', 'font-semibold text-warning');

/**
 * Intestazione dell'editor: lo stesso header dell'eroe della vista di gioco in
 * versione compatta, con il menu e "Salva" (unico primario pieno della pagina).
 * L'header non è sticky: quando "Salva" esce dallo schermo (o su telefono, dove
 * nell'header non c'è) compare un pulsante flottante in vetro in basso a destra.
 */
export const EditorHeader = ({ character, isNewCharacter, isDirty, isSaving, onBack, onSave, onDelete }: EditorHeaderProps) => {
    const navigate = useNavigate();
    const editorMenu: MenuItem[] = [
        ...(!isNewCharacter ? [{ label: 'Stampa scheda', icon: <PrinterIcon />, onSelect: () => openPrintSheet(character.id, navigate) }] : []),
        { label: isNewCharacter ? 'Scarta personaggio' : 'Elimina personaggio', icon: <TrashIcon />, onSelect: onDelete, destructive: true },
    ];

    // "Salva" dell'header visibile? Su telefono è nascosto (display: none), quindi risulta sempre fuori vista.
    const saveRef = useRef<HTMLButtonElement>(null);
    const [isSaveInView, setIsSaveInView] = useState(true);
    useEffect(() => {
        const el = saveRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        // Il margine superiore esclude l'header fisso dell'app, che coprirebbe il pulsante.
        const observer = new IntersectionObserver(([entry]) => setIsSaveInView(entry.isIntersecting), { rootMargin: '-72px 0px 0px 0px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const saveLabel = isSaving ? 'Salvataggio…' : 'Salva';

    return (
        <>
            <HeroHeader
                compact
                name={character.name || (isNewCharacter ? 'Senza nome' : 'Personaggio')}
                imageUrl={character.imageUrl}
                onBack={onBack}
                backLabel={isNewCharacter ? 'Annulla creazione' : 'Torna alla scheda'}
                subtitle={
                    <span role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{isNewCharacter ? 'Nuovo eroe' : 'Modifica della scheda'}</span>
                        {isDirty && <span className={dirtyChipClass}>Modifiche non salvate</span>}
                    </span>
                }
                actions={<>
                    <Menu
                        label="Altre azioni"
                        trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
                        items={editorMenu}
                        triggerClassName={buttonClass('secondary', 'icon-lg')}
                    />
                    <Button ref={saveRef} onClick={onSave} disabled={isSaving} title="Salva (Ctrl+S)" className="hidden h-11 sm:inline-flex">
                        <SaveIcon className="h-4 w-4" />
                        {saveLabel}
                    </Button>
                </>}
            />

            {!isSaveInView && (
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    title="Salva (Ctrl+S)"
                    aria-label={isDirty ? `${saveLabel} (modifiche non salvate)` : saveLabel}
                    className="glass-pill fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-14 items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-semibold text-text transition-[transform,border-color,color,box-shadow] duration-150 ease-soft animate-popIn hover:border-accent/70 hover:text-accent hover:shadow-glow active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:right-6"
                >
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
                        <SaveIcon className="h-5 w-5" />
                        {isDirty && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rotate-45 rounded-[2px] bg-warning ring-2 ring-card" />}
                    </span>
                    {saveLabel}
                </button>
            )}
        </>
    );
};
