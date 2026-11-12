# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Giocatori di D&D 5e**: creano e aggiornano la scheda del proprio personaggio prima della sessione (editor, spesso da desktop) e la usano durante la partita dal telefono (vista di gioco: punti ferita, slot incantesimo, risorse, tiri, inventario, compagni).
- **Dungeon Master**: seguono i personaggi del gruppo e gestiscono le campagne.

## Product Purpose

Runica sostituisce la scheda cartacea o il PDF compilabile con una scheda viva: calcola i valori derivati, tiene traccia delle risorse durante il gioco e resta disponibile anche senza rete. Il successo è che al tavolo il giocatore trovi e aggiorni ciò che serve senza distogliere l'attenzione dalla partita.

## Positioning

- **Automazione con override manuale**: ogni valore calcolato (slot, dado vita, bonus di competenza, CA, CD…) può essere reso manuale (`character.automation.*`). Homebrew, multiclasse e decisioni del DM non vengono mai sovrascritti dal calcolo.
- **Offline / PWA**: installabile sul telefono, funziona senza login e senza connessione (modalità locale), con sincronizzazione su Firebase quando l'utente accede.

## Operating Context

- Sessione di gioco al tavolo: uso con il telefono, spesso a una mano, tra un turno e l'altro, con attenzione divisa.
- Preparazione fuori sessione: creazione e modifica del personaggio, inserimento di incantesimi, equipaggiamento e capacità.
- Stampa della scheda (pagina di stampa HTML e PDF generato dal server).
- Accesso con Google; senza login i dati restano nel browser del dispositivo.

## Capabilities and Constraints

- Funzioni attuali: lista personaggi ordinabile, editor completo, vista di gioco a schede (principale, combattimento, incantesimi, inventario, info, compagni), lanciadadi, riposi brevi/lunghi, compagni con scheda propria, ritratti con ritaglio, stampa/PDF, generazione di personalità con Gemini, 13 temi colore.
- Regole di riferimento attuali: D&D 5e edizione 2024 (`features/character/rules/`).
- Lingua attuale dell'interfaccia: italiano; i dati salvati usano chiavi inglesi.
- **Vincolo: mobile-first in gioco.** La vista di gioco deve funzionare bene sul telefono; l'editor può privilegiare schermi più ampi.
- **Vincolo: nessun contenuto proprietario incorporato.** Niente testi di incantesimi, regole o descrizioni copiati da manuali: l'utente inserisce i propri contenuti.
- Campagne: condivise tra giocatori e DM su Firestore (codice d'invito, riepilogo dei personaggi visibile ai membri, scheda completa sempre privata). Senza login restano locali al dispositivo e si possono condividere dopo l'accesso.
- Obbligo di login per le rotte dei personaggi: decisione aperta.

## Brand Commitments

- Nome: **Runica**. Identità attuale con font runico (`Norse`) per i titoli; nessun altro vincolo di brand confermato.

## Evidence on Hand

- Nessuna testimonianza, metrica d'uso, recensione o caso di studio disponibile: non inventarne.
- Asset presenti: icone PWA in `public/icons/` (anche varianti staging), font `src/assets/fonts/Norse*`.

## Product Principles

1. **Il tavolo prima di tutto**: in gioco contano velocità di lettura e aggiornamento con una mano, non la completezza a schermo.
2. **Il giocatore ha l'ultima parola**: l'automazione aiuta ma non impone; ogni valore derivato è sovrascrivibile.
3. **Mai perdere i dati**: deve funzionare offline e i dati locali non vanno sovrascritti silenziosamente dalla sincronizzazione.
4. **Contenuti dell'utente, non del manuale**: lo strumento struttura e calcola, il testo lo porta il giocatore.
