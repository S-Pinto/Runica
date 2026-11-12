import { ICharacter } from '../../characterTypes';

/** Modificatore di caratteristica per la stampa (un punteggio mancante o 0 vale 10). */
export const getMod = (score: number) => Math.floor(((score || 10) - 10) / 2);
export const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export const getPrintLevel = (character: ICharacter) => character.level || 1;
export const getPrintProficiency = (character: ICharacter) => Math.ceil(getPrintLevel(character) / 4) + 1;

export const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
