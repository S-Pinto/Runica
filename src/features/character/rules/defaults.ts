// Valori di default di un personaggio. Funzioni pure, senza I/O.
import type { ICharacter, AbilityScores, Skill } from '../characterTypes';
import { getModifier } from '../utils/characterUtils';
import { proficiencyForLevel } from './progression';

export const getDefaultSkills = (): Skill[] => [
    { name: 'Acrobatics', ability: 'dexterity', proficient: false, expertise: false },
    { name: 'Animal Handling', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Arcana', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Athletics', ability: 'strength', proficient: false, expertise: false },
    { name: 'Deception', ability: 'charisma', proficient: false, expertise: false },
    { name: 'History', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Insight', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Intimidation', ability: 'charisma', proficient: false, expertise: false },
    { name: 'Investigation', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Medicine', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Nature', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Perception', ability: 'wisdom', proficient: false, expertise: false },
    { name: 'Performance', ability: 'charisma', proficient: false, expertise: false },
    { name: 'Persuasion', ability: 'charisma', proficient: false, expertise: false },
    { name: 'Religion', ability: 'intelligence', proficient: false, expertise: false },
    { name: 'Sleight of Hand', ability: 'dexterity', proficient: false, expertise: false },
    { name: 'Stealth', ability: 'dexterity', proficient: false, expertise: false },
    { name: 'Survival', ability: 'wisdom', proficient: false, expertise: false },
];

export const createNewCharacter = (now: number = Date.now()): ICharacter => {
    const abilityScores: AbilityScores = {
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10,
    };
    return {
        id: `char_${now}`,
        lastUpdated: now,
        order: 0,
        name: '', class: '', subclass: '', level: 1, race: '',
        alignment: '', background: '', playerName: '', experiencePoints: 0,
        abilityScores, inspiration: 0,
        proficiencyBonus: proficiencyForLevel(1),
        savingThrows: {
            strength: { proficient: false }, dexterity: { proficient: false },
            constitution: { proficient: false }, intelligence: { proficient: false },
            wisdom: { proficient: false }, charisma: { proficient: false },
        },
        skills: getDefaultSkills(),
        unarmoredDefense: { base: 10, abilities: ['dexterity'] },
        initiative: getModifier(abilityScores.dexterity),
        speed: 30,
        hp: { max: 10, current: 10, temporary: 0 },
        hitDice: { total: '1d8', used: 0 },
        deathSaves: { successes: 0, failures: 0 },
        personalityTraits: '', ideals: '', bonds: '', flaws: '',
        languages: 'Common',
        defenses: { resistances: '', immunities: '', vulnerabilities: '' },
        conditions: [],
        attacks: [],
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        equipment: [], featuresAndTraits: [],
        notes: '', dmNotes: '',
        spellcastingAbility: '', spells: [],
        spellSlots: {
            1: { max: 0, used: 0 }, 2: { max: 0, used: 0 }, 3: { max: 0, used: 0 },
            4: { max: 0, used: 0 }, 5: { max: 0, used: 0 }, 6: { max: 0, used: 0 },
            7: { max: 0, used: 0 }, 8: { max: 0, used: 0 }, 9: { max: 0, used: 0 },
        },
        customResources: [],
        imageUrl: '',
        companions: [],
    };
};

/** Riempie i campi mancanti di un documento salvato con i default correnti. */
export const mergeWithDefaults = (data: Partial<ICharacter>): ICharacter => ({
    ...createNewCharacter(),
    ...data,
});
