import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';

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