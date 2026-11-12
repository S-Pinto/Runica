---
name: Runica
description: Scheda personaggio D&D 5e per il tavolo, scura e incisa, con un solo accento luminoso.
colors:
  background: "rgb(24 24 27)"
  foreground: "rgb(250 250 250)"
  card: "rgb(39 39 42)"
  border: "rgb(63 63 70)"
  input: "rgb(82 82 91)"
  text: "rgb(228 228 231)"
  text-muted: "rgb(161 161 170)"
  accent: "rgb(245 158 11)"
  accent-dark: "rgb(180 83 9)"
  accent-foreground: "rgb(24 24 27)"
  destructive: "rgb(239 68 68)"
  destructive-foreground: "rgb(255 255 255)"
  success: "rgb(34 197 94)"
  warning: "rgb(245 158 11)"
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
  section-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  stat-box:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.numeric}"
    rounded: "{rounded.2xl}"
    padding: "14px"
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

La superficie è piatta e calma a riposo. Vetro smerigliato e bagliori esistono nel sistema, ma sono una risposta a uno stato (attivo, hover, focus, azione primaria), non decorazione di fondo. I controlli sono tattili e generosi, pensati per un pollice durante la partita: bersagli ampi, feedback di pressione visibile, valori leggibili a colpo d'occhio.

Il sistema è multi-tema: tutti i colori passano da variabili CSS e ogni tema (`theme-*`) ridefinisce la stessa serie di ruoli. I valori nel frontmatter sono quelli del tema predefinito **Amber**.

**Key Characteristics:**
- Fondo scuro tonale, card un gradino più chiare, bordi sottili semitrasparenti.
- Un solo accento per tema, usato per azioni primarie, stato attivo e titoli di sezione.
- Titoli incisi (Norse per il marchio, Cinzel per le sezioni), testo e dati in Inter, valori numerici in monospace.
- Angoli morbidi (12–16px) su controlli e contenitori.
- Bagliore dell'accento solo come segnale di stato.

## Colors

Palette scura e neutra con un unico accento caldo che cambia per tema; i ruoli sono fissi, i valori variano.

### Primary
- **Ambra Runica** (accent): azione primaria, tab e voce attiva, titoli delle sezioni, icone dei valori, anello di focus. In ogni tema è l'unico colore che chiede attenzione.
- **Ambra Bruciata** (accent-dark): hover e pressione dell'azione primaria.
- **Inchiostro sull'Ambra** (accent-foreground): testo e icone sopra l'accento pieno.

### Neutral
- **Notte di Pergamena** (background): fondo dell'app e degli input (al 50% con sfocatura).
- **Pagina Scura** (card): card, sezioni, finestre di dialogo, menu, toast.
- **Filo d'Ardesia** (border): bordi di card e campi, normalmente al 30–60% di opacità.
- **Pietra Levigata** (input): fondi di campi e superfici "muted" (alias `muted`).
- **Avorio Spento** (text): testo corrente.
- **Bianco Inciso** (foreground): valori numerici e titoli che devono emergere.
- **Cenere** (text-muted): etichette, testo secondario, icone a riposo (alias `muted-foreground`).

### Stato
- **Rosso Sangue** (destructive): elimina, errori, HP critici.
- **Verde Vita** (success) e **Ambra d'Allarme** (warning): esiti e avvisi; condivisi da tutti i temi.

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
- **Display** (Norse 700, 48px/30px, tracking ampio): solo il marchio "RUNICA" e la runa ᚱ nell'header.
- **Headline** (Cinzel 700, 20px): titoli di finestre di dialogo e di pagina.
- **Title** (Cinzel 400, 18px, colore accento): titoli di sezione (`StyledSection`).
- **Body** (Inter 400, 16px, 1.5): testo corrente, campi di input.
- **Body small** (Inter 400–600, 14px): pulsanti, tab, liste, toast. È il testo più usato nell'app insieme a label.
- **Label** (Inter 700, 12px, maiuscolo, tracking 0.1em): etichette dei campi e intestazioni brevi.
- **Numeric** (mono 700, 24px → 30px da `sm`): HP, CA, bonus e ogni valore da leggere a distanza.

### Named Rules
**The Engraved Titles Rule.** Norse è riservato al marchio; Cinzel ai titoli. Mai Norse o Cinzel per testo corrente, valori o etichette.

**The Readable Number Rule.** Un valore di gioco si mostra in monospace bold, almeno 24px, con l'etichetta sotto in piccolo. Il numero viene prima della parola.

## Layout

- Contenitore pagina: larghezza massima 1280px (`max-w-7xl`), centrato, padding 16px su mobile e 24–32px da `sm` (640px).
- Ritmo verticale tra sezioni 24px (a volte 32px); spaziatura interna tra elementi 8–12px; card con padding 14–20px.
- Breakpoint Tailwind standard (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Si progetta da mobile e si aggiungono colonne salendo.
- Header fisso in alto, alto 80px, sfocato.
- Vista di gioco: tab orizzontali scorrevoli senza barra (`no-scrollbar`); padding inferiore extra (96px) per non coprire contenuti con i toast e la barra di sistema.
- Finestre di dialogo: ancorate in basso su mobile, centrate da `sm`.

## Elevation & Depth

Profondità tonale a strati: fondo → card → campo, con bordi semitrasparenti. Le ombre sono deboli e servono a separare i livelli; la luce colorata (bagliore dell'accento) è un segnale di stato.

### Shadow Vocabulary
- **Separazione leggera** (`shadow-sm`): campi e card a riposo.
- **Livello sospeso** (`shadow-xl` / `shadow-2xl`): toast e finestre di dialogo, con velo `rgb(0 0 0 / 0.7)` e sfocatura sotto.
- **Header** (`0 8px 32px rgba(0,0,0,0.37)`): solo la barra superiore.
- **Bagliore d'accento** (`0 0 20px rgb(accent / 0.25)`, hover `0 0 28px rgb(accent / 0.4)`): azione primaria e indicatore della tab attiva (`0 0 8px rgb(accent / 0.6)`).

### Named Rules
**The Glow-Means-State Rule.** Il bagliore dell'accento, il vetro e il bordo animato (`animated-border-card`) compaiono solo su elementi attivi, in hover/focus o sull'unica azione primaria della vista. Mai su più di un elemento a riposo per schermata.

## Shapes

Angoli morbidi e costanti: 12px (`rounded-xl`) per controlli e campi, 16px (`rounded-2xl`) per card, sezioni e dialoghi, 8px per elementi piccoli in liste, cerchio pieno per avatar, pallini di stato e pillole. Bordi da 1px quasi sempre in `border` semitrasparente; l'accento compare sul bordo solo in hover/focus/attivo.

## Components

### Buttons
Tattili e decisi: si abbassano leggermente alla pressione (scala 0.97).
- **Shape:** angoli morbidi (12px per `md`/`icon`, 8px per `sm`, 16px per `lg`).
- **Primary:** fondo accento, testo `accent-foreground`, 14px semibold, altezza 40px, bagliore dell'accento.
- **Hover / Focus:** fondo `accent-dark` e bagliore più ampio; focus con anello di 2px in accento distanziato dal fondo.
- **Secondary:** fondo card con bordo; in hover bordo e testo passano all'accento.
- **Ghost:** solo testo `text-muted`; in hover testo pieno e fondo muted al 40%.
- **Destructive:** fondo rosso pieno, testo bianco.
- **Disabled:** opacità 50%, nessuna interazione.
- Taglie: `sm` 32px, `md` 40px, `lg` 48px, `icon` 40×40. Nella vista di gioco preferire `md` o `lg`.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** card piena (`StatBox`) o card al 40% con sfocatura (`StyledSection`).
- **Shadow Strategy:** separazione leggera; vedi Elevation.
- **Border:** 1px `border` al 50–60%; in hover passa all'accento al 40%.
- **Internal Padding:** 14–20px.
- Titolo di sezione in Cinzel accento, separato da una linea sottile.

### Inputs / Fields
- **Style:** fondo `background` al 50% con sfocatura, bordo `border` al 50%, angoli 12px, padding 10px × 12px; etichetta sopra in stile Label.
- **Focus:** bordo accento pieno e alone accento al 20% (2px); l'icona interna diventa accento.
- **Hover:** bordo accento al 30%.
- **Disabled:** opacità 50%, cursore non consentito.
- Input numerici senza frecce (`no-spinner`); i passi si fanno con pulsanti dedicati.

### Navigation
- **Header:** fisso, card al 60% con sfocatura forte, bordo inferiore accento al 20%; marchio Norse in accento con la runa ᚱ in un riquadro; indicatore Online/Offline a pillola; avatar circolare con menu.
- **Tab (vista di gioco):** testo 14px semibold muted, attiva in accento con una barra di 2px sotto che si allarga e brilla; in hover la barra cresce dal centro. Ruoli ARIA `tab` / `tabpanel`.

### Dialogs & Toasts
- **Dialog:** velo nero al 70% sfocato, pannello card con bordo, angoli 16px, larghezza massima 448px, titolo Cinzel, pulsanti impilati su mobile e allineati a destra da `sm`; entrata `popIn` (180ms).
- **Toast:** card al 95% sfocata, angoli 12px, pallino colorato per variante; sopra la barra inferiore su mobile, in basso a destra da `sm`.

### Stat Box (firma)
Il valore di gioco come protagonista: numero monospace grande in `foreground`, sotto-valore piccolo accanto, etichetta in muted sotto, icona opzionale in un riquadro accento al 10%. Bordo che si accende in hover.

## Do's and Don'ts

### Do:
- **Do** usare solo i ruoli colore (`bg-card`, `text-accent`, `border-border/50`…) perché ogni tema funzioni.
- **Do** aggiungere un nuovo token in tutti i blocchi `theme-*` di `src/index.css` e in `tailwind.config.js`.
- **Do** usare `Button`, `StyledInput`, `StyledSection`, `StatBox`, `TabButton`, `Dialogs` prima di scrivere nuovi stili.
- **Do** mostrare i valori di gioco in monospace bold ≥24px con etichetta sotto.
- **Do** dare ai controlli della vista di gioco un bersaglio di almeno 40px (meglio 48px).
- **Do** mantenere gli angoli a 12px per controlli e 16px per contenitori.

### Don't:
- **Don't** usare colori Tailwind fissi o esadecimali nei componenti.
- **Don't** mettere bagliore, vetro o bordo animato su elementi a riposo, o su più di un elemento per schermata.
- **Don't** usare Norse fuori dal marchio, né Cinzel per testo corrente o numeri.
- **Don't** introdurre un secondo colore d'accento in un tema.
- **Don't** creare pulsanti con classi ad hoc quando una variante di `Button` copre il caso.
