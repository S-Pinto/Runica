import { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { ThemeId, resolveTheme } from '../lib/themes';

const STORAGE_KEY = 'app-theme';

interface ThemeContextType {
  theme: ThemeId;
  /** Accetta anche id di temi rimossi (es. da un vecchio backup): li porta al più vicino. */
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const readStoredTheme = (): ThemeId => {
  try {
    return resolveTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return resolveTheme(null);
  }
};

/** Converte "r g b" (valore di una variabile colore) in #rrggbb. */
const tripletToHex = (triplet: string): string | null => {
  const parts = triplet.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);

  const setTheme = useCallback((next: string) => setThemeState(resolveTheme(next)), []);

  useEffect(() => {
    const root = window.document.documentElement;
    // Rimuove qualsiasi classe tema, comprese quelle dei temi non più esistenti.
    const stale = Array.from(root.classList).filter((c) => c.startsWith('theme-') && c !== theme);
    root.classList.remove(...stale);
    root.classList.add(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Archiviazione non disponibile (es. navigazione privata): il tema vale per la sessione.
    }

    // La barra di stato della PWA prende il colore del fondo, così l'app
    // continua fino al bordo dello schermo invece di staccarsi con una fascia colorata.
    const background = tripletToHex(getComputedStyle(root).getPropertyValue('--color-background'));
    if (!background) return;
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', background);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
