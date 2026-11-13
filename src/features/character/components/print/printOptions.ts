// Opzioni della pagina di stampa: stile carta, valori correnti, contenuto e zoom dell'anteprima.
// Stile, valori e zoom restano nel browser (comodità di chi stampa); il contenuto dipende dal personaggio.

export type PaperStyle = 'ink' | 'grimoire' | 'contrast';
export type ValuesMode = 'filled' | 'blank';
/** 'fit' adatta il foglio alla larghezza della finestra; un numero è la scala (1 = 100%). */
export type PreviewZoom = 'fit' | number;

export interface PrintPreferences {
    paper: PaperStyle;
    values: ValuesMode;
    zoom: PreviewZoom;
}

export const DEFAULT_PRINT_PREFERENCES: PrintPreferences = { paper: 'ink', values: 'filled', zoom: 'fit' };

export const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5] as const;

const STORAGE_KEY = 'runica-print-preferences';
const PAPERS: readonly PaperStyle[] = ['ink', 'grimoire', 'contrast'];
const VALUES: readonly ValuesMode[] = ['filled', 'blank'];

/** Ripulisce un valore letto dal browser: ogni campo non valido torna al predefinito. */
export const sanitizePrintPreferences = (raw: unknown): PrintPreferences => {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const zoom = r.zoom === 'fit' || (typeof r.zoom === 'number' && (ZOOM_STEPS as readonly number[]).includes(r.zoom)) ? r.zoom : DEFAULT_PRINT_PREFERENCES.zoom;
    return {
        paper: PAPERS.includes(r.paper as PaperStyle) ? (r.paper as PaperStyle) : DEFAULT_PRINT_PREFERENCES.paper,
        values: VALUES.includes(r.values as ValuesMode) ? (r.values as ValuesMode) : DEFAULT_PRINT_PREFERENCES.values,
        zoom: zoom as PreviewZoom,
    };
};

export const loadPrintPreferences = (): PrintPreferences => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return sanitizePrintPreferences(data ? JSON.parse(data) : null);
    } catch {
        return DEFAULT_PRINT_PREFERENCES;
    }
};

export const savePrintPreferences = (prefs: PrintPreferences) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        /* storage non disponibile (navigazione privata): le scelte valgono solo per questa visita */
    }
};

/** Passo di zoom successivo o precedente rispetto alla scala attuale (anche se è una scala "adatta" fuori dai passi). */
export const stepZoom = (current: number, direction: 1 | -1): number => {
    if (direction === 1) return ZOOM_STEPS.find((z) => z > current + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
    return [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001) ?? ZOOM_STEPS[0];
};

/** Larghezza di un foglio A4 a schermo (210mm a 96 dpi) più il margine laterale dell'anteprima. */
const A4_WIDTH_PX = 793.7;
const STACK_GUTTER_PX = 32;

/** Scala che fa entrare il foglio nella larghezza disponibile, mai oltre il 100%. */
export const fitZoom = (viewportWidth: number) =>
    Math.max(0.3, Math.min(1, (viewportWidth - STACK_GUTTER_PX) / A4_WIDTH_PX));

/** Gli incantesimi si stampano se il personaggio è incantatore o ne ha in elenco, salvo scelta diversa. */
export const characterHasSpells = (spellcastingAbility: string | undefined, spellCount: number) =>
    !!spellcastingAbility || spellCount > 0;
