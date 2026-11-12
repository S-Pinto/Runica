/**
 * Class progression (D&D 5e, 2024 rules): spell slots, hit die, proficiency bonus,
 * default spellcasting ability.
 *
 * Every derived value can be switched to manual on the character
 * (`character.automation.*`), so homebrew, multiclassing and anything the DM
 * decides are never overwritten.
 */
import type { AbilityScores, ICharacter } from '../characterTypes';

export type ClassKey =
  | 'artificer' | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk'
  | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'warlock' | 'wizard';

export type CasterType = 'full' | 'half' | 'third' | 'pact' | 'none';

export interface Automation {
  spellSlots: boolean;
  proficiency: boolean;
  hitDie: boolean;
}

type SlotTable = ICharacter['spellSlots'];

// Italian and English names, lowercase, without accents.
const CLASS_NAMES: Record<ClassKey, string[]> = {
  artificer: ['artificer', 'artefice'],
  barbarian: ['barbarian', 'barbaro'],
  bard: ['bard', 'bardo'],
  cleric: ['cleric', 'chierico'],
  druid: ['druid', 'druido'],
  fighter: ['fighter', 'guerriero'],
  monk: ['monk', 'monaco'],
  paladin: ['paladin', 'paladino'],
  ranger: ['ranger'],
  rogue: ['rogue', 'ladro'],
  sorcerer: ['sorcerer', 'stregone'],
  warlock: ['warlock'],
  wizard: ['wizard', 'mago'],
};

// Subclasses that turn a non-caster into a one-third caster.
const THIRD_CASTER_SUBCLASSES = ['eldritch knight', 'cavaliere mistico', 'arcane trickster', 'mistificatore arcano'];

const HIT_DIE: Record<ClassKey, number> = {
  barbarian: 12,
  fighter: 10, paladin: 10, ranger: 10,
  artificer: 8, bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
  sorcerer: 6, wizard: 6,
};

const SPELLCASTING_ABILITY: Partial<Record<ClassKey, keyof AbilityScores>> = {
  artificer: 'intelligence', wizard: 'intelligence',
  bard: 'charisma', paladin: 'charisma', sorcerer: 'charisma', warlock: 'charisma',
  cleric: 'wisdom', druid: 'wisdom', ranger: 'wisdom',
};

/** Full-caster slots per character level (index 0 = level 1); each row lists slot levels 1..9. */
const FULL_CASTER: number[][] = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Warlock Pact Magic: [number of slots, slot level] per warlock level. */
const PACT: [number, number][] = [
  [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
  [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
];

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Recognizes the class from free text such as "Mago (Evocazione)" or "Fighter". */
export function detectClass(text: string): ClassKey | null {
  const t = normalize(text);
  if (!t) return null;
  for (const [key, names] of Object.entries(CLASS_NAMES) as [ClassKey, string[]][]) {
    if (names.some((n) => new RegExp(`(^|[^a-z])${n}([^a-z]|$)`).test(t))) return key;
  }
  return null;
}

export function casterType(c: Pick<ICharacter, 'class' | 'subclass'>): CasterType {
  const cls = detectClass(c.class || '');
  if (!cls) return 'none';
  if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(cls)) return 'full';
  if (['paladin', 'ranger', 'artificer'].includes(cls)) return 'half';
  if (cls === 'warlock') return 'pact';
  const sub = normalize(`${c.class} ${c.subclass || ''}`);
  if ((cls === 'fighter' || cls === 'rogue') && THIRD_CASTER_SUBCLASSES.some((s) => sub.includes(s))) return 'third';
  return 'none';
}

export const proficiencyForLevel = (level: number) => Math.ceil(Math.max(1, Math.min(20, level)) / 4) + 1;

/** Max spell slots for levels 1..9 from class and level (2024 tables). */
export function autoSpellSlotMaxima(c: Pick<ICharacter, 'class' | 'subclass' | 'level'>): number[] {
  const level = Math.max(1, Math.min(20, c.level || 1));
  const empty = Array(9).fill(0);
  const fromFull = (casterLevel: number) => {
    if (casterLevel < 1) return empty;
    const row = FULL_CASTER[casterLevel - 1];
    return empty.map((_, i) => row[i] ?? 0);
  };
  switch (casterType(c)) {
    case 'full': return fromFull(level);
    case 'half': return fromFull(Math.ceil(level / 2));                 // 2024: half casters start at level 1
    case 'third': return level < 3 ? empty : fromFull(Math.ceil(level / 3));
    case 'pact': {
      const [count, slotLevel] = PACT[level - 1];
      return empty.map((_, i) => (i === slotLevel - 1 ? count : 0));
    }
    default: return empty;
  }
}

export function autoHitDie(c: Pick<ICharacter, 'class'>): string | null {
  const cls = detectClass(c.class || '');
  return cls ? `1d${HIT_DIE[cls]}` : null;
}

export function defaultSpellcastingAbility(c: Pick<ICharacter, 'class' | 'subclass'>): keyof AbilityScores | '' {
  const cls = detectClass(c.class || '');
  if (!cls) return '';
  if (casterType(c) === 'third') return 'intelligence';
  return SPELLCASTING_ABILITY[cls] ?? '';
}

/** True when the class is recognized, so automatic mode has something to compute. */
export const canAutomate = (c: Pick<ICharacter, 'class'>) => detectClass(c.class || '') !== null;

const slotMaxima = (slots: SlotTable) => Array.from({ length: 9 }, (_, i) => slots?.[i + 1]?.max ?? 0);
const sameArray = (a: number[], b: number[]) => a.every((v, i) => v === b[i]);

/**
 * Resolves the automation flags. Characters saved before this feature have none:
 * a value is treated as automatic only if it already matches the calculation
 * (or is still empty), so customized values are never overwritten.
 */
export function resolveAutomation(c: ICharacter): Automation {
  const known = canAutomate(c);
  const stored = c.automation || {};
  const auto = autoSpellSlotMaxima(c);
  const current = slotMaxima(c.spellSlots);
  return {
    spellSlots: stored.spellSlots ?? (known && (current.every((v) => v === 0) || sameArray(current, auto))),
    proficiency: stored.proficiency ?? (c.proficiencyBonus === proficiencyForLevel(c.level)),
    hitDie: stored.hitDie ?? (known && (c.hitDice?.total === autoHitDie(c) || c.hitDice?.total === '1d8')),
  };
}

/**
 * Returns the character with every automatic value recalculated
 * (or the same object if nothing changes). Manual values are left untouched;
 * used slots are clamped to the new maxima.
 */
export function withProgression(c: ICharacter): ICharacter {
  const automation = resolveAutomation(c);
  let next: ICharacter = c;
  const patch = (fields: Partial<ICharacter>) => { next = { ...next, ...fields }; };

  if (!c.automation || c.automation.spellSlots !== automation.spellSlots || c.automation.proficiency !== automation.proficiency || c.automation.hitDie !== automation.hitDie) {
    patch({ automation });
  }

  if (automation.spellSlots && canAutomate(c)) {
    const auto = autoSpellSlotMaxima(c);
    if (!sameArray(slotMaxima(c.spellSlots), auto)) {
      const spellSlots: SlotTable = {};
      auto.forEach((max, i) => {
        const used = Math.min(c.spellSlots?.[i + 1]?.used ?? 0, max);
        spellSlots[i + 1] = { max, used };
      });
      patch({ spellSlots });
    }
  }

  if (automation.proficiency) {
    const prof = proficiencyForLevel(c.level);
    if (c.proficiencyBonus !== prof) patch({ proficiencyBonus: prof });
  }

  if (automation.hitDie) {
    const die = autoHitDie(c);
    if (die && c.hitDice?.total !== die) patch({ hitDice: { ...c.hitDice, total: die } });
  }

  if (!c.spellcastingAbility) {
    const ability = defaultSpellcastingAbility(c);
    if (ability) patch({ spellcastingAbility: ability });
  }

  return next;
}
