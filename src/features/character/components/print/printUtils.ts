import { ICharacter, Spell, EquipmentItem } from '../../characterTypes';
import { proficiencyForLevel } from '../../rules/progression';

/** Modificatore di caratteristica per la stampa (un punteggio mancante o 0 vale 10). */
export const getMod = (score: number) => Math.floor(((score || 10) - 10) / 2);
export const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export const getPrintLevel = (character: ICharacter) => character.level || 1;
/** Rispetta l'override manuale del bonus di competenza, altrimenti lo ricava dal livello. */
export const getPrintProficiency = (character: ICharacter) =>
    character.proficiencyBonus || proficiencyForLevel(getPrintLevel(character));

export const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

/** Righe disponibili per gli incantesimi nella pagina 2 e nelle pagine di continuazione. */
export const SPELL_ROWS_PAGE2 = 30;
export const SPELL_ROWS_CONTINUATION = 36;
/** Voci di equipaggiamento che entrano nel riquadro della pagina 2. */
export const EQUIPMENT_ROWS_PAGE2 = 16;
/** Caratteri di storia e personalità che entrano nel riquadro della pagina 2. */
export const STORY_CHARS_PAGE2 = 650;

/** Incantesimi da stampare: trucchetti e incantesimi preparati, ordinati per livello e nome. */
export const getPrintSpells = (character: ICharacter): Spell[] =>
    [...(character.spells || [])]
        .filter((s) => (s.level || 0) === 0 || s.prepared !== false)
        .sort((a, b) => (a.level || 0) - (b.level || 0) || a.name.localeCompare(b.name));

/** La lettera "M" tra i componenti (es. "V, S, M (un pizzico di zolfo)"). */
export const hasMaterialComponent = (components: string | undefined) =>
    /(^|[\s,;(])M($|[\s,;()])/.test(components || '');

export const splitChunks = <T,>(items: T[], first: number, rest: number): T[][] => {
    const chunks: T[][] = [items.slice(0, first)];
    for (let i = first; i < items.length; i += rest) chunks.push(items.slice(i, i + rest));
    return chunks;
};

export const getStoryText = (character: ICharacter) =>
    [character.personalityTraits, character.ideals, character.bonds, character.flaws, character.biography]
        .filter(Boolean)
        .join(' ');

export const getAttunedItems = (character: ICharacter): EquipmentItem[] =>
    (character.equipment || []).filter((i) => i.isAttuned);
