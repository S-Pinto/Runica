import { defineConfig } from 'vitest/config';

// Config separata da vite.config.ts: i test delle regole pure non hanno bisogno
// di plugin React/PWA né delle variabili d'ambiente VITE_*.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
