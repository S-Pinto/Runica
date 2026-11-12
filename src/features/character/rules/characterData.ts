// Trasformazioni pure sui dati dei personaggi (pulizia, duplicazione, migrazione).
import type { ICharacter } from '../characterTypes';

/** Rimuove ricorsivamente le chiavi `undefined` (Firestore non le accetta). */
export const cleanUndefinedValues = <T>(obj: T): T => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => cleanUndefinedValues(item)) as unknown as T;
    }
    if (typeof obj === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            if (value !== undefined) {
                cleaned[key] = cleanUndefinedValues(value);
            }
        }
        return cleaned as T;
    }
    return obj;
};

/** Crea la copia di un personaggio con nuovo id, nome "(Copia)" e timestamp aggiornato. */
export const buildDuplicate = (
    character: ICharacter,
    now: number = Date.now(),
    random: () => number = Math.random,
): ICharacter => ({
    ...(JSON.parse(JSON.stringify(character)) as ICharacter),
    id: `char_${now}_${random().toString(36).substring(2, 6)}`,
    name: `${character.name || 'Adventurer'} (Copia)`,
    lastUpdated: now,
});

/**
 * Sceglie i personaggi locali da spostare sul cloud: quelli assenti online
 * o con `lastUpdated` più recente della versione cloud.
 */
export const selectCharactersToMigrate = (
    local: ICharacter[],
    cloud: Pick<ICharacter, 'id' | 'lastUpdated'>[],
): ICharacter[] =>
    local.filter(localChar => {
        const cloudVersion = cloud.find(c => c.id === localChar.id);
        return !cloudVersion || localChar.lastUpdated > (cloudVersion.lastUpdated || 0);
    });
