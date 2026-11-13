/**
 * Elenco dei temi dell'app. Ogni id corrisponde a un blocco `.theme-*` in
 * `src/index.css` che ridefinisce gli stessi ruoli colore.
 */
export const THEMES = [
  { id: 'theme-amber', name: 'Ambra', hint: 'Carbone e oro' },
  { id: 'theme-parchment', name: 'Pergamena', hint: 'Chiaro, lapislazzuli' },
  { id: 'theme-obsidian', name: 'Ossidiana', hint: 'Nero puro, argento' },
  { id: 'theme-sapphire', name: 'Zaffiro', hint: 'Abisso e ghiaccio' },
  { id: 'theme-evergreen', name: 'Foresta', hint: 'Verde profondo' },
  { id: 'theme-twilight', name: 'Crepuscolo', hint: 'Indaco e lilla' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'theme-amber';

export const THEME_IDS: readonly ThemeId[] = THEMES.map((t) => t.id);

/**
 * Temi rimossi con la riduzione da 13 a 6: chi ne aveva salvato uno (nel
 * browser o in un backup) passa a quello più vicino.
 */
const LEGACY_THEMES: Record<string, ThemeId> = {
  'theme-solaris': 'theme-amber',
  'theme-crimson': 'theme-amber',
  'theme-celestial': 'theme-parchment',
  'theme-veridian': 'theme-evergreen',
  'theme-grove': 'theme-evergreen',
  'theme-rose': 'theme-twilight',
  'theme-aether': 'theme-twilight',
  'theme-nocturne': 'theme-twilight',
};

const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);

/** Restituisce un tema valido per qualsiasi valore salvato (anche vecchio o corrotto). */
export const resolveTheme = (stored: unknown): ThemeId => {
  if (isThemeId(stored)) return stored;
  if (typeof stored === 'string' && stored in LEGACY_THEMES) return LEGACY_THEMES[stored];
  return DEFAULT_THEME;
};
