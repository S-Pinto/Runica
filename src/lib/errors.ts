// Classificazione degli errori di Firebase/rete in messaggi italiani per l'utente.

const getCode = (error: unknown): string => {
    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: unknown }).code;
        if (typeof code === 'string') return code;
    }
    return '';
};

/** True se l'errore dipende dall'assenza di rete (o servizio momentaneamente irraggiungibile). */
export const isNetworkError = (error: unknown): boolean => {
    const code = getCode(error);
    if (code === 'unavailable' || code === 'firestore/unavailable' || code === 'auth/network-request-failed') {
        return true;
    }
    if (code === 'storage/retry-limit-exceeded') return true;
    return error instanceof Error && /network|offline|failed to fetch/i.test(error.message);
};

/** Messaggio leggibile per un errore di lettura/scrittura dati. */
export const describeDataError = (error: unknown, fallback: string): string => {
    if (isNetworkError(error)) return 'Connessione assente o instabile. Riprova quando sei online.';
    switch (getCode(error)) {
        case 'permission-denied':
        case 'storage/unauthorized':
            return 'Non hai i permessi per questa operazione. Prova ad accedere di nuovo.';
        case 'unauthenticated':
            return 'Sessione scaduta. Accedi di nuovo.';
        case 'resource-exhausted':
            return 'Troppe richieste o quota esaurita. Riprova tra poco.';
        case 'not-found':
            return 'Elemento non trovato.';
        default:
            return fallback;
    }
};

/** Messaggio per gli errori di accesso; null se l'utente ha solo chiuso il popup. */
export const describeAuthError = (error: unknown): string | null => {
    switch (getCode(error)) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return null;
        case 'auth/popup-blocked':
            return 'Il browser ha bloccato la finestra di accesso. Consenti i popup e riprova.';
        case 'auth/network-request-failed':
            return 'Connessione assente: impossibile accedere. Riprova online.';
        case 'auth/unauthorized-domain':
            return 'Dominio non autorizzato per l\'accesso.';
        default:
            return 'Accesso non riuscito. Riprova.';
    }
};
