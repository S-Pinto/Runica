import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Tab attiva salvata in `?tab=` (sopravvive al refresh e si può linkare). */
export const useTabParam = <K extends string>(keys: readonly K[], fallback: K): [K, (tab: K) => void] => {
    const [params, setParams] = useSearchParams();
    const raw = params.get('tab') as K | null;
    const tab = raw && keys.includes(raw) ? raw : fallback;
    const setTab = useCallback((next: K) => {
        setParams((prev) => {
            const copy = new URLSearchParams(prev);
            copy.set('tab', next);
            return copy;
        }, { replace: true });
    }, [setParams]);
    return [tab, setTab];
};
