/**
 * Italian display labels for D&D 5e terms.
 * Stored data keeps the English keys (e.g. skill.name === 'Perception');
 * use these maps only when rendering.
 */
import type { AbilityScores, DmActionType } from '../features/character/characterTypes';
import { CONDITIONS } from '../data/conditions';

export const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  strength: 'Forza',
  dexterity: 'Destrezza',
  constitution: 'Costituzione',
  intelligence: 'Intelligenza',
  wisdom: 'Saggezza',
  charisma: 'Carisma',
};

export const ABILITY_SHORT: Record<keyof AbilityScores, string> = {
  strength: 'FOR',
  dexterity: 'DES',
  constitution: 'COS',
  intelligence: 'INT',
  wisdom: 'SAG',
  charisma: 'CAR',
};

export const SKILL_LABELS: Record<string, string> = {
  Acrobatics: 'Acrobazia',
  'Animal Handling': 'Addestrare animali',
  Arcana: 'Arcano',
  Athletics: 'Atletica',
  Deception: 'Inganno',
  History: 'Storia',
  Insight: 'Intuizione',
  Intimidation: 'Intimidire',
  Investigation: 'Indagare',
  Medicine: 'Medicina',
  Nature: 'Natura',
  Perception: 'Percezione',
  Performance: 'Intrattenere',
  Persuasion: 'Persuasione',
  Religion: 'Religione',
  'Sleight of Hand': 'Rapidità di mano',
  Stealth: 'Furtività',
  Survival: 'Sopravvivenza',
};

export const SPELL_SCHOOL_LABELS: Record<string, string> = {
  Abjuration: 'Abiurazione',
  Conjuration: 'Evocazione',
  Divination: 'Divinazione',
  Enchantment: 'Ammaliamento',
  Evocation: 'Invocazione',
  Illusion: 'Illusione',
  Necromancy: 'Necromanzia',
  Transmutation: 'Trasmutazione',
};

/** Tipi di danno (chiavi inglesi salvate nei dati). */
export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  Acid: 'Acido',
  Bludgeoning: 'Contundente',
  Cold: 'Freddo',
  Fire: 'Fuoco',
  Force: 'Forza',
  Lightning: 'Fulmine',
  Necrotic: 'Necrotico',
  Piercing: 'Perforante',
  Poison: 'Veleno',
  Psychic: 'Psichico',
  Radiant: 'Radioso',
  Slashing: 'Tagliente',
  Thunder: 'Tuono',
};

/** Etichetta italiana di un tipo di danno; un testo libero (es. "tagliente") resta com'è. */
export const damageTypeLabel = (key: string | undefined) => (key ? DAMAGE_TYPE_LABELS[key] ?? key : '');

export const abilityLabel =(key: string) => ABILITY_LABELS[key as keyof AbilityScores] ?? key;
export const skillLabel = (name: string) => SKILL_LABELS[name] ?? name;
export const schoolLabel = (name: string) => SPELL_SCHOOL_LABELS[name] ?? name;

/** Azioni rapide del DM (`dmActions.type`). */
export const DM_ACTION_LABELS: Record<DmActionType, string> = {
  grantInspiration: 'Ispirazione Eroica',
  revokeInspiration: 'Ispirazione revocata',
  shortRest: 'Riposo breve',
  longRest: 'Riposo lungo',
};

/** Nome italiano di una condizione (le chiavi salvate restano in inglese). */
export const conditionLabel = (key: string) => CONDITIONS[key]?.name ?? key;
