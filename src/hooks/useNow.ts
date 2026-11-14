import { useEffect, useState } from 'react';

/** Ora corrente aggiornata ogni `intervalMs` (per "aggiornato 2 min fa" e scadenze). */
export const useNow = (intervalMs = 30_000): number => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
};
