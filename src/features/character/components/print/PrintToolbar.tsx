import type { ReactNode } from 'react';
import { Button } from '../../../../components/ui/Button';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { ArrowLeftIcon, CheckIcon, MinusIcon, PlusIcon, PrinterIcon, RuneMarkIcon } from '../../../../components/ui/icons';
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
    /** null se il personaggio non ha compagni (l'interruttore non compare). */
    showCompanions: boolean | null;
    onShowCompanionsChange: (on: boolean) => void;
    onClose: () => void;
}

/** Barra dell'anteprima di stampa: vetro sticky come l'header dell'app, scompare in stampa. */
export const PrintToolbar = ({
    name, pageCount, prefs, onPrefsChange, scale, showSpells, onShowSpellsChange, showCompanions, onShowCompanionsChange, onClose,
}: PrintToolbarProps) => {
    const set = <K extends keyof PrintPreferences>(key: K, value: PrintPreferences[K]) => onPrefsChange({ [key]: value });
    const percent = `${Math.round(scale * 100)}%`;

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
                <Button onClick={() => window.print()} title='Nella finestra di stampa scegli "Salva come PDF" per esportarla'>
                    <PrinterIcon className="h-5 w-5" aria-hidden />
                    <span>Stampa<span className="hidden sm:inline"> / PDF</span></span>
                </Button>
            </div>

            <div className="border-t border-border/60">
                {/* Su schermi stretti la riga scorre: la dissolvenza a destra segnala che c'è altro. */}
                <div className="no-scrollbar mx-auto flex max-w-7xl items-end gap-5 overflow-x-auto pb-2.5 pl-4 pr-10 pt-2 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:pl-6 lg:pr-6 lg:[mask-image:none]">
                    <OptionGroup label="Carta" hint="Inchiostro: bianco e nero, risparmia toner. Grimorio: carta calda e filetti seppia, per PDF o stampa a colori. Alto contrasto: solo nero pieno.">
                        <SegmentedControl label="Stile carta" options={PAPER_OPTIONS} value={prefs.paper} onChange={(v) => set('paper', v)} className="w-auto [&>button]:flex-none [&>button]:px-3" />
                    </OptionGroup>
                    <OptionGroup label="Valori" hint="Compilata: PF, dadi vita, slot e usi spesi, ispirazione e monete di adesso. A matita: campi variabili vuoti da aggiornare al tavolo.">
                        <SegmentedControl label="Valori correnti" options={VALUE_OPTIONS} value={prefs.values} onChange={(v) => set('values', v)} className="w-auto [&>button]:flex-none [&>button]:px-3" />
                    </OptionGroup>
                    <OptionGroup label="Pagine">
                        <PageToggle label="Incantesimi" on={showSpells} onChange={onShowSpellsChange} />
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
