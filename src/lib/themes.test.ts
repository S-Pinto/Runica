import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_IDS, resolveTheme } from './themes';

describe('resolveTheme', () => {
  it('mantiene i temi attuali', () => {
    for (const id of THEME_IDS) expect(resolveTheme(id)).toBe(id);
  });

  it('porta i temi rimossi al più vicino', () => {
    expect(resolveTheme('theme-celestial')).toBe('theme-parchment');
    expect(resolveTheme('theme-grove')).toBe('theme-evergreen');
    expect(resolveTheme('theme-nocturne')).toBe('theme-twilight');
    expect(resolveTheme('theme-solaris')).toBe('theme-amber');
  });

  it('ripiega sul predefinito per valori sconosciuti o mancanti', () => {
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
    expect(resolveTheme(undefined)).toBe(DEFAULT_THEME);
    expect(resolveTheme('theme-inesistente')).toBe(DEFAULT_THEME);
    expect(resolveTheme(42)).toBe(DEFAULT_THEME);
  });
});
