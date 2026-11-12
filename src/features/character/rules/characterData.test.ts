import { describe, it, expect } from 'vitest';
import { createNewCharacter, mergeWithDefaults, getDefaultSkills } from './defaults';
import { cleanUndefinedValues, buildDuplicate, selectCharactersToMigrate } from './characterData';

describe('defaults', () => {
    it('createNewCharacter usa il timestamp passato per id e lastUpdated', () => {
        const c = createNewCharacter(1234);
        expect(c.id).toBe('char_1234');
        expect(c.lastUpdated).toBe(1234);
        expect(c.proficiencyBonus).toBe(2);
        expect(c.skills).toHaveLength(18);
        expect(c.initiative).toBe(0);
    });
    it('getDefaultSkills restituisce copie indipendenti', () => {
        const a = getDefaultSkills();
        a[0].proficient = true;
        expect(getDefaultSkills()[0].proficient).toBe(false);
    });
    it('mergeWithDefaults riempie i campi mancanti e rispetta quelli presenti', () => {
        const merged = mergeWithDefaults({ id: 'x', name: 'Ayla', level: 3 });
        expect(merged).toMatchObject({ id: 'x', name: 'Ayla', level: 3, speed: 30 });
        expect(merged.companions).toEqual([]);
    });
});

describe('cleanUndefinedValues', () => {
    it('rimuove undefined in oggetti e array annidati, mantiene null/0/""', () => {
        const input = { a: 1, b: undefined, c: { d: undefined, e: null, f: 0, g: '' }, h: [{ i: undefined, j: 2 }] };
        expect(cleanUndefinedValues(input)).toEqual({ a: 1, c: { e: null, f: 0, g: '' }, h: [{ j: 2 }] });
    });
    it('gestisce primitivi e null', () => {
        expect(cleanUndefinedValues(null)).toBeNull();
        expect(cleanUndefinedValues(5)).toBe(5);
    });
});

describe('buildDuplicate', () => {
    it('crea nuovo id/nome/timestamp senza condividere riferimenti', () => {
        const original = { ...createNewCharacter(1), name: 'Ayla' };
        const copy = buildDuplicate(original, 99, () => 0.5);
        expect(copy.id).toMatch(/^char_99_/);
        expect(copy.id).not.toBe(original.id);
        expect(copy.name).toBe('Ayla (Copia)');
        expect(copy.lastUpdated).toBe(99);
        expect(copy.hp).not.toBe(original.hp);
        expect(copy.hp).toEqual(original.hp);
    });
    it('usa "Adventurer" se il nome è vuoto', () => {
        expect(buildDuplicate(createNewCharacter(1), 2).name).toBe('Adventurer (Copia)');
    });
});

describe('selectCharactersToMigrate', () => {
    const local = (id: string, lastUpdated: number) => ({ ...createNewCharacter(1), id, lastUpdated });
    it('include assenti nel cloud e più recenti; esclude uguali o più vecchi', () => {
        const result = selectCharactersToMigrate(
            [local('new', 10), local('newer', 20), local('same', 5), local('older', 1)],
            [{ id: 'newer', lastUpdated: 10 }, { id: 'same', lastUpdated: 5 }, { id: 'older', lastUpdated: 9 }],
        );
        expect(result.map(c => c.id)).toEqual(['new', 'newer']);
    });
    it('cloud senza lastUpdated conta come 0', () => {
        const result = selectCharactersToMigrate([local('a', 1)], [{ id: 'a', lastUpdated: undefined as unknown as number }]);
        expect(result).toHaveLength(1);
    });
    it('lista locale vuota → niente da migrare', () => {
        expect(selectCharactersToMigrate([], [{ id: 'a', lastUpdated: 1 }])).toEqual([]);
    });
});
