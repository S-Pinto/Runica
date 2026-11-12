# Runica

PWA per gestire schede personaggio di D&D 5e (regole 2024): creazione e modifica, vista di gioco al tavolo, compagni, incantesimi, inventario, stampa/PDF e generazione della personalità con Gemini.

Stack: React 19, TypeScript, Vite, Tailwind, Firebase (Auth, Firestore, Storage, Cloud Functions).

## Sviluppo

```bash
npm install
npm run dev          # server Vite in locale
npm run typecheck    # type-check di frontend e functions/
npm test             # test Vitest
npm run build        # build di produzione
```

Senza variabili `VITE_FIREBASE_*` l'app funziona in modalità locale (dati nel browser). Per il cloud copia le variabili del progetto in `.env.local`.

## Documentazione

- `CLAUDE.md` — architettura, convenzioni, problemi noti e roadmap del refactor
- `DESIGN.md` — design system e token dei temi
- `PRODUCT.md` — visione di prodotto
- `DEPLOYMENT_GUIDE.md` — build e deploy su Firebase Hosting
