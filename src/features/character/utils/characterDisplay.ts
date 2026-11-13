/** Iniziali (al massimo due) per il segnaposto del ritratto. */
export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

/** Percentuale dei punti vita rimasti (0–100); con massimo a zero la barra è piena. */
export const hpPercent = (current: number, max: number): number =>
  max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 100;

/** Colore della barra dei punti vita: verde sopra metà, arancio fino a un quarto, rosso sotto. */
export const hpBarTone = (percent: number): string =>
  percent > 50 ? 'bg-success' : percent > 25 ? 'bg-warning' : 'bg-destructive';
