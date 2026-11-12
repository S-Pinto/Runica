import { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';

const THEME_IDS = [
  'theme-amber',
  'theme-sapphire',
  'theme-twilight',
  'theme-evergreen',
  'theme-crimson',
  'theme-rose',
  'theme-veridian',
  'theme-obsidian',
  'theme-solaris',
  'theme-aether',
  'theme-grove',
  'theme-celestial', // New Light Theme
  'theme-nocturne',   // New Dark Theme
] as const;

type Theme = typeof THEME_IDS[number];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('app-theme');
    return (storedTheme as Theme) || 'theme-amber'; // Tema di default
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...THEME_IDS);
    root.classList.add(theme);
    localStorage.setItem('app-theme', theme);

    // Update the <meta name="theme-color"> tag to match the current theme's accent color.
    // This ensures the PWA's status bar color changes dynamically with the theme.
    const rootStyle = getComputedStyle(root);
    const accentColor = rootStyle.getPropertyValue('--color-accent').trim();

    // The CSS variable is a string of numbers "r g b". Let's convert it to a hex color.
    const toHex = (c: number): string => {
      const hex = c.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    };

    const [r, g, b] = accentColor.replace(/,/g, ' ').split(/\s+/).map(Number);
    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', hexColor);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};