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
  additionalDamage?: DamageBlock[];
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

/** Blocco di danno con il suo tipo (chiave inglese, es. 'Fire', o testo libero). */
export interface DamageBlock {
  formula: string;
  type: string;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary' | 'artifact';
export type DefenseKind = 'resistance' | 'immunity' | 'vulnerability';

/** Proprietà passive: valgono con l'oggetto equipaggiato e, se la richiede, in sintonia. */
export interface ItemEffects {
  defenses?: { kind: DefenseKind; damageType: string }[];
  /** In piedi, come `character.speed` (anche negativo). */
  speedBonus?: number;
  initiativeBonus?: number;
  saveBonuses?: { ability: keyof AbilityScores | 'all'; value: number }[];
  /** Distanza in piedi (mostrata anche in metri). */
  senses?: { name: string; range?: number }[];
  languages?: string[];
  /** Avvisi tattici in Combattimento: valgono appena l'oggetto è equipaggiato, anche senza sintonia. */
  notes?: string[];
}

/** Potere attivabile di un oggetto: incantesimo, capacità o attacco completo. */
export interface ItemPower {
  id: string;
  name: string;
  description?: string;
  activation?: 'action' | 'bonus' | 'reaction' | 'free';
  roll: 'attack' | 'save' | 'none';
  /** 'spell' = caratteristica da incantatore; 'none' = nessuna. Assente = 'spell'. */
  attackAbility?: keyof AbilityScores | 'spell' | 'none';
  /** Default: vero. */
  isProficient?: boolean;
  attackBonus?: number;
  saveAbility?: keyof AbilityScores;
  /** Assente = CD da incantatore. */
  saveDC?: number;
  damage?: string;
  damageType?: string;
  /** Assente = come per colpire (se non è da incantatore). */
  damageAbility?: keyof AbilityScores | 'none';
  additionalDamage?: DamageBlock[];
  /** Usi propri del potere (es. 1/riposo breve)… */
  uses?: { current: number; max: number; recovery: ChargeResetType };
  /** …oppure cariche dell'oggetto consumate a ogni uso. */
  chargeCost?: number;
}

/** Proprietà nominata o pezzo di storia dell'oggetto. */
export interface ItemTrait {
  id: string;
  name: string;
  description: string;
}

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
  additionalDamage?: DamageBlock[];
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

  // --- Armi: danno a due mani e munizioni; peso ---
  /** Danno impugnando a due mani un'arma Versatile (es. "1d10"). */
  versatileDamage?: string;
  /** Oggetto dell'inventario consumato a ogni tiro per colpire (regola opzionale delle munizioni). */
  ammoItemId?: string;
  /** Peso di un'unità, nell'unità di `optionalRules.weightUnit` (regola opzionale del carico). */
  weight?: number;

  // --- Oggetti complessi e homebrew ---
  rarity?: ItemRarity;
  /** Sottotipo libero: "Elmo", "Piastre", "Spadone"… */
  subtype?: string;
  /** Proprietà nominate e storia (titolo + descrizione). */
  traits?: ItemTrait[];
  effects?: ItemEffects;
  powers?: ItemPower[];
  /** Armature pesanti: con FOR inferiore la velocità cala di 10 ft. */
  strengthRequirement?: number;
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

/** Regole opzionali, spente di default: molte campagne non le usano. */
export interface OptionalRules {
  /** Peso degli oggetti e capacità di carico (FOR × 15 lb, cioè FOR × 7,5 kg). */
  encumbrance?: boolean;
  /** Le armi a munizioni consumano l'oggetto collegato a ogni tiro per colpire. */
  ammunition?: boolean;
  weightUnit?: 'kg' | 'lb';
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
  /** CA impostata a mano: se è un numero sostituisce il calcolo (null o assente = automatica). */
  armorClassOverride?: number | null;
  optionalRules?: OptionalRules;
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

/** Campagna condivisa su Firestore (`campaigns/{id}`). Il DM è `ownerUid`. */
export interface ICampaign {
  id: string;
  name: string;
  description?: string;
  ownerUid: string;
  /** Tutti i membri, DM incluso: serve a query e regole di sicurezza. */
  memberUids: string[];
  /** Codice nudo (6 caratteri, id di `campaignInvites`); si mostra come `RUN-XXXXXX`. */
  inviteCode: string;
  createdAt: number;
  updatedAt: number;
  /** Assente nelle campagne create prima della v2: valgono i default di `getCampaignSettings`. */
  settings?: ICampaignSettings;
  schemaVersion?: number;
}

/** Cosa vedono i giocatori dei compagni: numeri (`liveStats`) o solo lo stato narrativo. */
export type PartyVitalsMode = 'numeric' | 'narrative';

export interface ICampaignSettings {
  partyVitals: PartyVitalsMode;
  /** I giocatori possono scrivere in bacheca. */
  playerPosts: boolean;
}

export type CampaignRole = 'dm' | 'player';

/** `campaigns/{id}/members/{uid}` */
export interface ICampaignMember {
  uid: string;
  role: CampaignRole;
  displayName: string;
  photoURL?: string;
  joinedAt: number;
  /** Codice usato per entrare: le regole lo verificano contro `campaignInvites`. */
  joinCode?: string;
  /** Il personaggio con cui il membro siede al tavolo. */
  activeCharacterId?: string;
}

/** `campaignInvites/{code}`: risolve un codice nella campagna, con un'anteprima per chi entra. */
export interface ICampaignInvite {
  code: string;
  campaignId: string;
  ownerUid: string;
  createdAt: number;
  campaignName?: string;
  dmName?: string;
  /** Millisecondi; assente = non scade. */
  expiresAt?: number;
}

/** Stato di salute mostrato al gruppo in modalità narrativa. */
export type NarrativeVitals = 'healthy' | 'wounded' | 'critical' | 'down';

/**
 * `campaigns/{id}/sharedCharacters/{characterId}`: proiezione *party*, leggibile da tutti i membri.
 * Non contiene numeri (stanno in `liveStats`); le regole accettano solo lo schema v2.
 */
export interface ISharedCharacter {
  id: string;
  ownerUid: string;
  name: string;
  class: string;
  subclass: string;
  race: string;
  level: number;
  vitals?: NarrativeVitals;
  conditions?: string[];
  heroicInspiration?: boolean;
  /** Copia del ritratto nello Storage della campagna. */
  portraitUrl?: string;
  /** URL del ritratto originale da cui è stata fatta la copia. */
  portraitSource?: string;
  lastUpdated: number;
  schemaVersion: number;
}

/**
 * `campaigns/{id}/liveStats/{characterId}`: proiezione *tavolo* con i numeri.
 * La leggono il DM, il proprietario e, in modalità numerica, il gruppo.
 */
export interface ILiveStats {
  id: string;
  ownerUid: string;
  hp: { current: number; max: number; temp: number };
  armorClass: number;
  /** Piedi, come `character.speed`. */
  speed: number;
  passives: { perception: number; insight: number; investigation: number };
  /** null se il personaggio non ha una caratteristica da incantatore. */
  spellSaveDC: number | null;
  heroicInspiration: boolean;
  /** Solo i livelli con almeno uno slot. */
  spellSlots: Record<string, { max: number; used: number }>;
  conditions: string[];
  deathSaves: { successes: number; failures: number };
  hitDice: { total: string; used: number };
  /** Ultime azioni del DM già applicate (o rifiutate), per lo stato "in attesa". */
  appliedActionIds: string[];
  lastUpdated: number;
}

export type DmActionType = 'grantInspiration' | 'revokeInspiration' | 'shortRest' | 'longRest';

/** `campaigns/{id}/dmActions/{actionId}`: azione del DM che il client del giocatore applica. */
export interface IDmAction {
  id: string;
  type: DmActionType;
  /** Id dei personaggi destinatari. */
  targets: string[];
  createdBy: string;
  createdAt: number;
  expiresAt: number;
}

/** `campaigns/{id}/board/{postId}` */
export interface IBoardPost {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

/** `campaigns/{id}/dmPrivate/notes`: solo il DM. */
export interface IDmNotes {
  text: string;
  updatedAt: number;
}

/** Campagna salvata solo nel browser (prima della Fase G). Si può condividere con un tap. */
export interface ILocalCampaign {
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