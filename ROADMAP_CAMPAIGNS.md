# Roadmap — Campagne al tavolo (DM Live Board e Party Hub)

> Stato: **approvata** (incluse le 4 decisioni aperte del §6). **Step 1–4 fatti** (branch `feature-campaigns`): schema `sharedCharacters` solo v2, nessun codice di transizione
> della Fase G. Le rifiniture non necessarie al rilascio sono nel §5 "Dopo lo Step 4".
> Ambito analizzato: `firestore.rules`, `storage.rules`, `services/campaignService.ts`, `providers/CampaignProvider.tsx`,
> `features/character/rules/campaign.ts`, `campaignSync.ts`, `CharacterProvider.tsx`, `hooks/usePlayViewAutosave.ts`,
> `features/campaign/**`, `components/CampaignManagerModal.tsx` e `components/campaign/**`, `routes/index.tsx`,
> `firebase.json`, workflow GitHub, `PRODUCT.md`, `DESIGN.md`.

---

## 0. Audit dell'esistente

### 0.1 Perché "l'invito non funziona"

Ho riletto le regole come le valuterebbe Firestore, operazione per operazione. Il batch di `joinCampaignByCode`
(`members/{uid}` creato + `memberUids` con `arrayUnion`) **è coerente con le regole così come sono scritte**: entrambi i
rami (`members.create` con `role == 'player'` e `campaigns.update` "un giocatore entra") passano, le chiamate
`get/getAfter` sono 4 (limite 20 per batch). Il problema non sta nella logica della regola: sta attorno.
Ecco le cause, dalla più probabile:

| # | Causa | Dove | Effetto | Certezza |
|---|---|---|---|---|
| 1 | **Le regole non vengono mai distribuite in automatico.** `deploy:live`/`deploy:staging` e i workflow `firebase-hosting-*` fanno solo `--only hosting:*`. Le regole della Fase G (`firestore.rules`, `storage.rules`) vanno pubblicate a mano sul database **`runica-db`** (`firebase deploy --only firestore:rules,storage`). Se in console il database `runica-db` ha ancora le regole precedenti (solo `users/{uid}/characters`), ogni operazione su `campaigns`/`campaignInvites` riceve `permission-denied`: per `joinCampaignByCode` arriva già sulla `getDoc` dell'invito → toast generico "permessi". | `package.json`, `.github/workflows/` | Unione (e probabilmente creazione) sempre negata | Alta, da verificare in console (data delle regole di `runica-db`) |
| 2 | **Dopo l'unione non succede niente di visibile.** Il giocatore entra, ma nessun passo gli fa associare un personaggio: deve aprire l'editor, scegliere la campagna in *Identità* e salvare. Finché non lo fa il DM vede "Nessun personaggio condiviso". | `CampaignManagerModal.handleJoin` | Per DM e giocatore "l'invito non ha funzionato" | Certa |
| 3 | **La vista di gioco non pubblica mai.** `usePlayViewAutosave` salva con `characterRepository.saveCharacter` e salta `syncCharacterWithCampaigns` (che sta solo in `CharacterProvider.saveCharacter`). PF, condizioni e slot cambiati al tavolo non arrivano mai alla campagna: il riepilogo resta fermo all'ultimo salvataggio dall'editor. | `hooks/usePlayViewAutosave.ts` | Niente tempo reale | Certa |
| 4 | **Codice fragile da inserire.** `normalizeInviteCode` fa solo `trim` + maiuscole; l'input ha `maxLength={6}`. Un codice incollato con spazio, trattino o prefisso ("X7K 9AB", "RUN-X7K9AB") viene troncato o rifiutato. Non esiste un link d'invito né una rotta di join. | `rules/campaign.ts`, `CampaignJoinForm.tsx` | "Codice non valido" con un codice giusto | Certa |
| 5 | **"Già membro" dedotto da un errore.** Per capire se l'utente è già dentro, il servizio legge la campagna e interpreta `permission-denied` come "non membro". Funziona, ma qualsiasi altro rifiuto (regole non distribuite, causa 1) diventa ambiguo e il messaggio all'utente è sbagliato. | `campaignService.joinCampaignByCode` | Diagnosi impossibile per l'utente | Certa |
| 6 | **Ritratti in campagna con database nominato.** `storage.rules` usa `firestore.exists(/databases/runica-db/...)`. Le regole cross-service di Storage richiedono di concedere a Storage l'accesso a Firestore (richiesta in console al primo deploy) e il supporto ai database nominati va verificato. Se fallisce, `publishCharacter` pubblica senza ritratto (best effort): non blocca l'unione. | `storage.rules` | Party senza ritratti | Da verificare |
| 7 | Rimozione di un giocatore da parte del DM: `removeMember` riusa `leaveCampaign`, che prova a cancellare i ritratti nel percorso Storage del giocatore (`campaigns/{cid}/portraits/{uid}/…`, `delete` solo del proprietario) → file orfani (errore ignorato). | `campaignService.removeMember` | Spazio sprecato, ritratto ancora raggiungibile via URL | Certa |

Il punto 1 si chiude con una verifica di 2 minuti in console e un `firebase deploy --only firestore:rules,storage`; i
punti 2–5 sono il cuore dello Step 1. La prova che il flusso funziona la daranno i **test delle regole con l'emulatore**
(oggi assenti, problema noto 9).

### 0.2 Altri limiti rilevanti per il "tavolo"

- `ISharedCharacter` contiene solo PF, CA, classe e livello: mancano velocità, passive, CD, ispirazione, slot, condizioni.
- Il riepilogo è un solo documento leggibile da tutti i membri: oggi non si può mostrare uno *stato narrativo* ai
  giocatori senza esporre i numeri nel documento (le regole Firestore non filtrano i campi in lettura).
- Il DM non può modificare nulla dei personaggi (corretto: le schede restano private) → servono azioni del DM
  *proposte* e applicate dal client del giocatore.
- `CampaignPage` sta fuori da `CharacterLayout`: non può usare `useCharacter()` (scelta o cambio del personaggio iscritto).
- La percezione passiva è calcolata dentro `MainTabView` (non in `rules/`); intuizione e indagare passive non esistono.
- `deleteCampaign` cancella le sottocollezioni in un solo batch (limite 500 scritture) e non conosce le nuove collezioni.

---

## 1. Principi del progetto

1. **La scheda resta privata e il giocatore ha l'ultima parola** (PRODUCT.md, principio 2): il DM non scrive mai in
   `users/{uid}/characters`. Il giocatore pubblica proiezioni della propria scheda; il DM invia *azioni* che il client del
   giocatore applica con le stesse funzioni pure dei riposi.
2. **Privacy per documento, non per campo**: ciò che un ruolo non deve vedere sta in un documento che quel ruolo non può
   leggere. La visibilità dei numeri ai giocatori dipende da un'impostazione della campagna letta *dalla regola*, quindi
   cambia all'istante senza ripubblicare nulla.
3. **Offline first**: tutte le scritture passano da `settleOrQueue`; le azioni del DM restano in coda in Firestore e si
   applicano quando il giocatore torna online (con scadenza, vedi §2.6).
4. **Retrocompatibile**: nessun campo esistente cambia significato; i codici a 6 caratteri restano validi; le campagne
   senza `settings` si comportano come oggi.
5. **Un solo punto di pubblicazione**: le proiezioni si calcolano con funzioni pure in `rules/campaign.ts` (testate) e si
   scrivono da un solo hook, qualunque vista abbia modificato la scheda.

---

## 2. Schema dati (Firestore `runica-db`)

```
campaigns/{campaignId}                         DM = ownerUid (invariato) + settings
  members/{uid}                                ruolo, nome, foto, codice usato + activeCharacterId
  sharedCharacters/{characterId}               PROIEZIONE PARTY: identità + stato narrativo (letta da tutti i membri)
  liveStats/{characterId}                      NUOVO · PROIEZIONE TAVOLO: numeri completi (DM + proprietario; party se "numerico")
  dmActions/{actionId}                         NUOVO · azioni del DM verso i PG (ispirazione, riposi)
  board/{postId}                               NUOVO · bacheca condivisa
  dmPrivate/notes                              NUOVO · note segrete del DM (solo DM)
campaignInvites/{code}                         codice → campagna (get sì, list no) + anteprima
```

### 2.1 `campaigns/{id}` (esteso)

```ts
interface ICampaign {
  id: string; name: string; description?: string;
  ownerUid: string; memberUids: string[]; inviteCode: string;   // invariati
  createdAt: number; updatedAt: number;
  settings?: ICampaignSettings;                                  // NUOVO, assente = default
  schemaVersion?: 2;
}
interface ICampaignSettings {
  /** Cosa vedono i giocatori dei compagni. Default 'numeric' (= comportamento attuale). */
  partyVitals: 'numeric' | 'narrative';
  /** I giocatori possono scrivere in bacheca. Default true. */
  playerPosts: boolean;
}
```

Regole: il DM può toccare anche `settings` e `schemaVersion` (validati: enum e booleano). `getCampaignSettings(c)` in
`rules/campaign.ts` restituisce i default per i documenti vecchi.

### 2.2 `campaigns/{id}/members/{uid}` (esteso)

`+ activeCharacterId?: string` — il personaggio con cui il giocatore siede al tavolo (cambio rapido). Aggiornabile solo
dal membro stesso (`affectedKeys` ⊆ `displayName, photoURL, activeCharacterId`).
Nuova lettura: `allow get` anche a chi *non* è membro **solo sul proprio documento** (`request.auth.uid == memberUid`),
così "sei già membro?" diventa una `getDoc` che restituisce *esiste / non esiste* (causa 5 risolta).

### 2.3 `campaignInvites/{code}` (esteso)

```ts
interface ICampaignInvite {
  campaignId: string; ownerUid: string; createdAt: number;      // invariati
  campaignName?: string;  // anteprima "Stai per unirti a …" prima di entrare
  dmName?: string;
  expiresAt?: number;     // opzionale; assente = non scade
}
```

- **Id del documento = codice nudo** (6 caratteri dell'alfabeto senza ambigui, come oggi): i codici esistenti restano
  validi. Il prefisso è solo di presentazione: **`RUN-X7K9AB`**. Sconsiglio `RUN-XXXX` a 4 caratteri: con `get` aperto
  a ogni utente autenticato, 31⁴ ≈ 920 mila combinazioni si enumerano; 31⁶ ≈ 890 milioni no.
- `normalizeInviteCode`: maiuscole, toglie tutto ciò che non è alfanumerico, toglie il prefisso `RUN` **solo** se ne
  restano 6 caratteri dopo (un codice può iniziare con "RUN"). Accetta anche un link intero incollato
  (estrae `code=` dall'URL).
- Link diretto: **`/campaigns/join?code=RUN-X7K9AB`** (condivisibile con `navigator.share`, ripiego "Copia link").
- Regole: `get` se autenticato **e** `!('expiresAt' in data) || data.expiresAt > request.time.toMillis()`; `list` mai;
  `update` solo del DM e solo su `campaignName`/`dmName`/`expiresAt` (per tenere allineata l'anteprima al rinomina).
  La regola `hasValidJoinCode` controlla anche la scadenza.

### 2.4 `sharedCharacters/{characterId}` — proiezione *party* (rivista, retrocompatibile)

Ciò che **ogni membro** può vedere, sempre:

```ts
interface ISharedCharacter {
  id: string; ownerUid: string;
  name: string; class: string; subclass: string; race: string; level: number;
  portraitUrl?: string; portraitSource?: string;
  vitals: 'healthy' | 'wounded' | 'critical' | 'down';   // Sano / Ferito / Critico / A terra
  conditions: string[];                                   // chiavi inglesi, etichette da labels.ts
  heroicInspiration: boolean;
  lastUpdated: number;
  schemaVersion: 2;                                       // obbligatorio: le regole rifiutano tutto il resto
}
```

`narrativeVitals(current, max)`: `down` a 0 PF, `critical` ≤ 25 %, `wounded` ≤ 50 % (= *Sanguinante* 2024), altrimenti
`healthy`. Soglie in `rules/campaign.ts`, testate.

Transizione (Step 1–3, **chiusa nello Step 4**): le regole accettavano i campi v1 finché la campagna non era
narrativa e il client del DM eliminava i riepiloghi v1 al passaggio a *narrativo*. Dallo Step 4 le regole accettano solo
le chiavi v2 con `schemaVersion == 2`, in qualunque modalità. Un documento v1 rimasto nel database si rimpiazza da solo:
la prima pubblicazione di ogni sessione (`publishCharacter`, anche dalla vista di gioco) riscrive il riepilogo **per
intero** (`setDoc` senza merge, ritratto incluso), e un merge su un documento v1 verrebbe comunque rifiutato.

### 2.5 `liveStats/{characterId}` — proiezione *tavolo* (nuova)

```ts
interface ILiveStats {
  ownerUid: string;
  hp: { current: number; max: number; temp: number };
  armorClass: number;
  speed: number;
  passives: { perception: number; insight: number; investigation: number };
  spellSaveDC: number | null;        // null se non incantatore
  heroicInspiration: boolean;
  spellSlots: Record<string, { max: number; used: number }>;   // solo livelli con max > 0
  conditions: string[];
  deathSaves: { successes: number; failures: number };
  hitDice: { total: string; used: number };
  appliedActionIds: string[];        // ultime ≤ 30 azioni del DM applicate (stato "in attesa" sulla board)
  lastUpdated: number;
}
```

Lettura: `isCampaignOwner(cid)` **oppure** `resource.data.ownerUid == uid` **oppure**
`isCampaignMember(cid) && settings.partyVitals != 'narrative'` (letto con `get` sulla campagna: vale anche per le query
`list`, perché non dipende da `resource`). Il giocatore in modalità narrativa si abbona solo ai propri documenti
(`where('ownerUid', '==', uid)`).
Scrittura: solo il proprietario del personaggio, membro, chiavi in whitelist, tipi numerici, liste limitate in
dimensione. Cancellazione: proprietario o DM.

### 2.6 `dmActions/{actionId}` (nuova)

```ts
interface IDmAction {
  type: 'grantInspiration' | 'revokeInspiration' | 'shortRest' | 'longRest';
  targets: string[];      // characterId; il DM sceglie singolo PG o "tutto il gruppo"
  createdBy: string; createdAt: number;
  expiresAt: number;      // createdAt + 12 h: un riposo lungo vecchio di giorni non si applica più
}
```

- Regole: `create` solo DM (`createdBy == uid`, enum, `targets` ≤ 12); `read` membri; `delete` DM; niente `update`.
- **Applicazione nel client del giocatore** (`useCampaignActions`, montato in `CharacterLayout`): ascolta le azioni non
  scadute delle campagne in cui ha PG, per ogni `target` suo non ancora in `appliedActionIds`:
  - `grant/revokeInspiration` → `inspiration = 1 / 0`, applicata subito con toast.
  - `longRest` → `longRestUpdate(c)` con toast **"Il DM ha dichiarato un riposo lungo · Annulla"** (annulla = ripristina
    lo snapshot precedente).
  - `shortRest` → non tocca nulla da solo: apre il flusso di riposo breve esistente di `PlayView` (i dadi vita li sceglie
    il giocatore).
  - L'id viene aggiunto a `appliedActionIds` in `liveStats` (anche per "rifiutata"), così la board mostra *in attesa /
    applicata*.
- Le modifiche passano da `updateCharacter`/`saveCharacter` del `CharacterProvider` (lo stesso stato che la vista di gioco
  modifica), mai dal repository direttamente: altrimenti l'autosave di `PlayView` sovrascriverebbe l'azione.

### 2.7 `board/{postId}` e `dmPrivate/notes` (nuove)

```ts
interface IBoardPost { authorUid: string; authorName: string; text: string; pinned: boolean; createdAt: number; updatedAt: number; }
interface IDmNotes  { text: string; updatedAt: number; }
```

- `board`: `read` membri; `create` membro con `authorUid == uid` e (`DM` o `settings.playerPosts`), `text` ≤ 4000;
  `update` l'autore su `text/updatedAt`, il DM su `pinned`; `delete` autore o DM.
- `dmPrivate/{doc}`: `read, write` solo `isCampaignOwner`. Testo ≤ 20000.

### 2.8 Storage

- Invariato `campaigns/{cid}/portraits/{uid}/{characterId}`. Step 1 verifica il funzionamento di `firestore.exists` con
  `runica-db`. Se non è supportato, ripiego: pubblicare in `portraitUrl` l'URL di download del ritratto originale
  (stessa esposizione di oggi, problema noto 5) ed eliminare la copia.
- Rimozione di un giocatore: la cancellazione del ritratto diventa responsabilità del proprietario (alla prossima
  apertura, il client trova il PG associato a una campagna di cui non è più membro → `unpublish` + pulizia) oppure, in
  Step 4, di una funzione v2.

### 2.9 Indici

`liveStats` (`ownerUid ==`) e `sharedCharacters` (`ownerUid ==`) usano indici a campo singolo automatici;
`dmActions` filtrata con `expiresAt >` + ordinamento sullo stesso campo: nessun indice composto. `firestore.indexes.json`
invariato salvo sorprese in emulatore.

---

## 3. Flusso Invito / Join (Step 1)

```
DM: Campagna ▸ "Invita"  →  RUN-X7K9AB  +  [Condividi link] [Copia codice] [Nuovo codice]
                                     │
Giocatore apre /campaigns/join?code=RUN-X7K9AB   (o incolla codice/link nella finestra Campagne)
  ├─ non loggato → "Accedi per unirti"  → /login?next=/campaigns/join?code=…  → torna qui
  ├─ get campaignInvites/X7K9AB
  │    ├─ non esiste / scaduto → "Invito non valido o scaduto. Chiedi un nuovo codice al DM."
  │    └─ ok → anteprima: "«La Tomba degli Annientamenti» · DM Marta"   [Unisciti]
  ├─ get members/{uid} (propria lettura)
  │    └─ esiste → "Sei già nel gruppo" → /campaigns/{id}
  ├─ batch: members/{uid} (joinCode) + memberUids arrayUnion
  └─ "Con chi siedi al tavolo?" → elenco dei miei PG (cloud) + "Crea un nuovo eroe"
       ├─ PG già in un'altra campagna → confirmDialog "Spostarlo qui?"
       └─ saveCharacter({ campaignId, campaignName }) + members.activeCharacterId → pubblica subito → /campaigns/{id}
```

- I personaggi in modalità locale non si possono associare: il picker spiega che vanno prima portati sul cloud (la
  migrazione esiste già).
- `LoginPage` accetta `?next=` (solo percorsi interni che iniziano con `/`, per evitare open redirect).
- Errori tradotti (`lib/errors.ts`): `permission-denied` durante il join → "Non è stato possibile unirti: il codice
  potrebbe essere stato rigenerato dal DM."

---

## 4. Le due viste al tavolo

Rotta unica **`/campaigns/:campaignId`**, dentro `CharacterLayout` (serve `useCharacter()`); `/campaign/:id` resta
come redirect. La vista dipende dal ruolo. Componenti condivisi di `DESIGN.md`: `HeroHeader` (è già generico: nome,
sottotitolo, immagine, badge, azioni), `PillTabBar` + `TabButton variant="pill"`, `PlaySection` (`.tile`), `BentoStat`
(`inset`/`small`), `playInsetClass`, `playChipClass`, `playGroupTitleClass`, `RuneDivider`, `confirmDialog`/`toast`.
Nessuna `.tile` annidata; niente `.surface` nelle viste al tavolo (resta per la lista campagne).

### 4.1 Schermo del DM — *Live Board*

```
HeroHeader  «Nome campagna» · sottotitolo "Dungeon Master · 4 eroi" · badge "Dal vivo" (pallino success / warning offline)
            azioni: [Invita] [⋯ Impostazioni, Rinomina, Elimina]
PillTabBar  Tavolo · Bacheca · Note segrete · Gruppo
```

**Tavolo** (default): barra d'azioni sticky sotto i tab — `Ispirazione ▾` (a un PG / a tutti), `Riposo breve`,
`Riposo lungo` (entrambi con `confirmDialog`, poi toast "Inviato a 4 eroi"). Ordinamento per nome o per PF più bassi
(toggle); l'iniziativa resta fuori ambito.

Griglia di **`PartyMemberTile`** (1 colonna su telefono, 2 da `md`, 3 da `xl`; desktop/tablet è il caso d'uso del DM),
ognuna un `PlaySection` senza titolo:

```
┌ tile ─────────────────────────────────────────────┐
│ [ritratto] Thalia            ✦ Ispirazione (toggle)│  ← header riga: font-cinzel, "Maga 5 · Elfa", giocatore
│ ▓▓▓▓▓▓▓▓▓░░░░  23 / 38  +5 temp                    │  ← HpBar (estratta da HPTracker), colore di stato
│ ┌CA 15┐ ┌Vel 9m┐ ┌CD 14┐                           │  ← BentoStat inset small ×3
│ Passive  Perc 13 · Intu 11 · Inda 15               │  ← playInsetClass, cifre monospace
│ Slot  1 ●●○○  2 ●●○  3 ●○                          │  ← pallini pieni = disponibili
│ [Avvelenato] [Concentrazione]   ☠ 1/3  ✚ 0/3       │  ← playChipClass; tiri morte solo a 0 PF
│ aggiornato 2 min fa · Riposo lungo in attesa…      │  ← text-label muted
└───────────────────────────────────────────────────┘
```

- A 0 PF anello `destructive` sulla tessera (come `.tile-danger`); PG non aggiornato da > 10 min: data in `warning`.
- Tap sulla tessera → pannello laterale (`Modal` su telefono) con dettaglio e azioni per quel solo PG.
- **Bacheca**: avvisi fissati in alto (`pinned`), poi messaggi; il DM fissa/sfissa ed elimina.
- **Note segrete**: un `StyledTextArea` grande con salvataggio automatico (debounce 1,5 s come la vista di gioco).
- **Gruppo**: membri (come oggi `MemberList`), codice d'invito, impostazioni (`SegmentedControl` *Numerico / Narrativo*,
  interruttore "I giocatori possono scrivere in bacheca").

### 4.2 Vista Giocatore — *Party Hub*

```
HeroHeader  «Nome campagna» · "Giocatore · siedi come Thalia ▾"   azioni: [Apri la mia scheda] [⋯ Abbandona]
PillTabBar  Gruppo · Bacheca
```

- **Gruppo**: il mio PG in cima (tessera compatta con link alla vista di gioco), poi i compagni:
  - modalità *numerica* → stessa `PartyMemberTile` del DM in variante ridotta (PF, CA, condizioni, ispirazione);
  - modalità *narrativa* → stato `Sano`/`Ferito`/`Critico`/`A terra` come chip colorato (`success`/`warning`/
    `destructive`), barra senza numeri a 4 gradini, condizioni e ispirazione.
- **Cambio rapido del personaggio iscritto**: il menu nel sottotitolo apre un elenco dei miei PG; sceglierne uno sposta
  `campaignId` dal vecchio al nuovo (`planCampaignSync` già lo gestisce) e aggiorna `activeCharacterId`.
- **Bacheca**: lettura e, se permesso, scrittura (campo + "Pubblica"); modifica/eliminazione dei propri messaggi.
- Azioni del DM ricevute: toast nella vista in cui il giocatore si trova (anche dentro la scheda), vedi §2.6.

### 4.3 Accesso

- Lista eroi: le campagne compaiono come riga di chip "Le tue campagne" sopra la lista (link a `/campaigns/:id`) oltre
  alla finestra esistente.
- Vista di gioco: badge campagna nell'`HeroHeader` che porta al Party Hub.

---

## 5. Piano a step

Ogni step è un branch e una PR propri; ogni PR passa `npm run typecheck`, `npm test` e `npm run build`. Prima dello
Step 1, **azione manuale**: controllare in console la data delle regole di `runica-db` e, se serve, eseguire
`firebase deploy --only firestore:rules,storage` (causa 1).

### Step 1 — Schema, `firestore.rules`, service, flusso Invito/Join + test — fatto

Fatto: tipi in `characterTypes.ts`; `rules/campaign.ts` (codici `RUN-`, link, scadenza, `sanitizeNextPath`, impostazioni, `narrativeVitals`, proiezioni `buildSharedCharacter`/`buildLiveStats`, impronta) e `getPassiveScores` in `rules/combat.ts`, con test; `firestore.rules` con tutte le collezioni del §2 e 32 test con l'emulatore (`tests/rules/`, `npm run test:rules`, job CI `firestore-rules`); service (`resolveInvite`, `isMemberOf`, `joinCampaignByCode` senza deduzione dagli errori, `setActiveCharacter`, `updateCampaignSettings`, `onCampaignSnapshot`, `onLiveStatsSnapshot`, `publishLiveProjection`, eliminazione a blocchi di tutte le sottocollezioni); pubblicazione dal vivo da `usePlayViewAutosave` (`publishLive` del provider, solo se l'impronta cambia); `/campaigns/join`, `/campaigns/:id` dentro `CharacterLayout`, redirect da `/campaign/:id`, `?next=` nel login, `CharacterPickerModal` dopo l'unione, `/character/new?campaign=<id>`, codice `RUN-` e "Condividi link" nell'header; script `deploy:rules`, regole in `deploy:live` e job `deploy_rules` (opzionale) su `main`.
Da sapere: la pagina campagna resta quella della Fase G (con PF/CA dal vivo da `liveStats`) finché lo Step 2 non la divide in Live Board e Party Hub; `npm run test:rules` non è nel type-check (`tests/` è fuori da `tsconfig`).

1. **Tipi** (`characterTypes.ts`): `ICampaignSettings`, `ICampaignInvite`, `ILiveStats`, `IDmAction`, `IBoardPost`,
   `IDmNotes`; estensione di `ICampaign`, `ICampaignMember`, `ISharedCharacter` (campi v1 opzionali).
2. **Regole pure** (`rules/campaign.ts`, con test):
   `formatInviteCode`/`normalizeInviteCode` (prefisso `RUN-`, spazi, trattini, link incollato), `buildInviteLink`,
   `getCampaignSettings` (default), `narrativeVitals`, `getPassiveScores` (spostata da `MainTabView` in `rules/combat.ts`
   + intuizione e indagare), `buildPartyProjection`, `buildLiveStats`, `projectionFingerprint` (per non riscrivere
   documenti identici), `isInviteExpired`.
3. **`firestore.rules`**: lettura del proprio `members/{uid}`; `activeCharacterId`; `settings`; invito con anteprima e
   scadenza; `sharedCharacters` v2 (+ transizione v1); `liveStats` (lettura condizionata da `settings.partyVitals`).
   Le regole di `dmActions`, `board`, `dmPrivate` si scrivono qui ma i componenti arrivano negli step 2–3.
4. **Test delle regole con l'emulatore**: `@firebase/rules-unit-testing`, `vitest.rules.config.ts`, script
   `npm run test:rules` (`firebase emulators:exec --only firestore`), job CI separato con Java + `firebase-tools`.
   Casi minimi: crea campagna; join con codice valido / sbagliato / scaduto / rigenerato; nessuno elenca
   `campaignInvites` né `campaigns`; non membro non legge `sharedCharacters`/`liveStats`; giocatore non legge
   `liveStats` altrui in modalità narrativa ma sì in numerica; nessuno scrive il PG di un altro; solo il DM crea
   `dmActions` e legge `dmPrivate`; uscita e rimozione.
5. **Service** (`campaignService.ts`): `resolveInvite(code)` (anteprima), `getOwnMembership`, `joinCampaignByCode`
   senza la deduzione da `permission-denied`, `setActiveCharacter`, `updateCampaignSettings`, `publishProjections`
   (party + live, con fingerprint), `deleteCampaign` a blocchi da 400 su tutte le sottocollezioni; `CampaignError` con
   codici `expired` e `not-signed-in`.
6. **Pubblicazione unica**: hook `useCampaignPublisher` in `CharacterProvider`, che osserva `characters` (il listener
   Firestore riflette subito anche gli autosave di `PlayView`) e pubblica con debounce 2 s solo se il fingerprint
   cambia. `syncCharacterWithCampaigns` resta per il cambio di campagna (ritiro + pubblicazione). Causa 3 risolta.
7. **Flusso di join**: rotta `/campaigns/join` (`JoinCampaignPage`) dentro `CharacterLayout`, `?next=` in `LoginPage`,
   `CharacterPickerSheet` dopo l'unione, `CampaignJoinForm` che accetta codice o link (niente `maxLength` rigido),
   pulsanti "Condividi link" / "Copia codice" con `RUN-` nel `CampaignHeader`.
8. **Rotte**: `/campaigns/:campaignId` dentro `CharacterLayout` (per ora con la `CampaignPage` attuale);
   `/campaign/:id` → redirect.
9. **Docs**: aggiornare `CLAUDE.md` (Dati, Problemi noti 9, nuova voce di roadmap), `PRODUCT.md` (Capabilities),
   `DEPLOYMENT_GUIDE.md` (deploy delle regole).

**Fatto quando**: in emulatore e su staging un secondo account entra con link o codice in qualunque formato, associa un
PG e il DM lo vede comparire; cambiando i PF dalla vista di gioco il riepilogo si aggiorna in ≤ 3 s; tutti i test delle
regole passano in CI.

### Step 2 — Schermo Live DM — fatto

Fatto: `CampaignPage` smista per ruolo fra `DmLiveBoard` (tab Tavolo · Bacheca · Note segrete · Gruppo, `?tab=` nell'URL) e `PartyHub`; `useCampaignLive` (membri, riepiloghi, `liveStats`, `dmActions` attive per il DM, "Dal vivo"/"Offline" da `metadata.fromCache` + `navigator.onLine`); `HpBar` estratta da `HPTracker`; `PartyMemberTile`, `SpellSlotPips`, `PassiveScoresRow`, `DmActionBar` (sticky, vetro), `PartyMemberDetail` (azioni per un solo PG e "Ritira" delle azioni in attesa); `useCampaignActions` montato in `CharacterLayout` (ispirazione e riposo lungo applicati con toast "Annulla", riposo breve con toast "Riposa" che apre il flusso di `PlayView` via `?rest=short`, `appliedActionIds` aggiornati; con l'editor di quel PG aperto l'azione aspetta); `DmNotesTab` (autosave 1,5 s); tab Gruppo con `InvitePanel`, `CampaignSettingsPanel` (pulizia dei `sharedCharacters` v1 al passaggio a narrativo) e `MemberList` ("siede come …"); `toast.action` in `Dialogs`; etichette `DM_ACTION_LABELS`/`conditionLabel` e icone `InspirationIcon`, `PinIcon`, `ChatBubbleIcon`; regole pure con test in `rules/campaignTable.test.ts` (`applyDmAction`, `undoPatchFor`, `pendingDmActions`, `dmActionProgress`, `sortParty`, `describeAgo`, `slotSummary`, bacheca). Rimossi `CampaignHeader` e `SharedCharacterCard`.
Verificato a mano con dati di prova su desktop e a 375 px, temi Ambra e Pergamena. Da sapere: `firestore.rules` non è cambiato (le regole di `dmActions`, `board`, `dmPrivate` erano già nello Step 1); il flusso completo con due account reali (DM e giocatore) resta da provare su staging.

1. `CampaignPage` → smistatore per ruolo: `DmLiveBoard` / `PartyHub` (pagina ≤ ~150 righe, sezioni in
   `features/campaign/components/`).
2. Hook `useCampaignLive(campaignId)`: abbonamenti a membri, `sharedCharacters`, `liveStats`, `dmActions` attive;
   stato "Dal vivo"/"offline" da `snapshot.metadata.fromCache`.
3. Componenti: `HpBar` estratta da `HPTracker` (riusata dalla vista di gioco, comportamento invariato),
   `PartyMemberTile`, `SpellSlotPips`, `PassiveScoresRow`, `DmActionBar`, `PartyMemberDetail` (Modal).
4. `useCampaignActions` nel client del giocatore (applicazione con annulla, riposo breve che apre il flusso esistente,
   `appliedActionIds`), con test puri di `applyDmAction(character, action)` in `rules/campaign.ts`.
5. Tab Note segrete (`dmPrivate/notes`) e tab Gruppo con impostazioni (`partyVitals`, `playerPosts`) e pulizia dei
   `sharedCharacters` v1 al passaggio a *narrativo*.
6. Etichette nuove in `lib/labels.ts` (azioni, stati narrativi); icone nuove in `icons.tsx` (ispirazione, riposo).

**Fatto quando**: con due PG su due account, il DM vede PF/slot/condizioni muoversi in tempo reale, assegna
l'ispirazione e dichiara un riposo lungo; il giocatore riceve il toast, può annullare, e la board passa da
"in attesa" ad "applicata". A 375 px la board resta leggibile (una colonna).

### Step 3 — Vista Giocatore e Bacheca — fatto

Fatto: `PartyHub` (proprio eroe in cima con "Apri la tua scheda", compagni numerici o narrativi; in narrativa i `liveStats` altrui non vengono letti né renderizzati), cambio rapido "siedi come … ▾" (`CharacterPickerModal` ora toglie dalla campagna il PG che sedeva prima e aggiorna `activeCharacterId`), `CampaignBoard` + `BoardPostItem` condivisi (fissati in alto, composizione, modifica dell'autore, fissa/elimina del DM, bacheca chiusa se `playerPosts` è spento), chip "Le tue campagne" nella lista eroi (`CampaignChips`), badge campagna cliccabile nell'`HeroHeader` della vista di gioco, toast delle azioni del DM in tutte le rotte personaggio.

1. `PartyHub`: mio PG in cima, compagni in modalità numerica/narrativa (variante di `PartyMemberTile`, nessun numero nel
   DOM in narrativa: i dati non vengono nemmeno letti).
2. Cambio rapido del PG iscritto (menu nel sottotitolo dell'`HeroHeader`), con conferma se il PG era in un'altra campagna.
3. `CampaignBoard` condivisa (DM e giocatori): elenco in tempo reale, fissati in alto, composizione, modifica ed
   eliminazione secondo le regole.
4. Accessi: chip "Le tue campagne" nella lista eroi, badge campagna nell'`HeroHeader` della vista di gioco.
5. Toast delle azioni del DM visibili in tutte le rotte personaggio.

**Fatto quando**: un giocatore in modalità narrativa vede solo gli stati Sano/Ferito/Critico/A terra (verificato anche
con una lettura diretta di `liveStats` negata dalle regole), scrive in bacheca, cambia PG e il DM vede il cambio.

### Step 4 — Pulizia della transizione — fatto

Fatto:
- **Regole**: `isValidSharedCharacter` accetta solo le chiavi v2 e richiede `schemaVersion == 2`, in qualunque modalità
  (non dipende più da `partyVitalsMode`). Test con l'emulatore aggiornati: campi v1 e versioni diverse rifiutati sempre;
  un documento v1 rimasto si sostituisce con una scrittura completa, mentre un merge viene rifiutato (33 test).
- **Tipi**: `ISharedCharacter` senza `hpCurrent`/`hpMax`/`hpTemp`/`armorClass`, `schemaVersion` obbligatorio.
- **Codice di transizione rimosso**: `LEGACY_SHARED_KEYS` e `legacySharedIds` (`rules/campaign.ts`, con il test),
  `legacyDeletes` e `deleteSharedCharacters` (`campaignService`), pulizia dei riepiloghi v1 al passaggio a narrativo
  (`useCampaignAdmin`, che non riceve più `shared`).
- **Scrittura del riepilogo** (`writeProjections`): con il ritratto noto `setDoc` completo, senza merge; dalla vista di
  gioco `mergeFields` sui soli campi della proiezione (il ritratto resta). `publishLiveIfChanged` fa una pubblicazione
  completa alla prima scrittura della sessione, così nessun campo fuori schema sopravvive.
- **`PartyMemberTile`**: tutta la tessera apre il dettaglio (DM) o la scheda (il proprio eroe nel Party Hub, `openLabel`),
  non solo nome e ritratto. Il clic si gestisce sul contenitore e si ignora solo se parte da un controllo interno
  (ispirazione, link in fondo); `cursor-pointer` per iOS Safari, `touch-manipulation`; il pulsante sull'identità resta
  per tastiera e lettori di schermo. Verificato a 375 px: ogni punto della tessera arriva al contenitore, nessun doppio
  avvio dal pulsante del nome, ispirazione e "Apri la tua scheda" mantengono la propria azione.

Da sapere:
- I PWA rimasti alla Fase G (riepiloghi v1) non possono più scrivere `sharedCharacters` finché non si aggiornano
  (`autoUpdate`); le regole vanno pubblicate insieme al client (`npm run deploy:rules` o job `deploy_rules` da `main`).
- Un riepilogo v1 di un personaggio che il proprietario non riapre più resta leggibile ai membri con i vecchi numeri
  finché non viene ripubblicato, ritirato o la campagna eliminata. Accettato: i numeri v1 erano già visibili al gruppo.
- Restano volutamente i fallback che non sono transitori: `settings` assente → default (`getCampaignSettings`),
  campagne locali per la modalità senza login, redirect `/campaign/:id` → `/campaigns/:id` per i link già condivisi.

### Dopo lo Step 4 — rifiniture (non bloccanti)

Fuori dall'ambito della pulizia, da pianificare quando servono:

1. Ritratti: decidere copia in campagna vs URL originale in base alla verifica dello Step 1; pulizia dei ritratti
   orfani (giocatore rimosso: il suo client ritira il PG alla prossima apertura) o funzione v2 `onDocumentDeleted`.
2. Scadenza degli inviti configurabile dal DM (nessuna / 7 giorni) e pulizia periodica delle `dmActions` scadute
   (lato client del DM all'apertura, oppure TTL policy di Firestore su `expiresAt`).
3. Accessibilità e resa: `aria-live="polite"` sui cambi di PF della board, `prefers-reduced-motion` per le barre,
   contrasto degli stati narrativi in tutti e 6 i temi, prova su tablet orizzontale.
4. Prestazioni: verificare il numero di letture per sessione (abbonamenti chiusi all'uscita, niente listener
   duplicati tra `CampaignProvider` e `useCampaignLive`).
5. `DESIGN.md`: Live Board, Party Hub, `PartyMemberTile` (tessera interamente tappabile), stati narrativi.
6. Flusso completo con due account reali (DM e giocatore) su staging.

---

## 6. Rischi e decisioni aperte

- **Azioni del DM con giocatore offline**: si applicano solo quando la sua app si apre (entro 12 h). È il prezzo della
  scheda privata; l'alternativa (funzione cloud che scrive nella scheda) contraddice "il giocatore ha l'ultima parola"
  e si scontrerebbe con i salvataggi a documento intero del client.
- **Passive visibili al party in modalità numerica**: `liveStats` è un solo documento; se il DM vuole tenere segrete le
  passive anche in modalità numerica servirebbe un terzo documento `dmStats`. Proposta: non farlo finché non serve.
- **Un PG = una campagna** (`campaignId` singolo, come oggi). Più campagne per PG richiederebbe `campaignIds[]` e una
  migrazione: fuori ambito.
- **Test delle regole in CI**: aggiungono Java e l'emulatore al workflow (~1 min). Alternativa: solo in locale.
- **Ispirazione Eroica**: `inspiration` resta numerico nei dati; nelle proiezioni diventa booleano (> 0). Le azioni
  del DM la portano a 1 o 0.
