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
- **Stile**: Tailwind 3 + `@tailwindcss/forms`, token colore come variabili CSS RGB in `src/index.css`, 6 temi (`theme-*`, elenco in `src/lib/themes.ts`) gestiti da `ThemeProvider`
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
   ├─ CampaignProvider   campagne condivise (Firestore) e locali, per l'utente corrente
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
  providers/         AuthProvider, ThemeProvider, CampaignProvider
  features/
    auth/            LoginPage, AccountPage
    character/       dominio principale
      CharacterProvider.tsx, CharacterList.tsx, CharacterSheet.tsx, PlayView.tsx
      characterRepository.ts  Firestore / localStorage + migrazione locale→cloud (solo I/O)
      migrationActions.ts     dialoghi di conferma/toast della migrazione (UI)
      characterTypes.ts     ICharacter e tipi collegati
      hooks/                useCharacterEditor, useFieldChange, useCharacterOrdering, useCharacterActions, usePlayViewAutosave, useDiceMode
      rules/                regole pure: progression, rest, combat, defaults, characterData, equipment
      utils/
      components/           editor e card (armi, equip., incantesimi, compagni…)
        editor/             sezioni dell'editor di CharacterSheet
        equipment/ attacks/ features/ spellbook/ character-list/   parti dei componenti omonimi
        play-view/          schede e tracker della vista di gioco (+ combat/, inventory/)
        print/              scheda stampabile (una pagina per file)
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
- **Storage**: `users/{uid}/profile.jpg`, `users/{uid}/character-portraits/{id}`, `users/{uid}/characters/{id}/companions/{cid}/portrait.jpg`, `.../items/{itemId}/image.jpg`: lettura e scrittura solo del proprietario, con limiti di dimensione. Eccezione: `campaigns/{cid}/portraits/{uid}/{characterId}`, copia del ritratto per i membri della campagna (scrive il proprietario, leggono i membri via `firestore.exists` su `members/{uid}`).
- **Firestore, campagne** (Fase G): `campaigns/{id}` (DM = `ownerUid`, `memberUids`, `inviteCode`), `campaigns/{id}/members/{uid}` (ruolo `dm`/`player`), `campaigns/{id}/sharedCharacters/{characterId}` (riepilogo pubblicato dal proprietario, mai la scheda intera), `campaignInvites/{codice}` (codice → campagna, leggibile con `get`, mai `list`). L'unione richiede un `members/{uid}` con `joinCode` valido nello stesso batch dell'aggiornamento di `memberUids`.
- **Browser (localStorage)**: personaggi in modalità offline/senza login, campagne locali storiche e quelle create senza login (`campaignService`, `ILocalCampaign`, condivisibili dopo il login), tema.
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
2. ~~Pagina di stampa fuori da `CharacterProvider` e auth non pronta~~ — risolto nella Fase E (`AuthProvider` blocca il render finché l'auth è risolta).
3. Persistenza su tre livelli (Firestore, localStorage, migrazione): regola di conflitto definita nella Fase E (vince `lastUpdated` più recente), ma nessun merge campo per campo.
4. ~~Campagne solo locali~~ — risolto nella Fase G (campagne su Firestore con DM, giocatori e codice d'invito).
5. Immagini Storage: le regole sono solo-proprietario, ma gli URL di download contengono un token e funzionano per chiunque li abbia (anche quello del ritratto condiviso in campagna).
6. ~~`characterService` mescolava I/O, regole e UI~~ — risolto nella Fase D.
7. ~~File molto grandi~~ — risolto nella Fase F (nessun componente sopra ~300 righe; restano `icons.tsx`, un elenco di icone, e `characterTypes.ts`, solo tipi).
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

### Fase E — Affidabilità auth e dati — fatta
- `AuthProvider` espone `authReady` e non renderizza i figli finché lo stato di login non è noto (quindi anche la pagina di stampa, fuori da `CharacterProvider`, legge i dati solo ad auth risolta: punto 2 risolto). Un `getIdToken()` fallito offline non blocca più l'avvio; errore del listener = utente non loggato.
- Strategia offline: Firestore con cache persistente multi-scheda (`getFirebase`, con ripiego su cache in memoria); le scritture usano `settleOrQueue` (timeout 6 s: offline il dato è in cache e si sincronizza al ritorno della rete). localStorage resta solo per la modalità senza login.
- Regola di conflitto della migrazione: vince la copia con `lastUpdated` più recente (`selectCharactersToMigrate`); se il cloud è irraggiungibile la migrazione fallisce senza toccare i dati locali. Proposta di migrazione una volta per utente e sessione (`createKeyedGuard`), riproponibile solo dopo un errore.
- `CharacterProvider`: errore del listener esposto come `loadError` (la lista non resta più in caricamento infinito), reset dei dati al cambio utente, rollback degli aggiornamenti ottimistici se il salvataggio fallisce.
- Errori di rete/permessi tradotti in messaggi italiani (`lib/errors.ts`); login con popup chiuso/bloccato/offline gestito; autosave di `PlayView` con avviso unico e salvataggio finale all'uscita dalla pagina; niente più rejection non gestite in lista, scheda e stampa.
- Test: `lib/async.test.ts`, `lib/errors.test.ts`.
- Non fatto: le rotte personaggio restano accessibili senza login (modalità locale voluta), quindi nessuna route protetta; nessun test del repository/provider (richiederebbe mock di Firebase).
- **Fatto quando**: caricamento, salvataggio e login non restano bloccati né falliscono in silenzio senza rete.

### Fase F — Scomposizione dei componenti grandi — fatta
- Spezzare `CharacterSheet`, `EquipmentList`, `PrintableCharacterSheet`, `CombatTabView` in sezioni con stato locale minimo.
- Scegliere un'unica strada per la stampa (HTML del client o PDF del server) ed eliminare il doppione di layout.
- Fatto: `CharacterSheet` (851→~145 righe) con `hooks/useCharacterEditor`, `hooks/useFieldChange` e le sezioni in `components/editor/`; `EquipmentList` con `components/equipment/` (form a sezioni, elenco, monete); `PrintableCharacterSheet` in pagine (`PrintPageCore/Spells/Inventory/Companion`) più `printStyles` e `printUtils`; `CombatTabView` con `play-view/combat/` e `useAttackRolls`; `AttackList` (`attacks/`), `CategorizedFeatureList` (`features/`), `Spellbook` (`spellbook/`), `InventoryTabView` (`play-view/inventory/`), `CharacterList` (`character-list/`, `useCharacterOrdering`, `useCharacterActions`) e `PlayView` (`usePlayViewAutosave`, `useDiceMode`). La logica di equipaggiamento duplicata (equipaggia/rimuovi, divisione equipaggiabile/zaino) è ora in `rules/equipment.ts`.
- Non fatto: scelta fra stampa HTML del client e PDF del server (il doppione di layout resta, rimandato a una fase dedicata perché cambierebbe il comportamento e tocca la Fase A).
- **Fatto quando**: nessun componente sopra ~300 righe; comportamento invariato.

### Fase G — Campagne condivise (funzionale) — fatta
- Campagne su Firestore con ruoli DM/giocatore, unione via codice, riepilogo dei personaggi visibile ai membri, copia del ritratto nello Storage della campagna.
- Fatto: `ICampaign`/`ICampaignMember`/`ISharedCharacter` in `characterTypes.ts`; `rules/campaign.ts` (codici, ruoli, riepilogo, piano di sincronizzazione; con test); `services/campaignService.ts` (I/O Firestore + campagne locali) e `storageService` (copia ritratti); `providers/CampaignProvider.tsx`; `features/character/campaignSync.ts` (pubblica/ritira il riepilogo al salvataggio o all'eliminazione del personaggio, best effort); regole in `firestore.rules` e `storage.rules`.
- UI: `CampaignManagerModal` (le mie / nuova / unisciti, con "Condividi" per le campagne locali), nuova rotta `/campaign/:campaignId` (`features/campaign/`: gruppo, membri, codice, modifica/elimina per il DM, abbandona per il giocatore), `CampaignSelect` e filtro della lista per id.
- Non fatto / da sapere: nessun test delle regole con l'emulatore Firestore (il progetto non ne ha uno) e nessun test del servizio; le regole vanno distribuite (`firebase deploy --only firestore:rules,storage`); la copia del ritratto richiede che il bucket permetta la lettura via SDK (CORS), altrimenti il riepilogo si pubblica senza ritratto; `firestore.exists` in `storage.rules` punta al database `runica-db`; il DM non si trasferisce; la scheda completa dei giocatori non è visibile al DM (solo il riepilogo).
- **Fatto quando**: due utenti diversi vedono la stessa campagna.

Dipendenze consigliate, non obbligatorie: B prima di D/F rende il refactor più sicuro; D semplifica E.
