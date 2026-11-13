/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Gli stili hover: valgono solo dove esiste un puntatore: sul telefono
  // non restano "accesi" dopo il tocco.
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        popIn: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Pannelli ancorati in basso su mobile.
        sheetIn: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn var(--dur-fast) ease-out both',
        popIn: 'popIn var(--dur-base) var(--ease-out) both',
        sheetIn: 'sheetIn var(--dur-slow) var(--ease-out) both',
      },
      transitionTimingFunction: {
        soft: 'var(--ease-out)',
      },
      fontFamily: {
        norse: ['Norse', 'serif'],
        sans: ['Inter', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', '"Roboto Mono"', '"Liberation Mono"', 'monospace'],
      },
      // Ruoli tipografici (vedi DESIGN.md): text-headline, text-title, text-label, text-numeric.
      fontSize: {
        headline: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],
        title: ['1.125rem', { lineHeight: '1.625rem', fontWeight: '400' }],
        label: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.08em', fontWeight: '600' }],
        numeric: ['1.875rem', { lineHeight: '1', fontWeight: '700' }],
      },
      spacing: {
        // Altezza della barra superiore (tacca inclusa): h-header, top-header.
        header: 'var(--header-offset)',
      },
      zIndex: {
        header: '50',
        modal: '100',
        // Conferme e avvisi: sopra le finestre che li aprono.
        dialog: '105',
        toast: '110',
      },
      boxShadow: {
        rest: 'var(--shadow-rest)',
        raised: 'var(--shadow-raised)',
        floating: 'var(--shadow-floating)',
        glow: 'var(--shadow-glow)',
      },
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          // Contorno dei controlli: almeno 3:1 sulla card.
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
        input: 'rgb(var(--color-input) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-dark': 'rgb(var(--color-accent-dark) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        // Velo dietro finestre e pannelli.
        scrim: 'rgb(var(--color-scrim) / <alpha-value>)',
        // Aliases used across the components (shadcn-style names).
        'accent-light': 'rgb(var(--color-accent) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--color-input) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          foreground: 'rgb(var(--color-destructive-foreground) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        ring: 'rgb(var(--color-accent) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-text) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
