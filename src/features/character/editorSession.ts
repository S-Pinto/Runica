/**
 * Logica pura del ciclo di vita dell'editor della scheda, separata dagli hook
 * per poterla testare senza React né Firebase.
 */

/** Segmento di percorso dell'editor per un personaggio non ancora salvato (`/character/new`). */
export const NEW_CHARACTER_ROUTE_ID = 'new';

export type EditorTarget = { kind: 'new' } | { kind: 'existing'; id: string };

/**
 * Che cosa deve aprire l'editor per il parametro di rotta `characterId`.
 * `/character/new` non ha parametro (rotta dedicata); `'new'` si tratta comunque come
 * scheda nuova, così non si cerca mai nel repository un documento con id "new".
 */
export const resolveEditorTarget = (characterId: string | undefined): EditorTarget =>
    !characterId || characterId === NEW_CHARACTER_ROUTE_ID
        ? { kind: 'new' }
        : { kind: 'existing', id: characterId };

/**
 * Rileva un vero cambio utente (login, logout, cambio account) fra due esecuzioni
 * dell'effetto che ascolta l'uid. Il primo valore non è un cambio: al montaggio del
 * `CharacterProvider` non si deve azzerare la scheda che l'editor ha appena creato.
 *
 * Senza questa distinzione, aprendo `/character/new` direttamente (URL o refresh)
 * l'effetto del figlio (editor) crea la scheda vuota e subito dopo quello del
 * genitore (provider) la riporta a `null`: caricamento infinito.
 */
export const createUserChangeDetector = () => {
    let initialized = false;
    let previous: string | null = null;
    /** True solo se `uid` è diverso da quello visto alla chiamata precedente. */
    return (uid: string | null): boolean => {
        const changed = initialized && uid !== previous;
        initialized = true;
        previous = uid;
        return changed;
    };
};
