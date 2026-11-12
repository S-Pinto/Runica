import { describe, expect, it } from 'vitest';
import type { ICharacter } from '../characterTypes';
import { longRestUpdate, shortRestUpdate } from './rest';

// Fixture parziale: le regole di riposo leggono solo questi campi.
const makeChar = (): ICharacter =>
  ({
    hp: { current: 3, max: 20, temporary: 5 },
    hitDice: { total: '1d8', used: 1 },
    deathSaves: { successes: 1, failures: 2 },
    spellSlots: { 1: { max: 4, used: 3 }, 2: { max: 2, used: 2 } },
    customResources: [{ id: 'r1', name: 'Ki', max: 3, used: 2 }],
    featuresAndTraits: [
      { id: 'f1', name: 'Short', recovery: 'short', uses: { current: 0, max: 2 } },
      { id: 'f2', name: 'Long', recovery: 'long', uses: { current: 0, max: 1 } },
      { id: 'f3', name: 'Passive' },
    ],
    equipment: [
      { id: 'e1', name: 'Bacchetta', charges: { current: 0, max: 7, resetType: 'dawn' } },
      { id: 'e2', name: 'Anello', charges: { current: 0, max: 2, resetType: 'shortRest' } },
      { id: 'e3', name: 'Spada', charges: { current: 1, max: 3, resetType: 'none' } },
      { id: 'e4', name: 'Pozione', recovery: 'long', uses: { current: 0, max: 1 } },
    ],
  }) as unknown as ICharacter;

describe('shortRestUpdate', () => {
  const out = shortRestUpdate(makeChar());

  it('ripristina solo i tratti a recupero breve', () => {
    const f = out.featuresAndTraits as any[];
    expect(f[0].uses.current).toBe(2);
    expect(f[1].uses.current).toBe(0);
    expect(f[2]).toEqual({ id: 'f3', name: 'Passive' });
  });

  it('ripristina solo le cariche shortRest', () => {
    const e = out.equipment as any[];
    expect(e[0].charges.current).toBe(0);
    expect(e[1].charges.current).toBe(2);
    expect(e[3].uses.current).toBe(0);
  });

  it('non tocca PF, slot e dadi vita', () => {
    expect(out).not.toHaveProperty('hp');
    expect(out).not.toHaveProperty('spellSlots');
    expect(out).not.toHaveProperty('hitDice');
  });

  it('non muta l\'input', () => {
    const c = makeChar();
    shortRestUpdate(c);
    expect(c).toEqual(makeChar());
  });
});

describe('longRestUpdate', () => {
  const out = longRestUpdate(makeChar());

  it('ripristina PF, azzera PF temporanei e tiri salvezza contro morte', () => {
    expect(out.hp).toEqual({ current: 20, max: 20, temporary: 0 });
    expect(out.deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it('azzera slot usati, dadi vita usati e risorse custom', () => {
    expect(out.spellSlots).toEqual({ 1: { max: 4, used: 0 }, 2: { max: 2, used: 0 } });
    expect(out.hitDice).toEqual({ total: '1d8', used: 0 });
    expect((out.customResources as any[])[0].used).toBe(0);
  });

  it('ripristina tratti a recupero breve e lungo', () => {
    const f = out.featuresAndTraits as any[];
    expect(f[0].uses.current).toBe(2);
    expect(f[1].uses.current).toBe(1);
  });

  it('ricarica gli oggetti tranne quelli con resetType none', () => {
    const e = out.equipment as any[];
    expect(e[0].charges.current).toBe(7);
    expect(e[1].charges.current).toBe(2);
    expect(e[2].charges.current).toBe(1);
    expect(e[3].uses.current).toBe(1);
  });

  it('non muta l\'input', () => {
    const c = makeChar();
    longRestUpdate(c);
    expect(c).toEqual(makeChar());
  });
});
