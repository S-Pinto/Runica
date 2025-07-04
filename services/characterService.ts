import { ICharacter, AbilityScores, Skill } from '../types';

const MOCK_LATENCY = 300;

const getProficiencyBonus = (level: number): number => {
  return Math.ceil(level / 4) + 1;
};

const getDefaultSkills = (abilityScores: AbilityScores): Skill[] => {
  return [
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
};

export const createNewCharacter = (): Omit<ICharacter, 'id'> => {
  const defaultAbilities: AbilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };

  return {
    name: "New Character",
    class: "Wizard",
    subclass: "",
    level: 1,
    race: "Human",
    alignment: "Neutral",
    background: "Sage",
    playerName: "Player",
    experiencePoints: 0,
    abilityScores: defaultAbilities,
    inspiration: 0,
    proficiencyBonus: 2,
    savingThrows: {
      strength: { proficient: false },
      dexterity: { proficient: false },
      constitution: { proficient: false },
      intelligence: { proficient: false },
      wisdom: { proficient: false },
      charisma: { proficient: false },
    },
    skills: getDefaultSkills(defaultAbilities),
    armorClass: 10,
    initiative: 0,
    speed: 30,
    hp: {
      max: 8,
      current: 8,
      temporary: 0,
    },
    hitDice: { total: "1d6", used: 0 },
    deathSaves: { successes: 0, failures: 0 },
    featuresAndTraits: [],
    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    languages: "Common",
    attacks: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
    equipment: [],
    notes: "",
    dmNotes: "",
    spellcastingAbility: 'intelligence',
    spells: [],
    spellSlots: {
        1: { max: 0, used: 0 },
        2: { max: 0, used: 0 },
        3: { max: 0, used: 0 },
        4: { max: 0, used: 0 },
        5: { max: 0, used: 0 },
        6: { max: 0, used: 0 },
        7: { max: 0, used: 0 },
        8: { max: 0, used: 0 },
        9: { max: 0, used: 0 },
    },
    customResources: [],
  };
};

// --- Helper Functions ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCharactersFromStorage = (): ICharacter[] => {
  const charactersJson = localStorage.getItem('runica_characters');
  return charactersJson ? JSON.parse(charactersJson) : [];
};

const saveCharactersToStorage = (characters: ICharacter[]): void => {
  localStorage.setItem('runica_characters', JSON.stringify(characters));
};

// --- Refactored Service API ---
export const getCharacters = async (): Promise<ICharacter[]> => {
  await delay(MOCK_LATENCY);
  return getCharactersFromStorage();
};

export const getCharacter = async (id: string): Promise<ICharacter | null> => {
  await delay(MOCK_LATENCY / 2);
  const characters = getCharactersFromStorage();
  const character = characters.find(c => c.id === id) || null;
  
  if (character) {
    // --- Migrations for backward compatibility ---
    if (!character.attacks) character.attacks = [];
    if (!character.currency) character.currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    if (!character.languages) character.languages = 'Common';
    if (!character.customResources) character.customResources = [];
    if (!character.dmNotes) character.dmNotes = '';
    if (!character.subclass) character.subclass = '';
    
    if (typeof (character as any).backstory === 'string') {
        character.personalityTraits = (character as any).backstory;
        character.ideals = '';
        character.bonds = '';
        character.flaws = '';
    }

    if (typeof character.equipment === 'string') {
        character.equipment = [{ id: 'item_1', name: character.equipment, quantity: 1, description: '', equipped: false }];
    } else if (character.equipment) {
        character.equipment = character.equipment.map(item => ({
            ...item,
            equipped: item.equipped ?? false,
        }));
    }

    if (character.skills && character.skills.length > 0 && character.skills[0].expertise === undefined) {
        character.skills = character.skills.map(s => ({ ...s, expertise: false }));
    }

    if (typeof character.hitDice === 'string') {
        character.hitDice = { total: character.hitDice, used: 0 };
    } else if (!character.hitDice) {
        character.hitDice = { total: '1d6', used: 0 };
    }
  }

  return character;
};

export const saveCharacter = async (character: ICharacter): Promise<ICharacter> => {
  // Recalculate derived stats
  character.proficiencyBonus = getProficiencyBonus(character.level);
  const dexModifier = Math.floor((character.abilityScores.dexterity - 10) / 2);
  character.initiative = dexModifier;
  
  await delay(MOCK_LATENCY / 2); 
  
  const characters = getCharactersFromStorage();
  const existingIndex = characters.findIndex(c => c.id === character.id);

  if (existingIndex > -1) {
    characters[existingIndex] = character;
  } else {
    characters.push(character);
  }
  saveCharactersToStorage(characters);
  return character;
};

export const deleteCharacter = async (id: string): Promise<void> => {
    await delay(MOCK_LATENCY);
    let characters = getCharactersFromStorage();
    characters = characters.filter(c => c.id !== id);
    saveCharactersToStorage(characters);
};