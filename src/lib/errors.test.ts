import { describe, it, expect } from 'vitest';
import { isNetworkError, describeDataError, describeAuthError } from './errors';

describe('isNetworkError', () => {
    it('riconosce i codici di rete di Firestore e Auth', () => {
        expect(isNetworkError({ code: 'unavailable' })).toBe(true);
        expect(isNetworkError({ code: 'auth/network-request-failed' })).toBe(true);
    });
    it('riconosce messaggi di rete generici', () => {
        expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    });
    it('non scambia altri errori per errori di rete', () => {
        expect(isNetworkError({ code: 'permission-denied' })).toBe(false);
        expect(isNetworkError('stringa')).toBe(false);
        expect(isNetworkError(null)).toBe(false);
    });
});

describe('describeDataError', () => {
    it('segnala la connessione assente', () => {
        expect(describeDataError({ code: 'unavailable' }, 'x')).toMatch(/Connessione/);
    });
    it('segnala i permessi negati', () => {
        expect(describeDataError({ code: 'permission-denied' }, 'x')).toMatch(/permessi/);
    });
    it('usa il fallback per errori sconosciuti', () => {
        expect(describeDataError(new Error('?'), 'Fallback')).toBe('Fallback');
    });
});

describe('describeAuthError', () => {
    it('ignora la chiusura volontaria del popup', () => {
        expect(describeAuthError({ code: 'auth/popup-closed-by-user' })).toBeNull();
    });
    it('descrive popup bloccato e rete assente', () => {
        expect(describeAuthError({ code: 'auth/popup-blocked' })).toMatch(/popup/);
        expect(describeAuthError({ code: 'auth/network-request-failed' })).toMatch(/Connessione/);
    });
    it('ha un messaggio generico per il resto', () => {
        expect(describeAuthError(new Error('?'))).toBe('Accesso non riuscito. Riprova.');
    });
});
