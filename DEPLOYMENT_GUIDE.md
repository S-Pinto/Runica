# Guida al deploy

Runica è un'app React 19 + Vite 5 pubblicata su **Firebase Hosting** (progetto `runica-heros-folio`).
Ci sono due siti, definiti in `.firebaserc` e `firebase.json`:

| Target | Sito | Quando si aggiorna |
|---|---|---|
| `live` | runica-heros-folio.web.app | a ogni merge in `main` |
| `staging` | runica-heros-folio-staging | anteprime delle Pull Request (canali temporanei) |

## Configurazione: le variabili `VITE_*`

Il build legge la configurazione da variabili d'ambiente (vedi `src/lib/firebaseConfig.ts` e `vite.config.ts`).
**Non sono nel repository**: in locale stanno nei file `.env.*` (esclusi da git), su GitHub nei secret.

| Variabile | Valore | Note |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` | Configurazione dell'app web Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` | |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | |
| `VITE_FIREBASE_APP_ID` | `appId` | |
| `VITE_FIREBASE_MEASUREMENT_ID` | `measurementId` | |
| `VITE_APP_NAME`, `VITE_APP_SHORT_NAME` | Nome dell'app installata (PWA) | |
| `VITE_PWA_ICON_192`, `VITE_PWA_ICON_512` | Percorso delle icone, es. `/icons/icon-192.png` | **Obbligatorie**: senza, il build si interrompe |

I valori Firebase si trovano nella console Firebase → ⚙️ Impostazioni progetto → Generali → Le tue app → app web → **Config**,
oppure con `firebase apps:sdkconfig WEB --project runica-heros-folio`.

> Questi valori non sono segreti in senso stretto (finiscono comunque nel codice del sito pubblicato):
> la sicurezza dei dati dipende da `firestore.rules` e `storage.rules`.

Senza le variabili Firebase l'app funziona in **modalità offline** (personaggi salvati solo nel browser).

## Sviluppo in locale

```bash
npm ci
npm run dev
```

Crea un file `.env.local` con le variabili qui sopra per usare il cloud; senza, l'app parte in modalità offline.

## Deploy automatico (GitHub Actions)

- **Pull Request** → `.github/workflows/firebase-hosting-pull-request.yml`
  installa le dipendenze, controlla TypeScript, esegue `npm run build:staging` e pubblica un'**anteprima di 7 giorni** sul sito `staging`.
  Il link compare come commento nella PR. Senza i secret Firebase il controllo passa ma l'anteprima viene saltata.
- **Merge in `main`** → `.github/workflows/firebase-hosting-merge.yml`
  esegue `npm run build:live` e pubblica sul sito **live**. Se mancano i secret Firebase si ferma con un errore chiaro, senza pubblicare.

Configurazione necessaria su GitHub (Settings → Secrets and variables → Actions):

- **Repository secrets** (scheda *Secrets*, non *Environment secrets*):
  - `FIREBASE_SERVICE_ACCOUNT_RUNICA_HEROS_FOLIO`: account di servizio usato per il deploy
  - le 7 variabili `VITE_FIREBASE_*`
- **Variables** (facoltative): `VITE_APP_NAME`, `VITE_APP_SHORT_NAME` per il sito live,
  `VITE_APP_NAME_STAGING`, `VITE_APP_SHORT_NAME_STAGING` per le anteprime. Se assenti si usano "Runica" e "Runica (staging)".

Le icone PWA sono impostate direttamente nei workflow (`/icons/icon-*.png` per il live, `/icons/icon-staging-*.png` per le anteprime).

Per ripubblicare senza nuovi commit: tab **Actions** → ultima esecuzione → **Re-run jobs**.

## Deploy manuale (dal computer)

Richiede la Firebase CLI (`npm install -g firebase-tools`, poi `firebase login`) e i file `.env.production` / `.env.staging` nella cartella del progetto.

```bash
npm run deploy:staging
```

```bash
npm run deploy:live
```

Il build parte da solo prima del deploy (`predeploy` in `firebase.json`), con la modalità giusta.
Se compare l'errore "Target not found", collega una volta i siti:

```bash
firebase target:apply hosting staging runica-heros-folio-staging
```

## Note

- `package-lock.json` è versionato: usa `npm ci` per installare esattamente le stesse versioni della CI.
- `dist/` non è versionato: viene generato dal build.
- Dopo un nuovo deploy, chi ha l'app aperta può vedere un errore di caricamento dei moduli: la pagina di errore ricarica da sola una volta per prendere la nuova versione.

## Struttura del progetto

- `src/features`: logica per funzionalità (`character`, `auth`); le regole di gioco pure stanno in `src/features/character/rules`.
- `src/components`: componenti riutilizzabili; `src/components/ui` contiene `Button`, `Menu`, `TabButton`, `Dialogs` (conferme e notifiche).
- `src/services`: persistenza (Firebase, localStorage) e servizi esterni.
- `src/providers`: context React (autenticazione, tema).
- `src/lib`: configurazione delle librerie ed etichette italiane (`labels.ts`).
- `src/data`: dati di regole (condizioni, proprietà e maestrie delle armi).
