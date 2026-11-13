import { ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCharacter } from '../../characterRepository';
import { ICharacter } from '../../characterTypes';
import { SharedStyles } from './printStyles';
import { PrintPageCore } from './PrintPageCore';
import { PrintPageSpells } from './PrintPageSpells';
import { PrintPageCampaignNotes, PrintPageNotes, PrintPageSpellsContinuation } from './PrintPageOverflow';
import { PrintPageCompanion } from './PrintPageCompanion';
import { PrintToolbar } from './PrintToolbar';
import {
    EQUIPMENT_ROWS_PAGE2, SPELL_ROWS_CONTINUATION, SPELL_ROWS_PAGE2, STORY_CHARS_PAGE2,
    getPrintSpells, getStoryText, splitChunks,
} from './printUtils';
import { PrintPreferences, characterHasSpells, fitZoom, loadPrintPreferences, savePrintPreferences } from './printOptions';

interface SheetPage {
    key: string;
    label: string;
    node: ReactNode;
}

/**
 * Larghezza visibile dell'area di anteprima (serve allo zoom "adatta").
 * Si misura il contenitore e non window.innerWidth, che include la barra di scorrimento verticale
 * e farebbe uscire il foglio di qualche pixel a destra.
 */
const useContainerWidth = (ref: RefObject<HTMLElement | null>, ready: boolean) => {
    const [width, setWidth] = useState(() => document.documentElement.clientWidth);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => setWidth(el.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, ready]);
    return width;
};

/** Scheda stampabile: 2 pagine A4 standard, più continuazioni e compagni solo se servono. */
export const PrintableCharacterSheet = () => {
    const { characterId } = useParams();
    const navigate = useNavigate();
    const [character, setCharacter] = useState<ICharacter | null>(null);
    const [failed, setFailed] = useState(false);
    const [prefs, setPrefs] = useState<PrintPreferences>(loadPrintPreferences);
    /** null = automatico (dipende dal personaggio). */
    const [spellsOverride, setSpellsOverride] = useState<boolean | null>(null);
    const [notesOverride, setNotesOverride] = useState<boolean | null>(null);
    const [showCompanions, setShowCompanions] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewportWidth = useContainerWidth(scrollRef, !!character);

    useEffect(() => {
        if (!characterId) return;
        getCharacter(characterId).then((c) => (c ? setCharacter(c) : setFailed(true))).catch((error) => {
            console.error('Failed to load character for print', error);
            setFailed(true);
        });
    }, [characterId]);

    useEffect(() => {
        if (!character?.name) return;
        const previous = document.title;
        document.title = `${character.name} – scheda`;
        return () => { document.title = previous; };
    }, [character?.name]);

    useEffect(() => savePrintPreferences(prefs), [prefs]);
    const updatePrefs = (patch: Partial<PrintPreferences>) => setPrefs((prev) => ({ ...prev, ...patch }));

    const printSpells = useMemo(() => (character ? getPrintSpells(character) : []), [character]);
    const hasSpells = character ? characterHasSpells(character.spellcastingAbility, printSpells.length) : true;
    /** Inserisce gli incantesimi della scheda (altrimenti la sezione resta da compilare a mano). */
    const showSpells = spellsOverride ?? hasSpells;
    /** Riquadro note di campagna: al posto della sezione incantesimi se questi sono esclusi, altrimenti in una pagina propria. */
    const showCampaignNotes = notesOverride ?? !hasSpells;
    const notesColumn = showCampaignNotes && !showSpells;
    const filled = prefs.values === 'filled';
    const scale = prefs.zoom === 'fit' ? fitZoom(viewportWidth) : prefs.zoom;

    const pages = useMemo<SheetPage[]>(() => {
        if (!character) return [];
        const spellChunks = showSpells
            ? splitChunks(printSpells, SPELL_ROWS_PAGE2, SPELL_ROWS_CONTINUATION).slice(1).filter((c) => c.length > 0)
            : [];
        const showEquipment = (character.equipment?.length || 0) > EQUIPMENT_ROWS_PAGE2;
        const showStory = getStoryText(character).length > STORY_CHARS_PAGE2;
        const showNotes = showEquipment || showStory || !!character.notes?.trim();
        return [
            { key: 'core', label: 'Personaggio e combattimento', node: <PrintPageCore character={character} filled={filled} /> },
            { key: 'spells', label: notesColumn ? 'Note e inventario' : 'Incantesimi e inventario', node: <PrintPageSpells character={character} filled={filled} insertSpells={showSpells} notesColumn={notesColumn} /> },
            ...spellChunks.map((chunk, i) => ({
                key: `spells-${i}`, label: 'Incantesimi (seguito)',
                node: <PrintPageSpellsContinuation character={character} spells={chunk} part={i + 1} />,
            })),
            ...(showCampaignNotes && !notesColumn ? [{ key: 'campaign-notes', label: 'Note di campagna', node: <PrintPageCampaignNotes character={character} /> }] : []),
            ...(showNotes ? [{ key: 'notes', label: 'Continuazione', node: <PrintPageNotes character={character} showEquipment={showEquipment} showStory={showStory} /> }] : []),
            ...(showCompanions ? (character.companions || []).map((comp) => ({
                key: `comp-${comp.id}`, label: `Compagno · ${comp.name || 'senza nome'}`,
                node: <PrintPageCompanion companion={comp} ownerName={character.name} filled={filled} />,
            })) : []),
        ];
    }, [character, printSpells, showSpells, showCampaignNotes, notesColumn, showCompanions, filled]);

    /** Aperta in una nuova scheda: la chiude; aperta nella stessa finestra (PWA, popup bloccato): torna al personaggio. */
    const handleClose = () => {
        if (window.opener) window.close();
        else navigate(characterId ? `/character/${characterId}` : '/');
    };

    if (failed) return <div className="p-6 text-text">Impossibile caricare il personaggio.</div>;
    if (!character) return <div className="p-6 text-muted-foreground">Caricamento…</div>;

    return (
        <div className="dnd-sheet-wrapper min-h-screen" data-paper={prefs.paper}>
            <SharedStyles />
            <PrintToolbar
                name={character.name}
                pageCount={pages.length}
                prefs={prefs}
                onPrefsChange={updatePrefs}
                scale={scale}
                showSpells={showSpells}
                onShowSpellsChange={setSpellsOverride}
                showNotes={showCampaignNotes}
                onShowNotesChange={setNotesOverride}
                showCompanions={character.companions?.length ? showCompanions : null}
                onShowCompanionsChange={setShowCompanions}
                onClose={handleClose}
            />
            <div className="sheet-scroll" ref={scrollRef}>
                <main className="sheet-stack" style={{ zoom: scale }}>
                    {pages.map((page, i) => (
                        <div key={page.key} className="page-frame">
                            {/* Lo zoom inverso tiene l'etichetta leggibile a qualunque scala del foglio. */}
                            <div className="flex items-baseline justify-between gap-3 px-1 print:hidden" style={{ zoom: 1 / scale }}>
                                <span className="font-cinzel text-sm font-bold tracking-wide text-foreground">{page.label}</span>
                                <span className="font-mono text-xs tabular-nums text-muted-foreground">{i + 1} / {pages.length}</span>
                            </div>
                            {page.node}
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
};
