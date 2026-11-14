import { defineConfig } from 'vitest/config';

// Test delle regole di sicurezza con l'emulatore Firestore (`npm run test:rules`).
// Separati da `npm test`: richiedono Java e `firebase emulators:exec`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    // Un solo emulatore condiviso: i file non devono girare in parallelo.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
