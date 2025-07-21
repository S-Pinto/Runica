export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Skill {
  name: string;
  ability: keyof AbilityScores;
  proficient: boolean;
  expertise: boolean;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 for cantrips
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
}

export interface Attack {
    id: string;
    name: string;
    bonus: string;
    damage: string;
}

export interface EquipmentItem {
    id: string;
    name: string;
    quantity: number;
    description: string;
    armorClass?: number; // Base AC for armor, or bonus for shields
    armorType?: 'light' | 'medium' | 'heavy' | 'shield';
    equipped?: boolean;
}

export interface Currency {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
}

export interface CustomResource {
  id: string;
  name: string;
  max: number;
  used: number;
}

export interface UnarmoredDefense {
  base: number;
  abilities: (keyof AbilityScores)[];
}

export interface ICharacter {
  id: string;
  imageUrl?: string;
  name: string;
  class: string;
  subclass: string;
  level: number;
  race: string;
  alignment: string;
  background: string;
  playerName: string;
  experiencePoints: number;
  abilityScores: AbilityScores;
  inspiration: number;
  proficiencyBonus: number;
  savingThrows: {
    [key in keyof AbilityScores]: { proficient: boolean };
  };
  skills: Skill[];
  unarmoredDefense: UnarmoredDefense;
  initiative: number;
  speed: number;
  hp: {
    max: number;
    current: number;
    temporary: number;
  };
  hitDice: {
    total: string;
    used: number;
  };
  deathSaves: {
    successes: number;
    failures: number;
  };
  
  // New structured fields
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  languages: string;
  attacks: Attack[];
  currency: Currency;
  equipment: EquipmentItem[];
  featuresAndTraits: Feature[];
  notes: string;
  dmNotes: string;

  // Spellcasting
  spellcastingAbility: keyof AbilityScores | '';
  spells: Spell[];
  spellSlots: {
    [level: number]: { max: number; used: number };
  };
  customResources: CustomResource[];

  // Syncing
  lastUpdated: number;
}