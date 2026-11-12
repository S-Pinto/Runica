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
  // New: for spells that have attack/damage components
  damage?: string;
  damageType?: string;
  attackAbility?: keyof AbilityScores;
  saveAbility?: keyof AbilityScores;
}


export type FeatureCategory = 'class' | 'racial' | 'feat-origin' | 'feat-general' | 'feat-combat' | 'feat-epic';

export const CATEGORY_CONFIG = {
  'class': {
    label: 'Privilegi di classe',
    color: 'accent',
    description: 'Capacità ottenute dai livelli di classe'
  },
  'racial': {
    label: 'Tratti di specie',
    color: 'accent',
    description: 'Tratti della razza o specie'
  },
  'feat-origin': {
    label: 'Talenti delle origini',
    color: 'accent',
    description: 'Talenti scelti alla creazione'
  },
  'feat-general': {
    label: 'Talenti generali',
    color: 'accent',
    description: 'Talenti al posto degli aumenti di caratteristica'
  },
  'feat-combat': {
    label: 'Talenti di combattimento',
    color: 'accent',
    description: 'Talenti dedicati allo stile di combattimento'
  },
  'feat-epic': {
    label: 'Doni epici',
    color: 'accent',
    description: 'Talenti di livello 19+'
  },
} as const;

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  // New: for features with limited uses
  uses?: { max: number; current: number };
  recovery?: 'short' | 'long' | 'none';
  isAction?: boolean;
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
  // New: source tracking
  sourceId?: string;
  sourceType?: 'weapon' | 'feat' | 'item' | 'spell' | 'custom';
  uses?: { max: number; current: number };
  recovery?: 'short' | 'long' | 'none';
  notes?: string;
}

export type ItemCategory = 
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'wondrous'
  | 'ring'
  | 'amulet'
  | 'helmet'
  | 'potion'
  | 'scroll'
  | 'gear';

export type ChargeResetType = 'longRest' | 'shortRest' | 'dawn' | 'none';

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
  itemType?: ItemCategory;
  armorClass?: number; // Base AC for armor, or bonus for shields
  armorType?: 'light' | 'medium' | 'heavy' | 'shield' | 'weapon' | 'magic';
  damage?: string; // e.g. "1d8", "2d6"
  damageType?: string; // e.g. "Slashing", "Piercing"
  attackBonus?: string; // e.g. "+1"
  mastery?: string; // e.g. "Flex", "Vex", "Sap"
  properties?: string[];
  additionalDamage?: { formula: string; type: string }[];
  attackAbility?: string; // "str", "dex"
  damageAbility?: string;
  isProficient?: boolean;
  equipped?: boolean;
  imageUrl?: string;
  grantsSpellName?: string;
  saveAbility?: string;

  // --- Proprietà Magiche, Sintonizzazione & Cariche Attive ---
  requiresAttunement?: boolean;
  isAttuned?: boolean;
  charges?: {
    current: number;
    max: number;
    resetType: ChargeResetType;
  };
  uses?: { current: number; max: number };
  recovery?: 'short' | 'long' | 'shortRest' | 'longRest' | 'none';
  bonusAC?: number;
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
  /** Which derived values are calculated from class and level (true) or set by hand (false). */
  automation?: { spellSlots?: boolean; proficiency?: boolean; hitDie?: boolean };
  companions: ICompanion[];

  // Syncing & Organization
  lastUpdated: number;
  order?: number; // For custom sorting
  campaignId?: string;
  campaignName?: string;
}

export interface ICampaign {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdBy: string;
  createdAt: number;
  characterIds: string[];
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