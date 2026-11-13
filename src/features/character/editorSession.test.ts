import { describe, it, expect } from 'vitest';
import { createUserChangeDetector, resolveEditorTarget } from './editorSession';

describe('resolveEditorTarget', () => {
    it('/character/new (nessun parametro) apre una scheda nuova', () => {
        expect(resolveEditorTarget(undefined)).toEqual({ kind: 'new' });
    });

    it('non tratta mai "new" come id da caricare', () => {
        expect(resolveEditorTarget('new')).toEqual({ kind: 'new' });
    });

    it('un id reale apre il personaggio esistente', () => {
        expect(resolveEditorTarget('char_123')).toEqual({ kind: 'existing', id: 'char_123' });
    });
});

describe('createUserChangeDetector', () => {
    it('regressione /character/new: il primo valore (montaggio del provider) non azzera la scheda', () => {
        const detector = createUserChangeDetector();
        expect(detector(null)).toBe(false);
        expect(createUserChangeDetector()('uid-1')).toBe(false);
    });

    it('lo stesso utente (es. StrictMode che riesegue l\'effetto) non è un cambio', () => {
        const detector = createUserChangeDetector();
        detector('uid-1');
        expect(detector('uid-1')).toBe(false);
    });

    it('login, logout e cambio account sono cambi', () => {
        const detector = createUserChangeDetector();
        detector(null);
        expect(detector('uid-1')).toBe(true);
        expect(detector('uid-2')).toBe(true);
        expect(detector(null)).toBe(true);
    });
});
