import { ReactNode, useId, useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, MinusIcon, PlusIcon, PrinterIcon, RuneMarkIcon, SettingsIcon } from '../../../../components/ui/icons';
import { PaperStyle, PrintPreferences, ValuesMode, stepZoom } from './printOptions';

const PAPER_OPTIONS = [
    { value: 'ink', label: 'Inchiostro' },
    { value: 'grimoire', label: 'Grimorio' },
    { value: 'contrast', label: 'Alto contrasto' },
] as const satisfies readonly { value: PaperStyle; label: string }[];

const VALUE_OPTIONS = [
    { value: 'filled', label: 'Compilata' },
    { value: 'blank', label: 'A matita' },
] as const satisfies readonly { value: ValuesMode; label: string }[];

const OptionGroup = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
    <div className="flex shrink-0 flex-col gap-1" title={hint}>
        <span className="text-label uppercase text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">{children}</div>
    </div>
);

/** Interruttore a pillola per includere o escludere un gruppo di pagine. */
const PageToggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) => (
    <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(!on)}
        className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] ${
            on ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/40' : 'border border-border-strong/60 bg-background/40 text-muted-foreground hover:text-foreground'
        }`}
    >
        <CheckIcon className={`h-4 w-4 transition-opacity duration-150 ${on ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
        {label}
    </button>
);

interface PrintToolbarProps {
    name: string;
    pageCount: number;
    prefs: PrintPreferences;
    /** Riceve solo i campi cambiati: il genitore li unisce allo stato corrente. */
    onPrefsChange: (patch: Partial<PrintPreferences>) => void;
    /** Scala effettiva dell'anteprima (anche quando lo zoom è "adatta"). */
    scale: number;
    showSpells: boolean;
    onShowSpellsChange: (on: boolean) => void;
    showNotes: boolean;
    onShowNotesChange: (on: boolean) => void;
    /** null se il personaggio non ha compagni (l'interruttore non compare). */
    showCompanions: boolean | null;
    onShowCompanionsChange: (on: boolean) => void;
    onClose: () => void;
}

/** Barra dell'anteprima di stampa: vetro sticky come l'header dell'app, scompare in stampa. */
export const PrintToolbar = ({
    name, pageCount, prefs, onPrefsChange, scale, showSpells, onShowSpellsChange, showNotes, onShowNotesChange, showCompanions, onShowCompanionsChange, onClose,
}: PrintToolbarProps) => {
    const set = <K extends keyof PrintPreferences>(key: K, value: PrintPreferences[K]) => onPrefsChange({ [key]: value });
    const percent = `${Math.round(scale * 100)}%`;
    /** Sotto lg le opzioni stanno dietro il pulsante "Opzioni"; da lg sono sempre aperte. */
    const [optionsOpen, setOptionsOpen] = useState(false);
    const panelId = useId();

    return (
        <header className="sticky top-0 z-header border-b border-border bg-background/85 backdrop-blur-md print:hidden">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
                <Button variant="ghost" size="icon-lg" onClick={onClose} aria-label="Torna al personaggio" title="Torna al personaggio">
                    <ArrowLeftIcon className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 whitespace-nowrap text-label uppercase text-muted-foreground">
                        <RuneMarkIcon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                        <span className="truncate"><span className="hidden sm:inline">Anteprima di stampa · </span>{pageCount} {pageCount === 1 ? 'pagina' : 'pagine'} A4</span>
                    </p>
                    <h1 className="truncate font-cinzel text-lg font-bold leading-tight text-foreground">{name || 'Scheda personaggio'}</h1>
                </div>
                <Button
                    variant="secondary"
                    className="lg:hidden"
                    aria-expanded={optionsOpen}
                    aria-controls={panelId}
                    aria-label="Opzioni di stampa"
                    onClick={() => setOptionsOpen((o) => !o)}
                >
                    <SettingsIcon className="h-5 w-5" aria-hidden />
                    <span className="hidden sm:inline">Opzioni</span>
                    <ChevronDownIcon className={`hidden h-4 w-4 transition-transform duration-150 sm:block ${optionsOpen ? 'rotate-180' : ''}`} aria-hidden />
                </Button>
                <Button onClick={() => window.print()} aria-label="Stampa o salva PDF" title='Nella finestra di stampa scegli "Salva come PDF" per esportarla' className="max-sm:w-11 max-sm:px-0">
                    <PrinterIcon className="h-5 w-5" aria-hidden />
                    <span className="hidden sm:inline">Stampa / PDF</span>
                </Button>
            </div>

            <div id={panelId} className={`border-t border-border/60 lg:block ${optionsOpen ? 'block' : 'hidden'}`}>
                {/* I gruppi vanno a capo invece di uscire dalla finestra. */}
                <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-x-5 gap-y-3 px-4 pb-3 pt-2 sm:px-6">
                    <OptionGroup label="Carta" hint="Inchiostro: bianco e nero, risparmia toner. Grimorio: carta calda e filetti seppia, per PDF o stampa a colori. Alto contrasto: solo nero pieno.">
                        <SegmentedControl label="Stile carta" options={PAPER_OPTIONS} value={prefs.paper} onChange={(v) => set('paper', v)} className="w-auto [&>button]:flex-none [&>button]:px-3" />
                    </OptionGroup>
                    <OptionGroup label="Valori" hint="Compilata: PF, dadi vita, slot e usi spesi, ispirazione e monete di adesso. A matita: campi variabili vuoti da aggiornare al tavolo.">
                        <SegmentedControl label="Valori correnti" options={VALUE_OPTIONS} value={prefs.values} onChange={(v) => set('values', v)} className="w-auto [&>button]:flex-none [&>button]:px-3" />
                    </OptionGroup>
                    <OptionGroup label="Contenuto" hint="Incantesimi: riporta quelli della scheda (spenta, la sezione resta da compilare a mano). Note: riquadro per gli appunti di campagna, al posto degli incantesimi se esclusi, altrimenti in una pagina in più.">
                        <PageToggle label="Incantesimi" on={showSpells} onChange={onShowSpellsChange} />
                        <PageToggle label="Note" on={showNotes} onChange={onShowNotesChange} />
                        {showCompanions !== null && <PageToggle label="Compagni" on={showCompanions} onChange={onShowCompanionsChange} />}
                    </OptionGroup>
                    <OptionGroup label="Zoom">
                        <div role="group" aria-label="Zoom anteprima" className="flex items-center rounded-xl border border-border-strong/60 bg-background/40 p-0.5">
                            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Riduci" onClick={() => set('zoom', stepZoom(scale, -1))} disabled={scale <= 0.5}>
                                <MinusIcon className="h-4 w-4" />
                            </Button>
                            <button
                                type="button"
                                onClick={() => set('zoom', 'fit')}
                                aria-pressed={prefs.zoom === 'fit'}
                                title="Adatta alla finestra"
                                className={`h-9 min-w-[4.75rem] rounded-[10px] px-2 font-mono text-sm font-semibold tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    prefs.zoom === 'fit' ? 'bg-accent/15 text-accent' : 'text-foreground hover:text-accent'
                                }`}
                            >
                                {prefs.zoom === 'fit' ? `Adatta` : percent}
                            </button>
                            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Ingrandisci" onClick={() => set('zoom', stepZoom(scale, 1))} disabled={scale >= 1.5}>
                                <PlusIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </OptionGroup>
                </div>
            </div>
        </header>
    );
};
