# Roadmap UI — allineare l'Editor alla Vista di gioco

Audit del 2026-11-13 sul branch `restyling-ui`. Obiettivo: `CharacterSheet` (editor) e `PlayView` devono sembrare lo stesso prodotto ("Il Grimorio Inciso" / Modern Arcane, vedi `DESIGN.md`).
Questo file basta per partire: i percorsi sono relativi a `src/`, i nomi delle classi sono quelli già definiti in `index.css`, `PlaySection.tsx` e `components/ui/field.ts`.

---

## 1. Diagnosi delle divergenze

### 1.1 Mappa dei due sistemi oggi

| Aspetto | PlayView (bento) | Editor / CharacterSheet | Effetto |
|---|---|---|---|
| Guscio di sezione | `PlaySection` → `.tile` (senza bordo, 24px, vetro 72%, luce interna) | `StyledSection` (`ui/StyledInputs.tsx:79`) → `.surface` (bordo foreground 9%, filo d'accento `::before`, ombra `rest`, 16px) | due raggi (24 vs 16px), due modi di separare (salto tonale vs bordo+ombra) |
| Titolo di sezione | `text-label` maiuscolo, `tracking-widest`, muted, icona opzionale | `font-cinzel text-title text-accent` + filetto `h-px bg-border` | gerarchia opposta: in gioco il titolo è discreto, nell'editor è accentato e "inciso" |
| Header pagina | `header.tile.hero-glow` con ritratto, `AstrolabeRing` di filigrana, nome Norse | `EditorHeader`: barra sticky in vetro `bg-background/90 border-b sm:border sm:rounded-2xl`, titolo Cinzel | nessun ritratto, nessun ornamento, l'header dell'editor è una toolbar, non un'intestazione dell'eroe |
| Tab bar | `TabButton variant="pill"` in pillola piena `rounded-full`, `.tab-indicator` | `TabButton` `underline` dentro `nav border-b border-border` (`CharacterSheet.tsx:86`) | due controlli diversi per la stessa funzione (cambio scheda dello stesso personaggio) |
| Valori | `BentoStat` (locale a `MainTabView`), numero `font-black` 60–72px | `StatBox` (`.frame-rune`, cornice con rombo) in `CombatStatsSection`, `Spellbook` | due "firme" per il valore di gioco |
| Riquadri interni | `playInsetClass` (`rounded-2xl bg-background/50`, senza bordo) | righe/form con `border border-border`, `bg-card/80 rounded-lg` (`FeatureList.tsx:35,82`), menu a mano in `CompanionCard.tsx:120` | card annidate con bordo dentro `.surface`: violano Borderless-Bento e One Elevation |
| Campi | quasi assenti (quantità PV: fondo pieno, nessun bordo) | `fieldControlClass` (`components/ui/field.ts`) con bordo `border-strong`, fondo `bg-background`; `StatInput.tsx:40` con bordo proprio | ok come leggibilità, ma il fondo pieno `bg-background` su `.tile` vetrata crea "buchi" neri; tre varianti di campo |
| Ornamenti | `AstrolabeRing` (PlayView, CharacterCard), `CornerGlyphs` (CharacterCard) | nessuno; `RuneDivider` solo in `CharacterSheet.tsx` (tab Principale), `SpellResourcesPanel`, `EquipmentList` | l'editor è "piatto": nessun segno Modern Arcane tranne un divisore |
| Raggi | 24px tile, 16px inset, `rounded-full` tab | 16px surface, 12px campi, 8px (`rounded-lg`/`rounded-md`) in FeatureList, CompanionCard, ItemDisplayList | 4–5 raggi diversi sulla stessa pagina |
| Spaziatura | gap 12px / 16px da `sm`, padding tile 16/20px | `space-y-4 sm:space-y-6`, padding 16/20px, `mb-4` sotto il titolo | ritmo editor più largo (24px) vs gioco (12–16px) |

### 1.2 Componenti condivisi che "cambiano pelle"
- `AttackList.tsx` e `Spellbook.tsx` importano **sia** `StyledSection` **sia** `PlaySection`: lo stesso contenuto ha due gusci diversi a seconda della vista.
- `CompanionTab` (play-view) è montata anche nell'editor (`CharacterSheet.tsx`, tab `companions`): è l'unico pannello bento dentro l'editor, quindi la tab Compagni dell'editor è già diversa dalle altre tab dell'editor.
- `EquipmentList` (editor) usa `StyledSection` + `equipment/ItemDisplayList.tsx`, che a sua volta usa `PlaySection` per alcune parti.

### 1.3 Residui e incoerenze puntuali
- `components/ui/SpotlightCard.tsx`, `AnimatedBorderCard.tsx` (e verosimilmente `FloatingCard.tsx`): nessun import esterno trovato → candidati alla rimozione (verificare con grep prima).
- `FeatureList.tsx`: form e card scritte a mano (`bg-card/80 rounded-lg border`, input non `StyledInput`).
- `CompanionCard.tsx:120`: dropdown manuale invece di `Menu`.
- `EditorHeader.tsx`: trigger del `Menu` con classi ad hoc (bordo `border-strong/60`) invece di `Button variant="secondary" size="icon-lg"`.
- `EditorHeader.tsx`: stato "Modifiche non salvate" in `text-xs` (12px, ok) ma rombo `bg-warning` disegnato a mano.
- Skeleton di caricamento dell'editor (`CharacterSheet.tsx:66`) usa `rounded-2xl bg-muted/30`, non la forma `.tile`.

### 1.4 Mobile
- Editor: header sticky `-mx-4` a tutta larghezza + nav `-mx-4 border-b`: su telefono sono due barre con bordo impilate (≈ 110px fissi), contro una sola pillola nella vista di gioco.
- Griglie editor `lg:grid-cols-2` con `items-start`: su desktop colonne di altezza molto diversa (Vitals vs CombatStats), nessuna griglia a 12 colonne come la bento.
- Campi a 16px (ok per iOS); bersagli da 40px. I pulsanti di riga (elimina/modifica nelle liste) vanno verificati ≥ 40px.

---

## 2. Design Target per l'Editor

Principio: **stessa materia, densità diversa.** L'editor usa le stesse superfici della vista di gioco (`.tile`, senza bordo), ma resta uno strumento di compilazione: niente numeri giganti, niente bagliori, campi sempre riconoscibili.

### Regole

1. **Un solo guscio.** Ogni sezione dell'editor è una `.tile` (padding 16px / 20px da `sm`, raggio 24px). `StyledSection` diventa un alias di `PlaySection` con prop `variant="editor"` (vedi R3); `.surface` resta solo per lista personaggi, campagne e card dell'eroe.
2. **Niente card dentro le tile.** Righe di elenco, gruppi di campi e form inline usano `playInsetClass` (`rounded-2xl bg-background/50`) senza bordo. Il bordo è ammesso solo sui **campi** (vedi R5).
3. **Gerarchia dei titoli (unificata in entrambe le viste):**
   - H1 pagina: nome dell'eroe, `font-norse` solo nell'header dell'eroe (come PlayView). Il marchio resta l'unico altro uso di Norse.
   - H2 sezione (`PlaySection`): `text-label` maiuscolo `tracking-widest` muted + icona accento (come oggi in gioco). Nell'editor si aggiunge **solo** l'icona accento, non il Cinzel accento: così le due viste parlano uguale.
   - H3 sottogruppo dentro una tile (es. "Tiri salvezza" dentro Caratteristiche): `font-cinzel text-title text-foreground` + `RuneDivider glyph="notch"` sotto. Cinzel diventa il titolo di **gruppo**, non di contenitore.
4. **Ornamenti con parsimonia.**
   - `RuneDivider` tra sottogruppi della stessa tile e tra blocchi di tab lunghe (al massimo 2 per tab).
   - `AstrolabeRing` solo come filigrana dell'header dell'eroe nell'editor (stesso header della vista di gioco).
   - `CornerGlyphs` solo su elementi selezionati/attivi (es. oggetto in modifica nell'elenco equipaggiamento, `data-active`), mai a riposo.
5. **Campi leggibili sulla tile vetrata.** Fondo `bg-background/60` (non pieno), bordo `border-strong/50` a riposo (≥ 3:1 resta garantito dal contorno + fondo), focus bordo `accent` + `ring-2 ring-accent/20`. Etichetta sopra `text-label` maiuscolo. Un'unica fonte: `components/ui/field.ts`; `StatInput` e `FeatureList` la usano.
6. **Valori derivati.** Nell'editor un valore calcolato è un `BentoStat` compatto (`small`, 30–36px) promosso a componente condiviso; `StatBox`/`.frame-rune` si ritira (o resta solo in stampa se serve). Gli override (`character.automation.*`) mostrano un chip `playChipClass` "Manuale" e il valore in `text-warning`.
7. **Tab bar unica.** Editor e gioco usano `TabButton variant="pill"` nel contenitore pillola `rounded-full` sticky (stesso markup di `PlayView.tsx:~251`), con `.tab-indicator`. La variante `underline` resta solo nella finestra Campagne.
8. **Header unico.** Estrarre l'header dell'eroe di `PlayView` in `HeroHeader` (tile + `hero-glow` + ritratto + `AstrolabeRing`); l'editor lo usa in modalità compatta (ritratto 48px, sottotitolo "Modifica della scheda" + stato non salvato) con le azioni a destra: Menu (`Button secondary icon-lg`) e **Salva** (unico primario pieno della pagina). Su mobile: header non sticky, sticky solo la pillola delle tab + un pulsante Salva flottante (`glass-pill`, unico vetro a riposo ammesso) in basso a destra.
9. **Ritmo.** Gap tra tile `gap-3 sm:gap-4` (come la bento); dentro una tile `space-y-3`; tra gruppi `space-y-5` con `RuneDivider`. Niente `space-y-6` di pagina.
10. **Raggi.** 24px tile, 16px inset e immagini, 12px campi e pulsanti, `full` per pillole/avatar. Vietati `rounded-md`/`rounded-lg` su contenitori (ammessi su chip e miniature ≤ 40px).
11. **Nessun bagliore a riposo** (Glow-Means-State): nell'editor niente `shadow-glow` se non su focus/hover di Salva.

---

## 3. Piano operativo in fasi atomiche

Ogni fase = un commit (o una PR) su `restyling-ui`. Verifica comune a ogni fase:

```bash
npm run typecheck
npm test
npm run build
```

più controllo visivo con `preview_start` (config `.claude/launch.json`) in 375px e desktop, nei temi Ambra e Pergamena.

### Fase 1 — Fondamenta condivise (nessun cambio visibile)
- `features/character/components/play-view/PlaySection.tsx`: aggiungere prop `as?: 'section' | 'div'` e `id?`; esportare anche `playGroupTitleClass = 'font-cinzel text-title text-foreground'`.
- Spostare `BentoStat` da `play-view/MainTabView.tsx` a `features/character/components/ui/BentoStat.tsx` (export nominato, props invariate); aggiornare l'import in `MainTabView`.
- Estrarre l'header dell'eroe da `PlayView.tsx` (blocco `header.tile.hero-glow`, ~righe 173–245) in `play-view/HeroHeader.tsx` con prop `compact?: boolean` e slot `actions`. `PlayView` lo usa invariato.
- `components/ui/field.ts`: aggiungere `fieldControlOnTileClass` (fondo `bg-background/60`, bordo `border-strong/50`, focus `border-accent ring-2 ring-accent/20`).
- **Verifica**: nessuna differenza visiva in PlayView (screenshot prima/dopo della Panoramica).

### Fase 2 — Guscio delle sezioni dell'editor
- `features/character/components/ui/StyledInputs.tsx`: `StyledSection` renderizza `PlaySection` (titolo label + icona) mantenendo le stesse props (`title`, `action`→`aside`, `className`); aggiungere prop opzionale `icon`.
- Passare un'icona a ogni `StyledSection` in: `editor/IdentitySection.tsx`, `VitalsSection.tsx`, `CombatStatsSection.tsx`, `AbilitiesPanel.tsx`, `SpellResourcesPanel.tsx`, `BioPanel.tsx`, `PersonalityGenerator.tsx`, `AttackList.tsx`, `CategorizedFeatureList.tsx`, `EquipmentList.tsx`, `equipment/CurrencyBanner.tsx`, `Spellbook.tsx` (icone esistenti in `components/ui/icons.tsx`).
- `CharacterSheet.tsx`: `space-y-4 sm:space-y-6` → `space-y-3 sm:space-y-4`; griglie `gap-4 sm:gap-6` → `gap-3 sm:gap-4`; skeleton con classe `tile`.
- **Verifica**: tutte le tab dell'editor senza bordi di contenitore; `AttackList`/`Spellbook` identici tra editor e gioco; contrasto titoli ok in Pergamena.

### Fase 3 — Header e tab dell'editor
- `editor/EditorHeader.tsx`: usare `HeroHeader compact` con azioni `Menu` (trigger = `Button variant="secondary" size="icon-lg"`) e `Button` Salva; stato "non salvato" come chip `playChipClass` con `text-warning`.
- `CharacterSheet.tsx`: sostituire `nav.border-b` + `TabButton` underline con lo stesso contenitore pillola sticky di `PlayView` (`variant="pill"`, `top-header`, `.tab-indicator`). Valutare l'estrazione di `play-view/PillTabBar.tsx` usata da entrambi.
- Mobile: Salva flottante `glass-pill` (`fixed bottom-4 right-4 pb-safe`) sotto `sm`; header non sticky sotto `sm`.
- **Verifica**: a 375px una sola barra sticky; Ctrl+S funziona ancora; focus e ARIA `tab`/`tabpanel` invariati (`TabPanel.tsx`).

### Fase 4 — Campi e form
- `components/ui/field.ts` + `ui/StyledInputs.tsx` (`StyledInput`, `StyledTextarea`, `StyledSelect`): usare `fieldControlOnTileClass`.
- `features/character/components/StatInput.tsx`: togliere il bordo proprio, usare la classe di campo condivisa.
- `features/character/components/FeatureList.tsx`: form (`:35`) e card (`:82`) → `playInsetClass p-4 space-y-3`, campi `StyledInput`/`StyledTextarea`, pulsanti `Button`.
- `CompanionSpellEditor.tsx`, `CompanionSheetModal.tsx`, `equipment/` (form a sezioni): stessa sostituzione; i caricatori di immagine (`IdentitySection.tsx:51`, `CompanionSheetModal.tsx:173`) → `rounded-2xl bg-input` senza bordo, anello `ring-accent` solo su hover/focus.
- **Verifica**: compilare un personaggio nuovo da zero a 375px; nessun campo "buco nero" su tile; focus visibile in tutti i temi.

### Fase 5 — Riquadri interni e valori
- `editor/CombatStatsSection.tsx`, `Spellbook.tsx`: `StatBox` → `BentoStat` `small`; override mostrati con chip "Manuale".
- `equipment/ItemDisplayList.tsx`, `AttackList.tsx`, `CategorizedFeatureList.tsx`: righe → `playInsetClass`, niente `border border-border`; miniature `rounded-xl`.
- `CompanionCard.tsx:120`: dropdown manuale → `Menu`.
- Valutare rimozione di `ui/StatBox.tsx` e delle regole `.frame-rune` in `index.css` se nessun uso resta (grep; la stampa usa i propri stili).
- **Verifica**: grep `border border-border` in `features/character/components` → solo campi/controlli; `npm test` (le regole non cambiano).

### Fase 6 — Ornamenti Modern Arcane
- `CharacterSheet.tsx` e sezioni editor: `RuneDivider glyph="notch"` tra sottogruppi (Identità→Vitali, Caratteristiche→Tiri salvezza/Abilità, Bio: tratti→storia), massimo 2 per tab; titoli di gruppo con `playGroupTitleClass`.
- `HeroHeader compact`: `AstrolabeRing` di filigrana come in PlayView (rispettare `prefers-reduced-motion`, già gestito da `.rune-spin`).
- `equipment/ItemDisplayList.tsx`: `CornerGlyphs` con `data-active` sull'oggetto in modifica.
- **Verifica**: Glow-Means-State rispettata (nessun bagliore a riposo); animazioni ferme con riduzione del movimento.

### Fase 7 — Pulizia e documentazione
- Rimuovere `components/ui/SpotlightCard.tsx`, `AnimatedBorderCard.tsx`, `FloatingCard.tsx` se il grep conferma zero import (aggiornare la Named Rule che cita `animated-border-card` in `DESIGN.md`).
- `DESIGN.md`: aggiornare "Cards / Containers", "Navigation → Tab", "Inputs / Fields" e la gerarchia dei titoli secondo la sezione 2; dichiarare `.tile` superficie di entrambe le viste del personaggio.
- `CLAUDE.md` (sezione Stile): sostituire "Vista di gioco… usare `.tile`" con "Vista di gioco **ed editor**".
- **Verifica**: `typecheck`, `test`, `build` verdi; screenshot di confronto PlayView/Editor per ogni tab allegati alla PR.

### Ordine e dipendenze
1 → 2 → 3 sono sequenziali (2 e 3 dipendono dai componenti estratti in 1). 4, 5, 6 sono indipendenti tra loro dopo la 2. La 7 va per ultima.
