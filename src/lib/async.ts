// Utility asincrone pure, senza dipendenze da Firebase o dal DOM (testabili in Vitest).

/**
 * Attende `promise`, ma al massimo `ms` millisecondi.
 * Serve per le scritture Firestore: offline la promise si risolve solo al riscontro
 * del server, mentre il dato è già nella cache locale e verrà sincronizzato al ritorno
 * della rete. Se la promise fallisce prima del timeout, l'errore viene propagato; un
 * errore tardivo (dopo il timeout) viene passato a `onLateError` invece di diventare
 * una unhandled rejection.
 */
export const settleOrQueue = <T>(
    promise: Promise<T>,
    ms: number,
    onLateError?: (error: unknown) => void,
): Promise<T | undefined> =>
    new Promise((resolve, reject) => {
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            resolve(undefined);
        }, ms);
        promise.then(
            (value) => {
                clearTimeout(timer);
                if (!timedOut) resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                if (timedOut) onLateError?.(error);
                else reject(error);
            },
        );
    });

/**
 * Guardia "una alla volta" per chiave (es. uid utente): evita che la stessa operazione
 * (come la proposta di migrazione) parta due volte in parallelo o venga riproposta.
 */
export const createKeyedGuard = () => {
    const held = new Set<string>();
    return {
        /** True se la chiave era libera ed è stata acquisita. */
        tryAcquire: (key: string): boolean => {
            if (held.has(key)) return false;
            held.add(key);
            return true;
        },
        release: (key: string): void => {
            held.delete(key);
        },
        has: (key: string): boolean => held.has(key),
    };
};
