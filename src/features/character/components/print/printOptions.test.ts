import { describe, expect, it } from 'vitest';
import { DEFAULT_PRINT_PREFERENCES, characterHasSpells, fitZoom, sanitizePrintPreferences, stepZoom } from './printOptions';

describe('sanitizePrintPreferences', () => {
    it('restituisce i predefiniti per valori assenti o non validi', () => {
        expect(sanitizePrintPreferences(null)).toEqual(DEFAULT_PRINT_PREFERENCES);
        expect(sanitizePrintPreferences({ paper: 'neon', values: 42, zoom: 3 })).toEqual(DEFAULT_PRINT_PREFERENCES);
    });

    it('conserva le scelte valide', () => {
        expect(sanitizePrintPreferences({ paper: 'grimoire', values: 'blank', zoom: 1.25 })).toEqual({ paper: 'grimoire', values: 'blank', zoom: 1.25 });
    });
});

describe('stepZoom', () => {
    it('passa al gradino successivo o precedente', () => {
        expect(stepZoom(1, 1)).toBe(1.25);
        expect(stepZoom(1, -1)).toBe(0.75);
    });

    it('parte da una scala "adatta" fuori dai gradini', () => {
        expect(stepZoom(0.82, 1)).toBe(1);
        expect(stepZoom(0.82, -1)).toBe(0.75);
    });

    it('resta nei limiti', () => {
        expect(stepZoom(1.5, 1)).toBe(1.5);
        expect(stepZoom(0.5, -1)).toBe(0.5);
    });
});

describe('fitZoom', () => {
    it('non supera il 100% su schermi larghi e riduce sui telefoni', () => {
        expect(fitZoom(1600)).toBe(1);
        expect(fitZoom(390)).toBeCloseTo((390 - 32) / 793.7, 3);
    });
});

describe('characterHasSpells', () => {
    it('è vero per gli incantatori o con incantesimi in elenco', () => {
        expect(characterHasSpells('wisdom', 0)).toBe(true);
        expect(characterHasSpells(undefined, 2)).toBe(true);
        expect(characterHasSpells(undefined, 0)).toBe(false);
    });
});
