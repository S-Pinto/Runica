import { describe, expect, it } from 'vitest';
import type { ICharacter } from '../characterTypes';
import {
  autoHitDie,
  autoSpellSlotMaxima,
  canAutomate,
  casterType,
  defaultSpellcastingAbility,
  detectClass,
  proficiencyForLevel,
  withProgression,
} from './progression';

// Fixture minima: i test usano solo i campi letti dalle regole.
const makeChar = (over: Partial<ICharacter> = {}): ICharacter =>
  ({
    class: '',
    subclass: '',
    level: 1,
    proficiencyBonus: 2,
    spellSlots: {},
    hitDice: { total: '1d8', used: 0 },
    spellcastingAbility: '',
    ...over,
  }) as unknown as ICharacter;

describe('detectClass', () => {
  it('riconosce nomi italiani e inglesi', () => {
    expect(detectClass('Mago')).toBe('wizard');
    expect(detectClass('Fighter')).toBe('fighter');
    expect(detectClass('Guerriero')).toBe('fighter');
  });
  it('ignora maiuscole, accenti e testo aggiuntivo', () => {
    expect(detectClass('Mago (Evocazione)')).toBe('wizard');
    expect(detectClass('  CLERIC ')).toBe('cleric');
  });
  it('restituisce null per testo vuoto o sconosciuto', () => {
    expect(detectClass('')).toBeNull();
    expect(detectClass('Pirata')).toBeNull();
  });
});

describe('proficiencyForLevel', () => {
  it.each([
    [1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [13, 5], [17, 6], [20, 6],
  ])('livello %i -> +%i', (level, bonus) => {
    expect(proficiencyForLevel(level)).toBe(bonus);
  });
  it('limita i livelli fuori scala', () => {
    expect(proficiencyForLevel(0)).toBe(2);
    expect(proficiencyForLevel(99)).toBe(6);
  });
});

describe('casterType', () => {
  it('classifica le classi base', () => {
    expect(casterType(makeChar({ class: 'Mago' }))).toBe('full');
    expect(casterType(makeChar({ class: 'Paladino' }))).toBe('half');
    expect(casterType(makeChar({ class: 'Warlock' }))).toBe('pact');
    expect(casterType(makeChar({ class: 'Barbaro' }))).toBe('none');
  });
  it('riconosce le sottoclassi third caster', () => {
    expect(casterType(makeChar({ class: 'Guerriero', subclass: 'Cavaliere Mistico' }))).toBe('third');
    expect(casterType(makeChar({ class: 'Rogue', subclass: 'Arcane Trickster' }))).toBe('third');
    expect(casterType(makeChar({ class: 'Guerriero', subclass: 'Campione' }))).toBe('none');
  });
});

describe('autoSpellSlotMaxima', () => {
  it('full caster: livello 1 e 20', () => {
    expect(autoSpellSlotMaxima(makeChar({ class: 'Mago', level: 1 }))).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(autoSpellSlotMaxima(makeChar({ class: 'Mago', level: 20 }))).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });
  it('half caster (2024) ha slot dal livello 1', () => {
    expect(autoSpellSlotMaxima(makeChar({ class: 'Paladino', level: 1 }))).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
  it('third caster non ha slot sotto il livello 3', () => {
    const base = { class: 'Guerriero', subclass: 'Eldritch Knight' };
    expect(autoSpellSlotMaxima(makeChar({ ...base, level: 2 }))).toEqual(Array(9).fill(0));
    expect(autoSpellSlotMaxima(makeChar({ ...base, level: 3 }))[0]).toBe(2);
  });
  it('warlock usa Pact Magic', () => {
    expect(autoSpellSlotMaxima(makeChar({ class: 'Warlock', level: 5 }))).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0]);
    expect(autoSpellSlotMaxima(makeChar({ class: 'Warlock', level: 11 }))).toEqual([0, 0, 0, 0, 3, 0, 0, 0, 0]);
  });
  it('non incantatori: nessuno slot', () => {
    expect(autoSpellSlotMaxima(makeChar({ class: 'Barbaro', level: 10 }))).toEqual(Array(9).fill(0));
  });
});

describe('autoHitDie / defaultSpellcastingAbility / canAutomate', () => {
  it('dado vita per classe', () => {
    expect(autoHitDie(makeChar({ class: 'Barbaro' }))).toBe('1d12');
    expect(autoHitDie(makeChar({ class: 'Mago' }))).toBe('1d6');
    expect(autoHitDie(makeChar({ class: '???' }))).toBeNull();
  });
  it('caratteristica da incantatore', () => {
    expect(defaultSpellcastingAbility(makeChar({ class: 'Mago' }))).toBe('intelligence');
    expect(defaultSpellcastingAbility(makeChar({ class: 'Chierico' }))).toBe('wisdom');
    expect(defaultSpellcastingAbility(makeChar({ class: 'Bardo' }))).toBe('charisma');
    expect(defaultSpellcastingAbility(makeChar({ class: 'Barbaro' }))).toBe('');
    expect(defaultSpellcastingAbility(makeChar({ class: 'Guerriero', subclass: 'Eldritch Knight' }))).toBe('intelligence');
  });
  it('canAutomate dipende dal riconoscimento della classe', () => {
    expect(canAutomate(makeChar({ class: 'Mago' }))).toBe(true);
    expect(canAutomate(makeChar({ class: 'Pirata' }))).toBe(false);
  });
});

describe('withProgression', () => {
  it('ricalcola slot, competenza e dado vita in automatico', () => {
    const out = withProgression(
      makeChar({ class: 'Mago', level: 5, proficiencyBonus: 2, automation: { spellSlots: true, proficiency: true, hitDie: true } }),
    );
    expect(out.spellSlots[1]).toEqual({ max: 4, used: 0 });
    expect(out.spellSlots[3]).toEqual({ max: 2, used: 0 });
    expect(out.proficiencyBonus).toBe(3);
    expect(out.hitDice.total).toBe('1d6');
    expect(out.spellcastingAbility).toBe('intelligence');
  });

  it('non tocca i valori in modalità manuale', () => {
    const c = makeChar({
      class: 'Mago',
      level: 5,
      proficiencyBonus: 9,
      spellSlots: { 1: { max: 7, used: 1 } } as ICharacter['spellSlots'],
      automation: { spellSlots: false, proficiency: false, hitDie: false },
    });
    const out = withProgression(c);
    expect(out.proficiencyBonus).toBe(9);
    expect(out.spellSlots[1]).toEqual({ max: 7, used: 1 });
  });

  it('limita gli slot usati ai nuovi massimi', () => {
    const c = makeChar({
      class: 'Mago',
      level: 1,
      spellSlots: { 1: { max: 4, used: 4 } } as ICharacter['spellSlots'],
      automation: { spellSlots: true, proficiency: true, hitDie: true },
    });
    expect(withProgression(c).spellSlots[1]).toEqual({ max: 2, used: 2 });
  });

  it('tratta come manuale un bonus legacy non coerente con il livello', () => {
    const out = withProgression(makeChar({ class: 'Mago', level: 5, proficiencyBonus: 2 }));
    expect(out.proficiencyBonus).toBe(2);
    expect(out.automation?.proficiency).toBe(false);
  });

  it('è idempotente: la seconda applicazione restituisce lo stesso oggetto', () => {
    const once = withProgression(makeChar({ class: 'Mago', level: 3, proficiencyBonus: 2 }));
    expect(withProgression(once)).toBe(once);
  });
});
