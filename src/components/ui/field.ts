/**
 * Classi condivise per etichette, campi e gruppi di campi: ricerca, form delle
 * campagne, editor della scheda e finestre di modifica.
 * Il testo dei campi è a 16px: sotto quella misura iOS ingrandisce la pagina al focus.
 */
export const fieldLabelClass = 'mb-1.5 block text-label uppercase text-muted-foreground';

/**
 * Campo senza fondo: lo sceglie chi lo usa (`bg-background` dentro una card o
 * una finestra, `bg-card` direttamente sulla pagina).
 */
export const fieldInputClass =
  'w-full rounded-xl border border-border-strong/60 px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground transition-colors duration-150 hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50';

/** Campo dentro una card o una finestra (input, select, textarea). */
export const fieldControlClass = `${fieldInputClass} bg-background`;

/** Campo per un valore di gioco: cifre tabellari, centrato. */
export const fieldNumericClass = `${fieldControlClass} no-spinner text-center font-mono font-bold`;

/** Riquadro che raggruppa campi affini dentro una card: un gradino sotto, senza ombra. */
export const fieldGroupClass = 'rounded-xl border border-border bg-background/40 p-3 sm:p-4';

/** Titolo di un gruppo di campi. */
export const fieldGroupTitleClass = 'text-label uppercase text-accent';

/** Riga con casella di scelta ed etichetta: bersaglio da 40px. */
export const fieldCheckRowClass = 'flex min-h-10 cursor-pointer select-none items-center gap-2.5 text-sm text-text';

/** Etichetta a pillola per scelte multiple (proprietà, caratteristiche, condizioni). */
export const fieldChipClass = (active: boolean | undefined, tone: 'accent' | 'destructive' = 'accent') =>
  `inline-flex min-h-8 items-center rounded-lg border px-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    active
      ? tone === 'accent'
        ? 'border-accent bg-accent text-accent-foreground'
        : 'border-destructive/60 bg-destructive/15 text-destructive'
      : 'border-border-strong/50 text-muted-foreground hover:border-accent/70 hover:text-foreground'
  }`;
