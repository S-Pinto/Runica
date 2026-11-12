/**
 * Rest rules (D&D 5e, 2024 rules where they differ from 2014).
 * Pure functions: they return the fields to update, the caller persists them.
 */
import { ICharacter } from '../characterTypes';

const isShort = (r?: string) => r === 'short' || r === 'shortRest';
const isLongOrShort = (r?: string) => r === 'short' || r === 'shortRest' || r === 'long' || r === 'longRest';

/** Short rest: restores uses and charges that recharge on a short rest. Hit dice are spent separately. */
export function shortRestUpdate(c: ICharacter): Partial<ICharacter> {
  return {
    featuresAndTraits: (c.featuresAndTraits || []).map((f) =>
      f.uses && isShort(f.recovery) ? { ...f, uses: { ...f.uses, current: f.uses.max } } : f,
    ),
    equipment: (c.equipment || []).map((item) => {
      let next = item;
      if (item.charges && item.charges.resetType === 'shortRest') {
        next = { ...next, charges: { ...item.charges, current: item.charges.max } };
      }
      if (item.uses && isShort(item.recovery)) {
        next = { ...next, uses: { ...item.uses, current: item.uses.max } };
      }
      return next;
    }),
  };
}

/**
 * Long rest: everything a short rest restores, plus full HP, all spell slots,
 * all spent hit dice (2024 rule), daily item charges and custom resources.
 * Temporary HP and death saves are cleared.
 */
export function longRestUpdate(c: ICharacter): Partial<ICharacter> {
  const spellSlots = Object.fromEntries(
    Object.entries(c.spellSlots || {}).map(([lvl, s]) => [lvl, { ...s, used: 0 }]),
  ) as ICharacter['spellSlots'];

  return {
    hp: { ...c.hp, current: c.hp.max, temporary: 0 },
    hitDice: { ...c.hitDice, used: 0 },
    deathSaves: { successes: 0, failures: 0 },
    spellSlots,
    customResources: (c.customResources || []).map((r) => ({ ...r, used: 0 })),
    featuresAndTraits: (c.featuresAndTraits || []).map((f) =>
      f.uses && isLongOrShort(f.recovery) ? { ...f, uses: { ...f.uses, current: f.uses.max } } : f,
    ),
    equipment: (c.equipment || []).map((item) => {
      let next = item;
      if (item.charges && item.charges.resetType !== 'none') {
        // 'dawn' items recharge once per day; a long rest is the closest in-app moment.
        next = { ...next, charges: { ...item.charges, current: item.charges.max } };
      }
      if (item.uses && isLongOrShort(item.recovery)) {
        next = { ...next, uses: { ...item.uses, current: item.uses.max } };
      }
      return next;
    }),
  };
}
