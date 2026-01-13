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

// In un file come src/features/character/characterTypes.ts
export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  ritual: boolean;
  concentration: boolean;
  prepared?: boolean;
}


export type FeatureCategory = 'class' | 'racial' | 'feat-origin' | 'feat-general' | 'feat-combat' | 'feat-epic';

export const CATEGORY_CONFIG = {
  'class': {
    label: 'Class Features',
    color: 'accent',
    description: 'Abilities from your class levels'
  },
  'racial': {
    label: 'Racial Traits',
    color: 'green-500',
    description: 'Traits from your race/species'
  },
  'feat-origin': {
    label: 'Origin Feats',
    color: 'amber-500',
    description: 'Feats from character creation'
  },
  'feat-general': {
    label: 'General Feats',
    color: 'amber-500',
    description: 'Feats from ASI choices'
  },
  'feat-combat': {
    label: 'Combat Feats',
    color: 'amber-500',
    description: 'Fighting-focused feats'
  },
  'feat-epic': {
    label: 'Epic Feats',
    color: 'purple-500',
    description: 'High-level (20+) feats'
  },
} as const;

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
}

export interface Attack {
  id: string;
  name: string;
  bonus: string; // Now represents "Magic/Custom Bonus"
  damage: string;
  mastery?: string;
  properties?: string[];
  saveAbility?: string; // 'str', 'dex', 'con', etc. or null if attack roll
  damageType?: string; // 'fire', 'slashing', etc.
  additionalDamage?: { formula: string; type: string }[];
  damageAbility?: string; // 'str', 'dex', etc. to add to damage
  attackAbility?: string; // 'str', 'dex', etc. for hit roll
  isProficient?: boolean; // add proficiency bonus to hit?
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
  armorClass?: number; // Base AC for armor, or bonus for shields
  armorType?: 'light' | 'medium' | 'heavy' | 'shield';
  equipped?: boolean;
  imageUrl?: string;
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
  biography?: string; // New field for character backstory

  // Defenses & Conditions
  defenses: {
    resistances: string;
    immunities: string;
    vulnerabilities: string;
  };
  conditions: string[];

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
  companions: ICompanion[];

  // Syncing
  lastUpdated: number;
  order?: number; // For custom sorting
}

export interface ICompanion {
  id: string;
  name: string;
  type: string; // e.g., 'Familiar', 'Animal Companion', 'Summon'
  imageUrl?: string;

  hp: { max: number; current: number; temporary: number };
  armorClass: number;
  speed: string;

  abilityScores: AbilityScores;
  skills: Skill[];

  attacks: Attack[];
  spells: Spell[];
  featuresAndTraits: Feature[];
  equipment: EquipmentItem[];
  notes: string;
}