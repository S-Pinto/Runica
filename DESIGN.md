---
name: Runica
description: Scheda personaggio D&D 5e per il tavolo, scura e incisa, con un solo accento luminoso.
colors:
  background: "rgb(15 13 11)"
  foreground: "rgb(247 245 241)"
  card: "rgb(34 31 27)"
  border: "rgb(59 55 50)"
  border-strong: "rgb(112 107 100)"
  input: "rgb(49 45 40)"
  text: "rgb(225 221 215)"
  text-muted: "rgb(166 161 153)"
  accent: "rgb(247 179 50)"
  accent-dark: "rgb(225 150 27)"
  accent-foreground: "rgb(31 19 6)"
  destructive: "rgb(247 113 114)"
  destructive-foreground: "rgb(41 11 11)"
  success: "rgb(83 210 119)"
  warning: "rgb(251 140 66)"
typography:
  display:
    fontFamily: "Norse, serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.05em"
  headline:
    fontFamily: "Cinzel, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "Cinzel, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "0.1em"
  numeric:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  tile: "24px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-dark}"
    textColor: "{colors.accent-foreground}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    textColor: "{colors.accent}"
  button-ghost:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  input-field:
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "10px 12px"
  section-tile:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.tile}"
    padding: "16px"
  bento-stat:
    textColor: "{colors.foreground}"
    typography: "{typography.numeric}"
    rounded: "{rounded.tile}"
    padding: "12px"
  tab:
    textColor: "{colors.text-muted}"
    typography: "{typography.body-sm}"
    padding: "12px 16px"
  tab-active:
    textColor: "{colors.accent}"
  dialog:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.2xl}"
    padding: "24px"
    width: "448px"
---

# Design System: Runica

## Overview

**Creative North Star: "Il Grimorio Inciso"**

Runica è un libro di rune aperto sul tavolo: pagine scure e quiete, titoli incisi in caratteri antichi, e un solo inchiostro luminoso (l'accento) che indica ciò che conta adesso. Il fantasy vive nei titoli, nella runa del marchio e nell'accento; la struttura resta quella di uno strumento: numeri grandi, etichette brevi, sezioni ben separate.

La superficie è calma a riposo ma non piatta: una luce d'accento morbida cade dall'alto della pagina, le superfici si separano per tono e per un filo di luce sul bordo alto, e la grana dà tatto. Bagliori e bordi animati restano una risposta a uno stato (attivo, hover, focus, azione primaria), non decorazione di fondo. I controlli sono tattili e generosi, pensati per un pollice durante la partita: bersagli ampi, feedback di pressione visibile, valori leggibili a colpo d'occhio.

Il sistema è multi-tema: tutti i colori passano da variabili CSS e ogni tema (`theme-*`) ridefinisce la stessa serie di ruoli. I valori nel frontmatter sono quelli del tema predefinito **Ambra**.

### Temi

Sei temi, elencati in `src/lib/themes.ts` e definiti in `src/index.css`. Ognuno ha una ragione d'uso, non solo un colore diverso:

| Id | Nome | Fondo | Accento | Quando |
|---|---|---|---|---|
| `theme-amber` | Ambra | carbone caldo | oro runico | predefinito, il marchio |
| `theme-parchment` | Pergamena | pergamena chiara | lapislazzuli | l'unico tema chiaro: luce forte, lettura lunga |
| `theme-obsidian` | Ossidiana | nero puro | argento | schermi OLED, tavolo al buio |
| `theme-sapphire` | Zaffiro | blu d'abisso | ghiaccio | — |
| `theme-evergreen` | Foresta | verde profondo | foglia nuova | — |
| `theme-twilight` | Crepuscolo | indaco | lilla | — |

Regole per ogni tema (misurate con il contrasto WCAG):
- testo su fondo e su card ≥ 10:1; `text-muted` ≥ 5:1 anche sui campi;
- `accent-foreground` su `accent` e su `accent-dark` ≥ 6.5:1;
- `border-strong` su card ≥ 3:1 (contorno dei controlli);
- l'accento non coincide mai con un colore di stato: niente tema rosso (si confonde con `destructive`), e Foresta usa un verde-lime distinto da `success`.

I temi rimossi (Solaris, Cremisi, Rosato, Veridiano, Bosco, Etere, Notturno, Celeste) vengono convertiti al più vicino da `resolveTheme`.

**Key Characteristics:**
- Fondo scuro tonale, card un gradino più chiare, bordi sottili semitrasparenti.
- Un solo accento per tema, usato per azioni primarie, stato attivo e icone dei valori.
- Titoli incisi (Norse per il marchio, Cinzel per i titoli di gruppo e delle finestre), testo e dati in Inter, valori numerici in monospace.
- Angoli morbidi: 12px sui controlli, 16px sui riquadri interni, 24px sulle tessere.
- Bagliore dell'accento solo come segnale di stato.

## Colors

Palette scura e neutra con un unico accento caldo che cambia per tema; i ruoli sono fissi, i valori variano.

### Primary
- **Ambra Runica** (accent): azione primaria, tab e voce attiva, icone dei valori, anello di focus. In ogni tema è l'unico colore che chiede attenzione.
- **Ambra Bruciata** (accent-dark): hover e pressione dell'azione primaria.
- **Inchiostro sull'Ambra** (accent-foreground): testo e icone sopra l'accento pieno.

### Neutral
- **Notte di Pergamena** (background): fondo dell'app e degli input (al 50% con sfocatura).
- **Pagina Scura** (card): card, sezioni, finestre di dialogo, menu, toast.
- **Filo d'Ardesia** (border): bordi di card e separatori; è una linea sottile, non regge da sola il contorno di un controllo.
- **Filo Marcato** (border-strong): contorno di pulsanti secondari e controlli (≥ 3:1 sulla card).
- **Pietra Levigata** (input): fondi di campi e superfici "muted" (alias `muted`).
- **Avorio Spento** (text): testo corrente.
- **Bianco Inciso** (foreground): valori numerici e titoli che devono emergere.
- **Cenere** (text-muted): etichette, testo secondario, icone a riposo (alias `muted-foreground`).

### Stato
- **Rosso Sangue** (destructive): elimina, errori, HP critici. Nei temi scuri è un rosso chiaro che si legge come testo sulla card e porta testo scuro (`destructive-foreground`) quando fa da fondo.
- **Verde Vita** (success) e **Arancio d'Allarme** (warning): esiti e avvisi. Condivisi dai temi scuri; Pergamena li ridefinisce più scuri. Il warning è arancio, non ambra, per non confondersi con l'accento del tema predefinito.
- **Velo** (scrim) e **Ombra** (shadow): colore del velo dietro le finestre e delle ombre; neri nei temi scuri, bruni in Pergamena.

### Named Rules
**The One Ink Rule.** Ogni tema ha un solo accento. Nuovi colori di ruolo non si aggiungono nei componenti: se serve un significato nuovo, diventa un token in `src/index.css` per tutti i temi.

**The Token-Only Rule.** Nessun colore Tailwind fisso (`purple-500`, `zinc-800`, `#hex`) nei componenti: rimossi nella Fase C; solo eccezioni documentate. Si usa sempre un ruolo (`bg-card`, `text-accent`, `border-border/50`).

## Typography

**Display Font:** Norse (con serif), font locale in `src/assets/fonts/`
**Headline Font:** Cinzel (con serif), da Google Fonts
**Body Font:** Inter (con sans-serif), da Google Fonts
**Numeric Font:** monospace di sistema

**Character:** Norse e Cinzel portano l'incisione e la storia; Inter tiene tutto leggibile e moderno. Il contrasto tra titolo antico e dato preciso è il cuore del sistema.

### Hierarchy
- **Display** (Norse 700, 36px/24px su mobile, 48px/30px da `sm`, tracking ampio): solo il marchio "RUNICA" nell'header. La runa accanto è un'icona SVG (`RuneMarkIcon`), non un carattere.
- **Headline** (Cinzel 700, 20px, `text-headline`): titoli di finestre di dialogo e di pagina.
- **Title** (Cinzel 400, 18px, `text-title`, in `foreground`): titoli di **gruppo** dentro un pannello (`playGroupTitleClass`, es. "Incantesimi" in Statistiche di combattimento, "Tratti e ideali" in Personalità). Il titolo del pannello non è Cinzel: è un'etichetta (vedi sotto).
- **Titolo di pannello** (`PlaySection`/`StyledSection`, uguale in gioco e nell'editor): `text-label` maiuscolo, `tracking-widest`, `muted-foreground`, con icona. Va a capo su due righe invece di troncarsi quando ha un'azione accanto ("Attacchi e trucchetti" + "Aggiungi" a 375px).
- **Body** (Inter 400, 16px, 1.5): testo corrente, campi di input.
- **Body small** (Inter 400–600, 14px): pulsanti, tab, liste, toast. È il testo più usato nell'app insieme a label.
- **Label** (Inter 600, 12px, maiuscolo, tracking 0.08em, `text-label`): etichette dei campi e intestazioni brevi.
- **Numeric** (mono 700, 24px → 30px da `sm`, cifre tabellari, `text-numeric`): HP, CA, bonus e ogni valore da leggere a distanza.

I ruoli con una classe (`text-headline`, `text-title`, `text-label`, `text-numeric`) sono definiti in `tailwind.config.js`. Nessun testo sotto i 12px nel codice nuovo.

### Named Rules
**The Engraved Titles Rule.** Norse è riservato al marchio; Cinzel ai titoli. Mai Norse o Cinzel per testo corrente, valori o etichette.

**The Readable Number Rule.** Un valore di gioco si mostra in monospace bold, almeno 24px, con l'etichetta sotto in piccolo. Il numero viene prima della parola.

## Layout

- Contenitore pagina: larghezza massima 1280px (`max-w-7xl`), centrato, padding 16px su mobile e 24–32px da `sm` (640px).
- Ritmo verticale tra pannelli 12px (16px da `sm`), come la griglia bento; spaziatura interna tra elementi 8–12px; tessere con padding 16–20px.
- Breakpoint Tailwind standard (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Si progetta da mobile e si aggiungono colonne salendo.
- Header fisso in alto, alto 56px su mobile e 64px da `sm` (`--header-h`), più la tacca del telefono. Gli elementi sticky sotto l'header usano `top-header`, mai un valore fisso.
- Aree sicure: `viewport-fit=cover`; l'header aggiunge la tacca in alto, il `body` quelle laterali, `pb-safe` quella in basso.
- Vista di gioco: tab orizzontali scorrevoli senza barra (`no-scrollbar`); padding inferiore extra (96px) per non coprire contenuti con i toast e la barra di sistema.
- Finestre di dialogo: ancorate in basso su mobile, centrate da `sm`.

## Elevation & Depth

Profondità tonale a strati: fondo → card → campo. Ogni superficie porta un filo di luce sul bordo alto (`--highlight`, `inset 0 1px 0 rgb(255 255 255 / 0.06)`; 0.55 in Pergamena) e un bordo semitrasparente al 55%, invece di bordi pesanti. Le ombre sono deboli e servono a separare i livelli; la luce colorata (bagliore dell'accento) è un segnale di stato.

### Atmosfera
- **Luce ambientale** (`body::before`): due ellissi radiali dell'accento del tema in alto (`--ambient-strength`: 17% nei temi scuri, 10% in Pergamena; l'app non deve avere un fondo pieno sopra il `body`, altrimenti la luce sparisce), fisse dietro il contenuto. Cambia con il tema.
- **Grana** (`body::after`): velo di rumore fisso, già descritto in `index.css`.
- **`.surface`**: card tonale con velo d'accento in alto, bordo `foreground` al 9%, filo d'accento sul bordo alto (`::before`) e ombra `rest`; è la superficie di pannelli, header dell'eroe, card dei personaggi e "Nuovo eroe".
- **`.tile`** (vista di gioco **ed editor**, direzione bento): superficie senza bordo, angoli 24px (`1.5rem`), fondo card al 72% con sfocatura 14px, gradiente tonale e filo di luce interno (`inset` 1px). Varianti: **`.tile-hero`** (campo d'accento pieno dall'angolo alto sinistro, per la CA) e **`.tile-danger`** (campo `destructive`, per i punti vita). La tessera si distingue per il salto tonale, non per il bordo.
- **`.hero-glow`**: velo caldo d'accento dall'angolo alto sinistro, solo dietro l'header dell'eroe.
- **`.glass-pill`**: vetro (sfocatura 16px, fondo card all'82%, bordo marcato) per i controlli che galleggiano.

### Modern Arcane (filigrana e luce)
- **`RuneOrnaments`** (`components/ui/RuneOrnaments.tsx`): `AstrolabeRing` (anello con tacche, rotazione 60s, `.rune-spin`) come filigrana nell'header dell'eroe e attorno al monogramma delle card; `CornerGlyphs` (quattro angoli a L con rombo) è la cornice attiva delle card, visibile solo in hover/focus o con `data-active`. `RuneDivider glyph="notch"` è il separatore con incavo centrale: separa i sottogruppi di uno stesso pannello (prima del titolo di gruppo Cinzel), al massimo due per scheda dell'editor; il `RuneDivider` semplice separa i pannelli di una pagina.
- **Bordo di luce**: `.tile` e `.surface` hanno un gradiente da 1px (`::after`, maschera) che cattura la luce dall'alto.
- **Barra HP** (`.hp-fill`, `data-tone` da `hpTone`): gradiente per stato, riflesso interno, tacche e un velo luminoso (`.hp-sheen`) quando il valore cambia.
- **Sigilli e tiri contro la morte**: l'accensione incide la runa (rotazione + scala del punto) e accende la luce con una transizione, quindi niente lampi al montaggio.
- **Tab**: `.tab-indicator` scorre sotto la voce attiva (PlayView lo posiziona). **Dadiera**: `.dice-tumble` durante il tiro, `.result-flash` sul risultato. Vetro: sticky nav e `Modal` con sfocatura e saturazione.
- Tutte le animazioni usano `transform`/`opacity`/`box-shadow` e si fermano con `prefers-reduced-motion`.

### Shadow Vocabulary
Le ombre sono token (`src/index.css`, classi in `tailwind.config.js`) con il colore del tema: nere nei temi scuri, brune e più leggere in Pergamena. Hanno sempre scostamento e sfocatura.
- **Separazione leggera** (`shadow-rest`): pulsanti pieni, campi e card a riposo.
- **Livello rialzato** (`shadow-raised`): menu e toast.
- **Livello sospeso** (`shadow-floating`): finestre e conferme, sopra il velo (`bg-scrim/70`) sfocato.
- **Luce d'accento** (`shadow-glow`): ombra colorata proiettata in basso; solo in hover/focus dell'azione primaria. L'indicatore della tab attiva ha il suo (`0 0 8px rgb(accent / 0.6)`).
- **Header:** nessuna ombra; lo separa un bordo inferiore.

### Livelli (z-index)
`z-header` 50 · `z-modal` 100 (finestre) · `z-dialog` 105 (conferme, sopra la finestra che le apre) · `z-toast` 110.

### Named Rules
**The Glow-Means-State Rule.** Il bagliore dell'accento compare solo su elementi attivi o in hover/focus. A riposo nessun elemento brilla: l'azione primaria si distingue per il fondo pieno in accento. Le eccezioni sono l'atmosfera fissa (luce ambientale, `.hero-glow`) e la dadiera, unico controllo flottante, in vetro.

**The One Elevation Rule.** Un livello si dichiara con il bordo o con l'ombra. A riposo basta il bordo; l'ombra ampia è per ciò che galleggia sopra un velo. Eccezione: vista di gioco ed editor usano `.tile`, che non ha bordo e si definisce solo con il salto tonale e la luce interna.

**The Borderless-Bento Rule.** Nella vista di gioco e nell'editor niente scatole con bordo: le tessere sono superfici stratificate (`.tile`), righe e gruppi di campi sono riquadri interni senza bordo (`playInsetClass`, `fieldGroupClass`), e nessuna `.tile` si annida in un'altra (`BentoStat inset`). Il contorno resta solo sui **campi** (`fieldControlOnTileClass`), perché un campo deve sembrare scrivibile; l'accento compare come anello (`ring`) solo su focus, stato attivo o critico.

## Shapes

Angoli morbidi e costanti: 24px (`.tile`) per pannelli e tessere bento, 16px (`rounded-2xl`) per riquadri interni, immagini, card della lista e dialoghi, 12px (`rounded-xl`) per controlli, campi e miniature, cerchio pieno per avatar, pallini di stato e pillole. `rounded-md`/`rounded-lg` solo su chip e miniature ≤ 40px, mai su contenitori. Bordi da 1px quasi sempre in `border` semitrasparente; l'accento compare sul bordo solo in hover/focus/attivo.

## Components

### Buttons
Tattili e decisi: si abbassano leggermente alla pressione (scala 0.97).
- **Shape:** angoli morbidi (12px per `md`/`icon`, 8px per `sm`, 16px per `lg`).
- **Primary:** fondo accento, testo `accent-foreground`, 14px semibold, altezza 40px, nessun bagliore a riposo.
- **Hover / Focus:** fondo `accent-dark` e luce d'accento (`shadow-glow`); focus con anello di 2px in accento distanziato dal fondo.
- **Secondary:** fondo card con bordo `border-strong`; in hover bordo e testo passano all'accento.
- **Ghost:** solo testo `text-muted`; in hover testo pieno e fondo muted al 60%.
- **Destructive:** fondo `destructive`, testo `destructive-foreground` (scuro nei temi scuri).
- **Destructive outline:** bordo e testo `destructive`, per azioni pericolose che non devono gridare a riposo (zona pericolosa delle impostazioni).
- **Disabled:** opacità 50%, nessuna interazione.
- Taglie: `sm` 32px, `md` 40px, `lg` 48px, `icon` 40×40, `icon-lg` 44×44. Nella vista di gioco e nella barra superiore preferire `md`, `lg` o `icon-lg`.
- Gli stili `hover:` valgono solo con un puntatore (`hoverOnlyWhenSupported`): sul telefono non restano accesi dopo il tocco. Transizioni di 150ms con la curva `ease-soft`, senza rimbalzo.

### Cards / Containers
Un solo guscio per entrambe le viste del personaggio (gioco ed editor): **`PlaySection`** (`play-view/PlaySection.tsx`). `StyledSection` dell'editor è un alias che lo renderizza (prop `action` → `aside`, `icon`).
- **Superficie:** `.tile`, angoli 24px, padding 16px (20px da `sm`), nessun bordo.
- **Titolo:** etichetta maiuscola con icona; a destra un'azione o un valore. Il titolo va a capo, mai troncato.
- **Dentro:** riquadri `playInsetClass` (righe, valori, gruppi), gruppi di campi `fieldGroupClass` (stesso fondo, senza bordo), sottogruppi con titolo `playGroupTitleClass` (Cinzel) preceduti da `RuneDivider glyph="notch"`.
- **Ritmo:** gap fra pannelli 12px (16px da `sm`), dentro un pannello 12px, fra sottogruppi 20px.
- `.surface` (bordo + ombra) resta per la lista personaggi, le campagne e le card degli eroi.

### Inputs / Fields
Un'unica fonte: `components/ui/field.ts`.
- **Sopra una `.tile` o in una finestra dell'editor** (`fieldControlOnTileClass`, usato da `StyledInput`, `StyledTextArea`, `StyledSelect` e dai form di oggetti, attacchi, incantesimi, compagni): fondo `background` al 60% (niente "buchi" pieni sulla tessera vetrata), contorno `border-strong` al 50%, angoli 12px, padding 10px × 12px, testo 16px; etichetta sopra in stile Label. `fieldNumericClass` ne è la variante numerica centrata; `fieldShellOnTileClass` è il guscio dei campi composti (`StatInput`, valore con passi +/−).
- **Fuori dall'editor** (`fieldControlClass`/`fieldInputClass`, ricerca e form delle campagne): fondo pieno `background`, contorno `border-strong` al 60%.
- **Focus:** bordo accento pieno e anello accento al 20% (2px); l'icona interna diventa accento.
- **Hover:** contorno `border-strong` pieno.
- **Disabled:** opacità 50%, cursore non consentito.
- Input numerici senza frecce (`no-spinner`); i passi si fanno con pulsanti dedicati.
- Caricatori d'immagine (ritratto, compagno): `rounded-2xl bg-input` senza bordo, anello d'accento solo in hover/focus.

### Navigation
- **Header:** fisso, fondo all'85% con sfocatura (l'unico vetro a riposo, perché il contenuto vi scorre sotto), bordo inferiore `border`, nessuna ombra. Marchio Norse in accento con la runa in un riquadro, come link alla lista. Controlli: `Button` ghost o secondary, mai l'accento pieno (quello resta all'azione principale della pagina). Online non mostra nulla; offline compare una pillola `warning` calma, senza pulsazione. Avatar circolare con `Menu`; senza foto mostra l'iniziale.
- **Tab (vista di gioco ed editor):** `PillTabBar` (`play-view/PillTabBar.tsx`), sticky sotto l'header (`top-header`): pillola piena `rounded-full` (card all'80% con sfocatura, senza bordo) che scorre in orizzontale, voci `TabButton variant="pill"` da 40px; la voce attiva ha fondo accento al 15% e anello, con `.tab-indicator` che scorre sotto. Solo la finestra Campagne usa ancora la variante con barra di 2px sotto. Ruoli ARIA `tab` / `tabpanel`.
- **Header dell'eroe:** `HeroHeader` (`play-view/HeroHeader.tsx`), condiviso: completo nella vista di gioco, `compact` nell'editor (ritratto piccolo, sottotitolo "Nuovo eroe"/"Modifica della scheda" e stato non salvato, azioni a destra: menu e Salva). In entrambi c'è l'`AstrolabeRing` di filigrana. Su telefono l'editor mostra Salva come pillola flottante in vetro in basso a destra.

### Dialogs & Toasts
- **Modal** (`components/ui/Modal`): guscio unico delle finestre. Velo `scrim` al 70% sfocato; pannello card con bordo, ancorato in basso a tutta larghezza su mobile (entrata `sheetIn`, 240ms) e centrato da `sm` (`popIn`, 180ms); titolo Cinzel, chiusura da 44px, barra opzionale sotto il titolo (le tab della finestra Campagne), corpo scorrevole, piede opzionale per le azioni. Chiude con Esc, con il pulsante e toccando il velo; tiene il focus nel pannello e lo restituisce a chi l'ha aperto. Le finestre nuove usano questo guscio, non un `<dialog>` né un overlay scritto a mano.
- **Conferma** (`confirmDialog`, `alertDialog`): stesso velo, larghezza massima 448px, pulsanti impilati su mobile e allineati a destra da `sm`; sta sopra le finestre (`z-dialog`).
- **Toast:** card piena, angoli 12px, pallino colorato per variante; sopra la barra inferiore su mobile, in basso a destra da `sm`.
- **Visore immagini** (`ImageModal`): fondo nero in ogni tema (eccezione alla Token-Only Rule: un'immagine si guarda sul nero).

### Schede personaggio (lista e gruppo)
`CharacterCard` (lista degli eroi). Su telefono sono righe compatte (miniatura da 88px a sinistra, nome, punti vita, classe armatura) per vedere più eroi senza scorrere; da `sm` diventano card con il ritratto 16:10 in alto. Il nome sta sotto il ritratto, mai sovrapposto all'immagine.
- Tutta la scheda apre il personaggio. Su telefono resta visibile solo il menu; da `sm` c'è anche "Gioca", secondario a riposo, che prende l'accento quando si punta la card.
- Hover (solo con puntatore): la card sale di 2px, bordo in accento, `shadow-raised`; il ritratto scala a 1.03. Nessuna inclinazione, nemmeno durante il trascinamento.
- Segnaposto del ritratto (`.portrait-rune` + `.monogram`): reticolo a rombi sottilissimo, luce calda d'accento in alto a sinistra e monogramma Cinzel inciso (ombra chiara sotto, scura sopra). Stesso segnaposto nell'header della vista di gioco.
- "Nuovo eroe" in griglia è una carta compatta (`.surface`, rombo con il più) che non si allunga alla riga; l'intestazione "I tuoi eroi" è seguita da un `RuneDivider`.
- Barra dei punti vita: verde sopra metà, arancio fino a un quarto, rosso sotto (`hpBarTone`). L'etichetta è "Punti vita" ("PV" su telefono).
- In una pagina con più schede l'unico fondo pieno in accento è l'azione della pagina ("Nuovo eroe"); a lista vuota passa all'invito al centro.

### Vista di gioco
- **Header dell'eroe**: `.tile` con `.hero-glow`, ritratto (anello d'accento `ring-2`) o segnaposto inciso, nome in `font-norse` 24–36px `font-black`, azioni a destra: "Combatti" (porta alla scheda Combattimento), Riposo lungo, Modifica, menu.
- **Griglia bento della Panoramica** (`MainTabView`): 6 colonne su telefono, 12 da `lg`. I punti vita occupano tutta la larghezza (due righe da `lg`, 6 colonne); CA (`hero`) e Iniziativa sono tessere grandi (`BentoStat`, numero 60–72px, 3 colonne); Velocità, Competenza e Percezione passiva sono tessere compatte (`small`, numero 30–36px, 2 colonne). Sotto: condizioni, tiri contro la morte, dadi vita, difese, lingue. Gap 12px (16px da `sm`).
- **Tessera bento** (`BentoStat`, condivisa in `components/ui/BentoStat.tsx`): etichetta `text-label` maiuscola a sinistra, icona accento a destra (opzionale), numero monospace `font-black` in basso. Varianti: `hero` (CA), `small` (30–36px), `inset` (riquadro `playInsetClass` invece di una `.tile`, per i valori dentro un pannello: Statistiche di combattimento, Libro degli incantesimi) e `manual` (override: chip "Manuale" e numero in `warning`). `StatBox` e `.frame-rune` sono stati ritirati.
- **Punti vita** (`.tile-danger`): numero da 96–128px (`text-8xl`/`sm:text-9xl`), barra da 12px con dieci tacche, luce del colore di stato e PV temporanei in accento; a 0 PV anello `destructive`. Campo quantità e scorciatoie +1/+5/+10 hanno fondo pieno, senza bordo; Danno / Cura / Temp sono pulsanti tinti (disattivati: opacità 60%).
- **Tiri contro la morte**: tre `.check-rune` grandi (`data-size="lg"`) per riga, `data-tone` `success` / `destructive` (bordo tinto anche da vuote).
- **Sigilli** (`.seal`): dadi vita, slot incantesimo, risorse e usi dei privilegi; rombo pieno con luce d'accento = disponibile, vuoto = speso; variante `data-size="lg"` (1.6rem) nella vista di gioco.
- **Pannello** (`play-view/PlaySection`): guscio unico delle schede. Superficie `.tile`, padding 16px (20px da `sm`), titolo `text-label` maiuscolo con spaziatura larga in `muted-foreground` (icona opzionale), azione o valore a destra. Dentro un pannello non si annidano altre card: righe e riquadri interni usano `playInsetClass` (fondo `background` al 50%, senza bordo, `rounded-2xl`), le etichette `playLabelClass` (`text-label` maiuscolo), i dati secondari `playChipClass`.
- **Scelta esclusiva** (`components/ui/SegmentedControl`): modalità del tiro (normale, vantaggio, svantaggio) e filtri degli incantesimi; `radiogroup` con voci da 36px in un contenitore da 40px.
- **Risorse a segni** (dadi vita, slot incantesimo, risorse personalizzate): il sigillo pieno in accento è una risorsa disponibile, quello vuoto è spesa; ogni sigillo ha un bersaglio di 40–44px.
- **Valori**: monospace bold con cifre tabellari; l'etichetta sta sotto o sopra in `text-label`. Negli attacchi "Colpire" e "Danno" sono due colonne con il dettaglio del calcolo in piccolo sotto.
- **Stati di gioco**: verde per successi e colpo critico, rosso per fallimenti, 1 naturale e condizioni attive. Nessun bagliore: basta il fondo pieno o tenue del colore di stato.
- **Dadiera**: finestra `Modal` oppure pillola flottante in vetro (`.glass-pill`, 56px) in basso a destra con il d20 su un disco accento (su telefono solo il disco); aperta, il pannello si apre sopra la pillola (a tutta larghezza su telefono, 320px da `sm`). Il risultato sta in alto, il pulsante "Lancia" in basso, vicino al pollice.
- **Icone**: niente emoji; `SwordIcon` è disegnata come due spade incrociate; il tipo di oggetto usa `SwordIcon`, `ShieldIcon`, `SparklesIcon`, `BackpackIcon`.

### Campagne al tavolo (`/campaigns/:id`)
Stessi pezzi della vista di gioco, niente `.surface`: `HeroHeader` (nome della campagna, ruolo, dettaglio e pillola **Dal vivo** `success` / **Offline** `warning`, calma, senza pulsazione), `PillTabBar`, `PlaySection`.
- **Live Board del DM** (`DmLiveBoard`): tab Tavolo · Bacheca · Note segrete · Gruppo. Sul Tavolo una barra d'azioni in vetro (`.glass-pill`, sticky sotto i tab: unico controllo che galleggia) con Ispirazione ▾, Riposo breve, Riposo lungo; ordinamento per nome o PF più bassi (`SegmentedControl`); griglia di tessere a 1 colonna su telefono, 2 da `md`, 3 da `xl`.
- **`PartyMemberTile`**: una `PlaySection` per eroe. Riga identità (ritratto 48px o segnaposto inciso, nome Cinzel, classe · razza, giocatore) che apre il dettaglio (`Modal`), interruttore dell'ispirazione da 44px (accento al 20% con anello quando attiva); PF in monospace con `HpBar` (`md`, condivisa con `HPTracker`); `BentoStat inset small` per CA, Velocità e CD; passive in una riga `playInsetClass`; slot come sigilli; condizioni come chip `destructive`; tiri contro la morte solo a 0 PF; "aggiornato … fa" (in `warning` oltre 10 minuti) e chip "… in attesa" per le azioni non ancora applicate. A 0 PF anello `destructive`.
- **Stati narrativi** (`VitalsBadge`, `VitalsBar`): chip Sano `success`, Ferito `warning`, Critico e A terra `destructive`, più una barra a quattro gradini senza numeri; il colore non è mai l'unica informazione.
- **Party Hub del giocatore** (`PartyHub`): tab Gruppo · Bacheca; il proprio eroe in cima (con "Apri la tua scheda"), poi "I compagni" con `RuneDivider glyph="notch"`. Nel sottotitolo "siedi come …" ▾ apre il cambio di personaggio.
- **Bacheca** (`CampaignBoard`): composizione in un pannello, messaggi in righe `playInsetClass` (i fissati con anello d'accento e puntina), azioni nel menu "⋯".
- **Toast con azione** (`toast.action`): pulsante testuale in accento a destra ("Annulla", "Riposa"), dura 10 s.

### Stampa (`/character/:id/print`)
- Attorno al foglio vale lo stile dell'app: barra sticky in vetro (`PrintToolbar`, come l'header) con indietro, titolo Cinzel, conteggio pagine e "Stampa / PDF" primario; i fogli stanno sul fondo del tema con la luce ambientale ed etichetta di pagina sopra ciascuno. Niente di tutto questo esce in stampa (`print:hidden`, `display: contents`).
- Il foglio non segue il tema: i suoi colori sono variabili (`--ink`, `--pearl`, `--paper`…) in `printStyles` e negli ornamenti SVG (classi `o-ink`/`o-pearl`/`o-paper`/`o-solid`). Stili carta: **Inchiostro** (B/N, predefinito), **Grimorio** (carta calda, filetti seppia), **Alto contrasto** (solo nero).
- Opzioni (`printOptions.ts`, stile/valori/zoom salvati nel browser): valori **Compilata** o **A matita**, contenuto **Incantesimi** (riporta quelli della scheda; spenta, la sezione resta da compilare a mano), **Note** (riquadro "Note e appunti di campagna": al posto della sezione incantesimi se questi sono esclusi, altrimenti in una pagina in più; entrambe automatiche in base al personaggio) e Compagni, zoom Adatta/50–150% (CSS `zoom`, azzerato in stampa).

### Campi fuori dall'editor
Ricerca e form delle campagne usano `fieldControlClass`/`fieldInputClass` di `components/ui/field.ts` (fondo pieno, contorno `border-strong`); l'editor del personaggio usa `fieldControlOnTileClass` (vedi Inputs / Fields). Testo a 16px ovunque (sotto, iOS ingrandisce la pagina al focus), focus con bordo e anello in accento.

## Do's and Don'ts

### Do:
- **Do** usare solo i ruoli colore (`bg-card`, `text-accent`, `border-border/50`…) perché ogni tema funzioni.
- **Do** aggiungere un nuovo token in tutti i blocchi `theme-*` di `src/index.css` e in `tailwind.config.js`.
- **Do** usare `Button`, `Modal`, `Menu`, `StyledInput`, `PlaySection`/`StyledSection`, `BentoStat`, `HeroHeader`, `PillTabBar`, `TabButton`, `Dialogs` prima di scrivere nuovi stili.
- **Do** verificare il contrasto di un nuovo colore in tutti e sei i temi (testo ≥ 4.5:1, contorni dei controlli ≥ 3:1).
- **Do** mostrare i valori di gioco in monospace bold ≥24px con etichetta sotto.
- **Do** dare ai controlli della vista di gioco un bersaglio di almeno 40px (meglio 48px).
- **Do** mantenere gli angoli a 12px per controlli, 16px per riquadri interni e 24px per le tessere.

### Don't:
- **Don't** usare colori Tailwind fissi o esadecimali nei componenti.
- **Don't** mettere bagliore, vetro o bordo animato su elementi a riposo, o su più di un elemento per schermata.
- **Don't** usare `text-white` o `bg-black` sopra un colore di ruolo: il testo su `accent` è `accent-foreground`, su `destructive` è `destructive-foreground`.
- **Don't** usare un carattere Unicode come icona (la runa del marchio è `RuneMarkIcon`).
- **Don't** usare Norse fuori dal marchio, né Cinzel per testo corrente o numeri.
- **Don't** introdurre un secondo colore d'accento in un tema.
- **Don't** creare pulsanti con classi ad hoc quando una variante di `Button` copre il caso.
