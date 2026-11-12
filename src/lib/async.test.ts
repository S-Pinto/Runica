import { describe, it, expect, vi, afterEach } from 'vitest';
import { settleOrQueue, createKeyedGuard } from './async';

afterEach(() => {
    vi.useRealTimers();
});

describe('settleOrQueue', () => {
    it('restituisce il valore se la promise si risolve in tempo', async () => {
        await expect(settleOrQueue(Promise.resolve(42), 1000)).resolves.toBe(42);
    });

    it('propaga l\'errore se la promise fallisce prima del timeout', async () => {
        await expect(settleOrQueue(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
    });

    it('si risolve a undefined allo scadere del timeout (scrittura in coda offline)', async () => {
        vi.useFakeTimers();
        const never = new Promise<number>(() => { });
        const result = settleOrQueue(never, 500);
        await vi.advanceTimersByTimeAsync(500);
        await expect(result).resolves.toBeUndefined();
    });

    it('passa a onLateError un errore arrivato dopo il timeout', async () => {
        vi.useFakeTimers();
        const onLate = vi.fn();
        let rejectLater!: (e: unknown) => void;
        const slow = new Promise<number>((_, rej) => { rejectLater = rej; });
        const result = settleOrQueue(slow, 100, onLate);
        await vi.advanceTimersByTimeAsync(100);
        await result;
        rejectLater(new Error('late'));
        await vi.advanceTimersByTimeAsync(0);
        expect(onLate).toHaveBeenCalledOnce();
    });
});

describe('createKeyedGuard', () => {
    it('concede la chiave una sola volta finché non viene rilasciata', () => {
        const guard = createKeyedGuard();
        expect(guard.tryAcquire('u1')).toBe(true);
        expect(guard.tryAcquire('u1')).toBe(false);
        expect(guard.tryAcquire('u2')).toBe(true);
        guard.release('u1');
        expect(guard.has('u1')).toBe(false);
        expect(guard.tryAcquire('u1')).toBe(true);
    });
});
