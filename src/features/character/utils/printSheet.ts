/** Percorso della scheda stampabile di un personaggio. */
export const printSheetPath = (characterId: string) => `/character/${characterId}/print`;

/**
 * Apre la scheda stampabile in una nuova scheda del browser.
 * Se il popup è bloccato o l'app è installata (PWA standalone, dove `window.open` può non aprire nulla),
 * ripiega sulla navigazione nella stessa finestra.
 */
export const openPrintSheet = (characterId: string, navigate: (path: string) => void) => {
    const standalone = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
    const opened = standalone ? null : window.open(printSheetPath(characterId), '_blank');
    if (!opened) navigate(printSheetPath(characterId));
};
