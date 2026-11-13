/**
 * Classi condivise per etichette e campi di testo (ricerca, form delle campagne).
 * Il fondo lo sceglie chi le usa: `bg-background` dentro una card o una finestra,
 * `bg-card` direttamente sulla pagina.
 * Il testo è a 16px: sotto quella misura iOS ingrandisce la pagina al focus.
 */
export const fieldLabelClass = 'mb-1.5 block text-label uppercase text-muted-foreground';

export const fieldInputClass =
  'w-full rounded-xl border border-border-strong/60 px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground transition-colors duration-150 hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50';
