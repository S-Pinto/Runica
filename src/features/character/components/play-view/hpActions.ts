/** Pulsanti Danno / Cura / Temp dei punti vita: tenui a riposo, pieni in hover. Usati dal personaggio e dai compagni. */
const base = 'flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-40';

export const hpActionClass = {
  damage: `${base} bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:hover:bg-destructive/15 disabled:hover:text-destructive`,
  heal: `${base} bg-success/15 text-success hover:bg-success hover:text-background disabled:hover:bg-success/15 disabled:hover:text-success`,
  temp: `${base} bg-accent/15 text-accent hover:bg-accent hover:text-accent-foreground disabled:hover:bg-accent/15 disabled:hover:text-accent`,
};
