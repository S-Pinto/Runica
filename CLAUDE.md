# Runica — guida per Claude

PWA per gestire schede personaggio di D&D 5e (regole 2024): creazione/modifica, vista di gioco al tavolo, compagni, incantesimi, inventario, stampa/PDF e generazione della personalità con Gemini.
UI e commenti in italiano; i dati salvati usano chiavi inglesi (vedi `src/lib/labels.ts`).

## Comandi

```bash
npm run dev              # Vite in locale
npm run build            # build (mode di default)
npm run build:staging    # build con .env.staging
npm run build:live       # build con .env.production
npm run typecheck        # type-check di frontend e functions/
npm test                 # Vitest (una esecuzione); npm run test:watch per il watch
```

CI: `.github/workflows/ci.yml` (su PR e push su `main`) esegue type-check frontend + `functions/`, test Vitest e build. I workflow `firebase-hosting-*` si occupano solo di build e deploy.

Deploy: GitHub Actions su merge (`.github/workflows/`), oppure `npm run deploy:live` / `deploy:staging`. Dettagli in `DEPLOYMENT_GUIDE.md`. I test (Vitest, ambiente `node`, file `*.test.ts` accanto al codice) coprono `rules/` (progression, rest, combat, characterData).

## Stack

- **Frontend**: React 19, TypeScript 5, Vite 5, React Router 6 (`createBrowserRouter`)
- **Stile**: Tailwind 3 + `@tailwindcss/forms`, token colore come variabili CSS RGB in `src/index.css`, 13 temi (`theme-*`) gestiti da `ThemeProvider`
- **Animazioni**: framer-motion + keyframe Tailwind (`fadeIn`, `popIn`)
- **Drag & drop**: `@dnd-kit` (ordinamento personaggi)
- **Immagini**: `react-cropper`, `browser-image-compression`
- **Backend**: Firebase 11 — Auth (Google), Firestore, Storage, Cloud Functions (`functions/`)
- **PWA**: `vite-plugin-pwa` (autoUpdate); nome e icone dipendono dalle variabili `VITE_*` del mode
- **Hosting**: Firebase Hosting, target `live` e `staging` (`.firebaserc`)

## Architettura

### Albero dei provider (`src/main.tsx`)

```
ThemeProvider            tema salvato nel browser ('app-theme')
└─ AuthProvider          utente Firebase, login Google
   ├─ RouterProvider
   └─ DialogHost         toast / confirmDialog / alertDialog globali
```

`CharacterProvider` **non** è globale: avvolge solo le rotte dei personaggi tramite `CharacterLayout` in `src/routes/index.tsx`. Si usa con `useCharacter()`.

### Rotte (`src/routes/index.tsx`)

| Percorso | Componente | Layout |
|---|---|---|
| `/character/:characterId/print` | `PrintableCharacterSheet` | fuori da `App` e da `CharacterProvider` |
| `/` | `CharacterList` | `App` → `CharacterLayout` |
| `/character/new` | `CharacterSheet` | `App` → `CharacterLayout` |
| `/character/:characterId/edit` | `CharacterSheet` | `App` → `CharacterLayout` |
| `/character/:characterId` | `PlayView` | `App` → `CharacterLayout` |
| `/login`, `/account` | `LoginPage`, `AccountPage` | `App` |
| `*` | `NotFound` | `App` (`errorElement`: `ErrorBoundary`) |

`App.tsx` è il layout: `AppHeader` + `<Outlet/>` + `SettingsModal`. Non esiste una protezione centrale delle rotte: senza login l'app lavora in modalità locale.

### Cartelle

```
src/
  main.tsx, App.tsx, index.css
  routes/            definizione del router
  providers/         AuthProvider, ThemeProvider
  features/
    auth/            LoginPage, AccountPage
    character/       dominio principale
      CharacterProvider.tsx, CharacterList.tsx, CharacterSheet.tsx, PlayView.tsx
      characterRepository.ts  Firestore / localStorage + migrazione locale→cloud (solo I/O)
      migrationActions.ts     dialoghi di conferma/toast della migrazione (UI)
      characterTypes.ts     ICharacter e tipi collegati
      rules/                regole pure: progression, rest, combat, defaults, characterData
      utils/
      components/           editor e card (armi, equip., incantesimi, compagni…)
        play-view/          schede e tracker della vista di gioco
        print/              scheda stampabile
        ui/                 input e box specifici del dominio
  components/
    layout/AppHeader.tsx, SettingsModal.tsx, ErrorBoundary.tsx
    ui/              kit condiviso (Button, Dialogs, Menu, TabButton, card, icons)
  services/          authService, storageService, geminiService, campaignService
  api/               characterApi (chiamata PDF)
  data/              tabelle statiche (condizioni, proprietà armi)
  lib/               getFirebase (init + accesso), labels, debounce
  hooks/             useFirebase, useIsTouchDevice
functions/src/
  index.ts           esporta callGemini, generateCharacterPDF
  handlers/          geminiHandler (v2, europe-west1), pdfHandler (v1, Puppeteer)
```

### Dati

- **Firestore**: `users/{uid}/characters/{characterId}`; le regole permettono accesso solo al proprietario.
- **Storage**: `users/{uid}/profile.jpg`, `users/{uid}/character-portraits/{id}`, `users/{uid}/characters/{id}/companions/{cid}/portrait.jpg`, `.../items/{itemId}/image.jpg`. Lettura pubblica, scrittura solo del proprietario con limiti di dimensione.
- **Browser (localStorage)**: personaggi in modalità offline/senza login, campagne (`campaignService`, solo locale), tema.
- Quando si legge un documento si fa merge con `createNewCharacter()` per riempire i campi mancanti: aggiungere un campo a `ICharacter` richiede un default lì.

## Convenzioni

### Componenti

- Export **nominati** (`export const Nome = (...) => ...`); `default` solo per `App` e pochi casi storici. Un componente per file, file in PascalCase.
- Le pagine stanno in `features/<area>/`; i pezzi riusabili solo nel dominio in `features/<area>/components/`; quelli generici in `src/components/ui/`.
- Prima di creare un componente UI, controllare `src/components/ui/` (`Button` con `forwardRef`, `Menu`, `TabButton`, `Dialogs`, card, `icons.tsx`).
- Conferme e notifiche: `confirmDialog`, `alertDialog`, `toast` da `components/ui/Dialogs`. Mai `window.confirm`/`alert`.
- Icone: aggiungerle in `components/ui/icons.tsx` (SVG inline con `IconProps`), niente librerie di icone.

### Stile

- Solo classi Tailwind con i token del tema: `bg-background`, `bg-card`, `border-border`, `bg-input`, `text-text`, `text-text-muted`, `accent`, `destructive`, `success`, `warning`. **Niente colori hard-coded** (`zinc-800`, `#hex`): rompono i temi.
- Un nuovo token va aggiunto in tutti i blocchi `theme-*` di `src/index.css` e in `tailwind.config.js`.
- Font: `font-norse` per i titoli, `font-cinzel` per gli accenti, `font-sans` (Inter) per il testo.
- Input numerici: classe `no-spinner`.

### Logica e dati

- Regole di gioco come **funzioni pure** in `features/character/rules/`; i valori derivati devono rispettare gli override manuali in `character.automation.*`.
- Accesso a Firebase tramite `getFirebase()` / i service, non importando `firebaseConfig` nei componenti.
- Testo mostrato all'utente: etichette italiane da `lib/labels.ts`; nei dati restano le chiavi inglesi.
- Funzioni cloud: nuove funzioni in v2 (`firebase-functions/v2/https`), regione `europe-west1`, controllo `request.auth` obbligatorio, segreti con `secrets: [...]`.
- Tipi: evitare `any` nel codice nuovo (oggi ce ne sono ~80).

## Problemi noti

1. `pdfHandler` (v1) non controlla l'autenticazione e usa la regione predefinita; il client collega l'emulatore a ogni chiamata su `localhost`.
2. Pagina di stampa fuori da `CharacterProvider`: con caricamento diretto, se l'auth non è pronta, `getCharacter` ripiega sulla copia locale.
3. Persistenza su tre livelli (Firestore, localStorage, migrazione) senza regole di conflitto.
4. Campagne solo locali: "unisciti con codice" non funziona tra dispositivi.
5. Immagini Storage leggibili da chiunque.
6. ~~`characterService` mescolava I/O, regole e UI~~ — risolto nella Fase D.
7. File molto grandi: `CharacterSheet` (~850 righe), `EquipmentList` (~750), `PrintableCharacterSheet` (~660), `CombatTabView` (~535).
8. ~~Residui~~ — risolti nella Fase C (file inutilizzati rimossi, `firebaseConfig` unito in `getFirebase`, refuso e classe mancante corretti, README riscritto).
9. Copertura test limitata a `rules/` (il repository Firebase non è testato). Nessun ESLint.

## Roadmap del refactor

Ogni fase è indipendente: si può fare in qualsiasi ordine, con un branch e una PR propri. Ogni PR deve passare `npx tsc --noEmit` e `npm run build`.

### Fase A — Sicurezza backend
- `pdfHandler` → v2 `onCall`, regione `europe-west1`, controllo `request.auth`, tipizzare l'input.
- Client: regione esplicita in `characterApi.ts`; emulatore collegato una sola volta e solo con flag esplicito.
- Rivedere la lettura pubblica in `storage.rules` (almeno ritratti e oggetti).
- **Fatto quando**: una chiamata non autenticata al PDF riceve `unauthenticated`.

### Fase B — Rete di sicurezza (CI e qualità) — fatta
- `ci.yml` con `tsc --noEmit` (frontend e `functions/`), Vitest e build.
- Primi test su `rules/progression.ts` e `rules/rest.ts`.
- Rimasto: ESLint (rimandato), branch protection su `main` con `ci` come check obbligatorio (impostazione GitHub).
- **Fatto quando**: la CI fallisce su errori di tipo o test rotti.

### Fase C — Pulizia — fatta
- Rimossi i residui del punto 8, unificati `firebaseConfig`/`getFirebase`, corretti refuso e classe mancante, riscritto il README.
- Sostituiti i colori Tailwind fissi nei componenti con i token del tema (viola/blu/ciano/indaco → `accent`, giallo/arancio → `warning`, verde → `success`, rosso/rosa → `destructive`). Restano volutamente: i riquadri colore di `SettingsModal` (anteprime dei temi), gli overlay `bg-black/*` dei dialoghi e le icone SVG di Google.
- `CATEGORY_CONFIG` usa ora `accent` per tutte le categorie (le classi dinamiche `text-${color}` non venivano generate da Tailwind).
- **Fatto quando**: nessun file inutilizzato e build invariata.

### Fase D — Separazione del servizio personaggi — fatta
- Dividere `characterService.ts` in: repository (Firestore/locale), calcoli (in `rules/`), e azioni UI (dialoghi spostati nei componenti o nel provider).
- Eliminare la dipendenza `AuthProvider` → `characterService` (es. migrazione attivata da `CharacterProvider` al cambio utente).
- Fatto: `characterService.ts` eliminato; `rules/combat.ts`, `rules/defaults.ts`, `rules/characterData.ts` (pure, con test), `characterRepository.ts` (I/O) e `migrationActions.ts` (UI). La migrazione parte da `CharacterProvider` al login (quindi sulle rotte personaggio), `AuthProvider` non importa più nulla dal dominio. Eliminati gli `any` del servizio.
- **Fatto quando**: `rules/` e il repository non importano nulla da `components/`.

### Fase E — Affidabilità auth e dati
- Esporre `authReady` da `AuthProvider` e attenderlo prima di leggere i dati (risolve il punto 2).
- Portare la pagina di stampa dentro il contesto dei personaggi o farle attendere l'auth.
- Definire la strategia offline (Firestore con cache persistente vs localStorage) e una regola di conflitto chiara per la migrazione.
- Decidere se le rotte personaggio richiedono login; se sì, aggiungere una route protetta.

### Fase F — Scomposizione dei componenti grandi
- Spezzare `CharacterSheet`, `EquipmentList`, `PrintableCharacterSheet`, `CombatTabView` in sezioni con stato locale minimo.
- Scegliere un'unica strada per la stampa (HTML del client o PDF del server) ed eliminare il doppione di layout.
- **Fatto quando**: nessun componente sopra ~300 righe; comportamento invariato.

### Fase G — Campagne condivise (funzionale)
- Spostare le campagne su Firestore (collezione top-level con membri), regole di accesso per i membri, unione via codice.
- **Fatto quando**: due utenti diversi vedono la stessa campagna.

Dipendenze consigliate, non obbligatorie: B prima di D/F rende il refactor più sicuro; D semplifica E.
