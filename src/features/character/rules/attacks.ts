// Motore unico degli attacchi: armi equipaggiate, poteri degli oggetti, trucchetti, privilegi-azione
// e attacchi manuali diventano `ResolvedAction` con totale per colpire, formula del danno e dettaglio.
// Lo usano Combattimento, editor e Stampa, così mostrano gli stessi valori. Funzioni pure.
import type { AbilityScores, Attack, EquipmentItem, ICharacter } from '../characterTypes';
import { WEAPON_MASTERIES } from '../../../data/weaponProperties';
import { ABILITY_SHORT, damageTypeLabel } from '../../../lib/labels';
import { doubleDice, formatModifier, getModifier, rollDiceExpression, type Rng } from '../utils/characterUtils';
import { getProficiencyBonus } from './combat';
import {
    adjustItemCharges, getItemCharges, hasActivePower, hasProperty, isAttunementSatisfied,
    isShield, isWeapon, usesAmmunition,
} from './equipment';
import { resolveOptionalRules } from './encumbrance';

export type AbilityKey = keyof AbilityScores;
export const ABILITY_KEYS: AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

/** Valore salvato che significa "nessuna caratteristica" (il vuoto, per le armi, vuol dire "automatica"). */
export const NO_ABILITY = 'none';

const ABILITY_ALIASES: Record<string, AbilityKey> = {
    str: 'strength', dex: 'dexterity', con: 'constitution', int: 'intelligence', wis: 'wisdom', cha: 'charisma',
    for: 'strength', des: 'dexterity', cos: 'constitution', sag: 'wisdom', car: 'charisma',
};

/** Accetta sia le chiavi complete (`strength`) sia le abbreviazioni salvate dai form (`str`, `FOR`). */
export const normalizeAbility = (value: string | null | undefined): AbilityKey | undefined => {
    if (!value) return undefined;
    const key = value.trim().toLowerCase();
    if ((ABILITY_KEYS as string[]).includes(key)) return key as AbilityKey;
    return ABILITY_ALIASES[key];
};

/** Bonus fisso scritto a mano: "+1", "-2", " 3 ", 2. Formule di dadi ("+1d4") e testo valgono 0. */
export const parseBonus = (value: string | number | null | undefined): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0;
    const match = String(value ?? '').replace(/\s+/g, '').match(/^[+-]?\d+(?![\dd])/i);
    return match ? parseInt(match[0], 10) : 0;
};

const abilityMod = (scores: AbilityScores, ability: AbilityKey | undefined) =>
    ability ? getModifier(scores?.[ability] ?? 10) : 0;

export const isRangedWeapon = (properties: string[] | undefined) =>
    hasProperty(properties, 'Ammunition') || (hasProperty(properties, 'Range') && !hasProperty(properties, 'Thrown'));

/**
 * Caratteristica dell'arma: quella scelta a mano se c'è (`none` = nessuna), altrimenti
 * Accurata → la migliore fra FOR e DES, a distanza → DES, in mischia → FOR.
 */
export const resolveWeaponAbility = (
    scores: AbilityScores,
    properties: string[] | undefined,
    explicit: string | undefined,
): AbilityKey | undefined => {
    if (explicit === NO_ABILITY) return undefined;
    const chosen = normalizeAbility(explicit);
    if (chosen) return chosen;
    if (hasProperty(properties, 'Finesse')) {
        return abilityMod(scores, 'dexterity') > abilityMod(scores, 'strength') ? 'dexterity' : 'strength';
    }
    return isRangedWeapon(properties) ? 'dexterity' : 'strength';
};

/** Bonus magico dell'arma: `attackBonus`; per le armi salvate in passato, `armorClass` riusato come bonus. */
export const weaponMagicBonus = (item: EquipmentItem) => {
    if (item.attackBonus !== undefined && String(item.attackBonus).trim() !== '') return parseBonus(item.attackBonus);
    return item.armorType === 'weapon' ? parseBonus(item.armorClass) : 0;
};

/** Aggiunge un modificatore a una formula, unendolo all'eventuale costante finale ("1d8 + 1", +3 → "1d8 + 4"). */
export const addModifierToFormula = (formula: string, modifier: number): string => {
    const clean = (formula || '').trim();
    const tidy = (s: string) => s.replace(/\s*\+\s*/g, ' + ').replace(/\s*-\s*/g, ' - ').trim();
    if (!clean) return modifier ? String(modifier) : '';
    const match = clean.match(/^(.*?)\s*([+-])\s*(\d+)\s*$/);
    let dice = clean;
    let total = modifier;
    if (match && match[1].trim()) {
        dice = match[1];
        total += parseInt(match[3], 10) * (match[2] === '-' ? -1 : 1);
    }
    if (total === 0) return tidy(dice);
    return `${tidy(dice)} ${total > 0 ? '+' : '-'} ${Math.abs(total)}`;
};

// ---------- Azioni risolte ----------

export type ActionSource = 'weapon' | 'item' | 'spell' | 'feat' | 'custom';

export interface ActionPart {
    label: string;
    value: number;
}

export interface ResolvedAction {
    id: string;
    name: string;
    source: ActionSource;
    sourceId: string;
    /** `attack`: tiro per colpire; `save`: tiro salvezza del bersaglio; `none`: nessun tiro. */
    roll: 'attack' | 'save' | 'none';
    toHit: number;
    hitParts: ActionPart[];
    saveDC?: number;
    saveAbility?: AbilityKey;
    attackAbility?: AbilityKey;
    damageAbility?: AbilityKey;
    /** Formula da tirare, modificatori inclusi ('' se l'azione non infligge danni). */
    damage: string;
    damageParts: ActionPart[];
    /** Formula a due mani per le armi Versatili, modificatori inclusi. */
    versatileDamage?: string;
    /** Vero se uno scudo impedisce l'impugnatura a due mani. */
    versatileBlocked?: boolean;
    damageType?: string;
    additionalDamage: { formula: string; type: string }[];
    mastery?: string;
    properties: string[];
    notes?: string;
    uses?: { current: number; max: number };
    recovery?: 'short' | 'long' | 'none';
    /** Munizioni collegate (solo con la regola opzionale attiva). */
    ammo?: { itemId: string; name: string; quantity: number };
    /** Richiede sintonia e non c'è: i bonus magici sono esclusi. */
    attunementMissing?: boolean;
    /** Solo gli attacchi manuali si modificano dall'elenco attacchi; il resto arriva da inventario, incantesimi o privilegi. */
    editable: boolean;
}

const sum = (parts: ActionPart[]) => parts.reduce((t, p) => t + p.value, 0);

const abilityPart = (scores: AbilityScores, ability: AbilityKey | undefined): ActionPart[] =>
    ability ? [{ label: ABILITY_SHORT[ability], value: abilityMod(scores, ability) }] : [];

const nonZero = (parts: ActionPart[]) => parts.filter(p => p.value !== 0);

const mapRecovery = (r: string | undefined): ResolvedAction['recovery'] =>
    r === 'short' || r === 'shortRest' ? 'short' : r === 'long' || r === 'longRest' ? 'long' : r === 'none' ? 'none' : undefined;

const masteryNote = (mastery: string | undefined) =>
    mastery ? (WEAPON_MASTERIES[mastery]?.name ?? mastery) : undefined;

/** Parti del bonus d'attacco con incantesimo: caratteristica da incantatore + competenza. */
const spellAttackParts = (c: ICharacter): ActionPart[] => {
    const ability = normalizeAbility(c.spellcastingAbility || undefined);
    return [...abilityPart(c.abilityScores, ability), { label: 'Comp.', value: getProficiencyBonus(c) }];
};

const spellSaveDC = (c: ICharacter) => 8 + sum(spellAttackParts(c));

export const resolveWeaponAction = (c: ICharacter, item: EquipmentItem): ResolvedAction => {
    const scores = c.abilityScores;
    const properties = item.properties || [];
    const attackAbility = resolveWeaponAbility(scores, properties, item.attackAbility);
    const damageAbility = item.damageAbility === NO_ABILITY ? undefined : normalizeAbility(item.damageAbility) ?? attackAbility;
    const attuned = isAttunementSatisfied(item);
    const magic = attuned ? weaponMagicBonus(item) : 0;
    const proficient = item.isProficient ?? true;

    const hitParts: ActionPart[] = [
        ...abilityPart(scores, attackAbility),
        ...(proficient ? [{ label: 'Comp.', value: getProficiencyBonus(c) }] : []),
        ...(magic ? [{ label: 'Magico', value: magic }] : []),
    ];
    const damageParts = nonZero([...abilityPart(scores, damageAbility), ...(magic ? [{ label: 'Magico', value: magic }] : [])]);
    const damageMod = sum(damageParts);
    const versatile = hasProperty(properties, 'Versatile') && item.versatileDamage?.trim()
        ? addModifierToFormula(item.versatileDamage, damageMod)
        : undefined;

    const rules = resolveOptionalRules(c);
    const ammoItem = rules.ammunition && usesAmmunition(item) && item.ammoItemId
        ? c.equipment?.find(i => i.id === item.ammoItemId)
        : undefined;

    return {
        id: item.id,
        name: item.name,
        source: 'weapon',
        sourceId: item.id,
        roll: 'attack',
        toHit: sum(hitParts),
        hitParts,
        attackAbility,
        damageAbility,
        damage: addModifierToFormula(item.damage?.trim() || '1d6', damageMod),
        damageParts,
        versatileDamage: versatile,
        versatileBlocked: !!versatile && !!c.equipment?.some(i => i.equipped && isShield(i)),
        damageType: item.damageType || undefined,
        additionalDamage: item.additionalDamage || [],
        mastery: item.mastery || undefined,
        properties,
        notes: masteryNote(item.mastery),
        uses: getItemCharges(item) ?? undefined,
        recovery: mapRecovery(item.charges ? item.charges.resetType : item.recovery),
        ammo: ammoItem ? { itemId: ammoItem.id, name: ammoItem.name, quantity: ammoItem.quantity ?? 0 } : undefined,
        attunementMissing: !attuned,
        editable: false,
    };
};

const resolveItemPower = (c: ICharacter, item: EquipmentItem): ResolvedAction => {
    const saveAbility = normalizeAbility(item.saveAbility);
    const damage = item.damage?.trim() || '';
    const hitParts = spellAttackParts(c);
    const roll: ResolvedAction['roll'] = saveAbility ? 'save' : damage ? 'attack' : 'none';
    const charges = getItemCharges(item);
    return {
        id: `magic-${item.id}`,
        name: item.grantsSpellName?.trim() || item.name,
        source: 'item',
        sourceId: item.id,
        roll,
        toHit: roll === 'attack' ? sum(hitParts) : 0,
        hitParts: roll === 'attack' ? hitParts : [],
        saveDC: saveAbility ? spellSaveDC(c) : undefined,
        saveAbility,
        damage,
        damageParts: [],
        damageType: item.damageType || undefined,
        additionalDamage: [],
        properties: [],
        notes: item.grantsSpellName?.trim() ? item.name : undefined,
        uses: charges ? { current: charges.current, max: charges.max } : undefined,
        recovery: mapRecovery(item.charges ? item.charges.resetType : item.recovery),
        attunementMissing: !isAttunementSatisfied(item),
        editable: false,
    };
};

const resolveCantrip = (c: ICharacter, spell: ICharacter['spells'][number]): ResolvedAction => {
    const saveAbility = normalizeAbility(spell.saveAbility);
    const hitParts = saveAbility ? [] : spellAttackParts(c);
    return {
        id: spell.id,
        name: spell.name,
        source: 'spell',
        sourceId: spell.id,
        roll: saveAbility ? 'save' : 'attack',
        toHit: sum(hitParts),
        hitParts,
        saveDC: saveAbility ? spellSaveDC(c) : undefined,
        saveAbility,
        damage: spell.damage?.trim() || '',
        damageParts: [],
        damageType: spell.damageType || undefined,
        additionalDamage: [],
        properties: [],
        notes: 'Trucchetto',
        editable: false,
    };
};

const resolveFeatureAction = (feat: ICharacter['featuresAndTraits'][number]): ResolvedAction => ({
    id: feat.id,
    name: feat.name,
    source: 'feat',
    sourceId: feat.id,
    roll: 'none',
    toHit: 0,
    hitParts: [],
    damage: '',
    damageParts: [],
    additionalDamage: [],
    properties: [],
    notes: feat.description,
    uses: feat.uses && feat.uses.max > 0 ? feat.uses : undefined,
    recovery: mapRecovery(feat.recovery),
    editable: false,
});

/**
 * Attacco scritto a mano (anche dei compagni): la caratteristica è solo quella scelta,
 * il bonus vale per colpire e per i danni; con un tiro salvezza il bonus è la CD.
 */
export const resolveCustomAttack = (attack: Attack, scores: AbilityScores, proficiencyBonus: number): ResolvedAction => {
    const saveAbility = normalizeAbility(attack.saveAbility);
    const base = {
        id: attack.id,
        name: attack.name,
        source: 'custom' as const,
        sourceId: attack.id,
        damageType: attack.damageType || undefined,
        additionalDamage: attack.additionalDamage || [],
        mastery: attack.mastery || undefined,
        properties: attack.properties || [],
        notes: attack.notes || masteryNote(attack.mastery),
        uses: attack.uses && attack.uses.max > 0 ? attack.uses : undefined,
        recovery: mapRecovery(attack.recovery),
        editable: true,
    };
    if (saveAbility) {
        return {
            ...base,
            roll: 'save',
            toHit: 0,
            hitParts: [],
            saveDC: parseBonus(attack.bonus) || 10,
            saveAbility,
            damage: attack.damage?.trim() || '',
            damageParts: [],
        };
    }
    const attackAbility = attack.attackAbility === NO_ABILITY ? undefined : normalizeAbility(attack.attackAbility);
    const damageAbility = attack.damageAbility === NO_ABILITY ? undefined : normalizeAbility(attack.damageAbility);
    const bonus = parseBonus(attack.bonus);
    const hitParts: ActionPart[] = [
        ...abilityPart(scores, attackAbility),
        ...(attack.isProficient ? [{ label: 'Comp.', value: proficiencyBonus }] : []),
        ...(bonus ? [{ label: 'Bonus', value: bonus }] : []),
    ];
    const damageParts = nonZero([...abilityPart(scores, damageAbility), ...(bonus ? [{ label: 'Bonus', value: bonus }] : [])]);
    return {
        ...base,
        roll: 'attack',
        toHit: sum(hitParts),
        hitParts,
        attackAbility,
        damageAbility,
        damage: addModifierToFormula(attack.damage?.trim() || '', sum(damageParts)),
        damageParts,
    };
};

export interface BuildActionsOptions {
    /** Fonti da includere (tutte se assente). */
    include?: ActionSource[];
}

/**
 * Tutte le azioni del personaggio, nell'ordine armi, poteri degli oggetti, trucchetti, privilegi, attacchi manuali.
 * Un'arma con lo stesso nome di un attacco manuale non viene ripetuta: vince l'attacco manuale.
 */
export const buildCharacterActions = (c: ICharacter, options: BuildActionsOptions = {}): ResolvedAction[] => {
    const want = (s: ActionSource) => !options.include || options.include.includes(s);
    const equipment = c.equipment || [];
    const custom = c.attacks || [];
    const customNames = new Set(custom.map(a => a.name.trim().toLowerCase()));
    const customIds = new Set(custom.map(a => a.id));
    const prof = getProficiencyBonus(c);
    const actions: ResolvedAction[] = [];

    if (want('weapon')) {
        equipment
            .filter(i => i.equipped && isWeapon(i) && !customIds.has(i.id) && !customNames.has(i.name.trim().toLowerCase()))
            .forEach(i => actions.push(resolveWeaponAction(c, i)));
    }
    if (want('item')) {
        equipment.filter(i => i.equipped && hasActivePower(i)).forEach(i => actions.push(resolveItemPower(c, i)));
    }
    if (want('spell')) {
        (c.spells || []).filter(s => s.level === 0 && s.damage?.trim()).forEach(s => actions.push(resolveCantrip(c, s)));
    }
    if (want('feat')) {
        (c.featuresAndTraits || []).filter(f => f.isAction).forEach(f => actions.push(resolveFeatureAction(f)));
    }
    if (want('custom')) {
        custom.forEach(a => actions.push(resolveCustomAttack(a, c.abilityScores, prof)));
    }
    return actions;
};

/** Spende o recupera un uso dell'azione nella sua fonte (oggetto, privilegio o attacco manuale). */
export const spendActionUse = (c: ICharacter, action: ResolvedAction, delta: number): Partial<ICharacter> => {
    if (!action.uses) return {};
    const clampUses = (u: { current: number; max: number }) => ({ ...u, current: Math.max(0, Math.min(u.max, u.current + delta)) });
    switch (action.source) {
        case 'weapon':
        case 'item':
            return { equipment: adjustItemCharges(c.equipment || [], action.sourceId, delta) };
        case 'feat':
            return { featuresAndTraits: c.featuresAndTraits.map(f => (f.id === action.sourceId && f.uses ? { ...f, uses: clampUses(f.uses) } : f)) };
        case 'custom':
            return { attacks: c.attacks.map(a => (a.id === action.sourceId && a.uses ? { ...a, uses: clampUses(a.uses) } : a)) };
        default:
            return {};
    }
};

// ---------- Testi ----------

export const formatPart = (p: ActionPart) => `${formatModifier(p.value)} ${p.label}`;

/** "+5", "CD 13 DES" o "—". */
export const formatActionHit = (a: ResolvedAction) =>
    a.roll === 'attack' ? formatModifier(a.toHit)
        : a.roll === 'save' ? `CD ${a.saveDC}${a.saveAbility ? ` ${ABILITY_SHORT[a.saveAbility]}` : ''}`
            : '—';

/** "1d8 + 3 Tagliente + 1d6 Fuoco". */
export const formatActionDamage = (a: ResolvedAction, versatile = false) => {
    const main = (versatile && a.versatileDamage) || a.damage;
    if (!main) return '';
    return [`${main} ${damageTypeLabel(a.damageType)}`.trim(), ...a.additionalDamage.map(e => `${e.formula} ${damageTypeLabel(e.type)}`.trim())].join(' + ');
};

// ---------- Tiri ----------

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface AttackRollResult {
    total: number;
    /** d20 tenuto. */
    natural: number;
    /** Entrambi i d20 con vantaggio/svantaggio. */
    dice: number[];
    mode: RollMode;
    isCrit: boolean;
    isFumble: boolean;
    breakdown: string;
}

const d20 = (rng: Rng) => Math.floor(rng() * 20) + 1;

export const rollAttack = (action: ResolvedAction, mode: RollMode = 'normal', rng: Rng = Math.random): AttackRollResult => {
    const first = d20(rng);
    const dice = mode === 'normal' ? [first] : [first, d20(rng)];
    const natural = mode === 'advantage' ? Math.max(...dice) : mode === 'disadvantage' ? Math.min(...dice) : first;
    const head = mode === 'normal' ? `d20(${natural})` : `d20 ${mode === 'advantage' ? 'vantaggio' : 'svantaggio'}(${dice.join('|')} → ${natural})`;
    const parts = nonZero(action.hitParts).map(p => `${p.value < 0 ? '-' : '+'} ${Math.abs(p.value)} ${p.label}`);
    return {
        total: natural + action.toHit,
        natural,
        dice,
        mode,
        isCrit: natural === 20,
        isFumble: natural === 1,
        breakdown: [head, ...parts].join(' '),
    };
};

export interface DamageRollResult {
    total: number;
    parts: { total: number; type?: string; pretty: string }[];
    isCrit: boolean;
    versatile: boolean;
    /** "12 (8 Tagliente + 4 Fuoco)" */
    value: string;
    breakdown: string;
}

/** Tira i danni; con un critico raddoppia tutti i dadi (non i modificatori), anche quelli extra. */
export const rollDamage = (
    action: ResolvedAction,
    { crit = false, versatile = false }: { crit?: boolean; versatile?: boolean } = {},
    rng: Rng = Math.random,
): DamageRollResult => {
    const useVersatile = versatile && !!action.versatileDamage;
    const base = (useVersatile ? action.versatileDamage : action.damage) || '';
    const entries = [{ formula: base, type: action.damageType }, ...action.additionalDamage.map(e => ({ formula: e.formula, type: e.type }))]
        .filter(e => e.formula?.trim());
    const parts = entries.map(e => {
        const r = rollDiceExpression(crit ? doubleDice(e.formula) : e.formula, rng);
        return { total: r.total, type: e.type, pretty: `${r.pretty}${e.type ? ` (${damageTypeLabel(e.type)})` : ''}` };
    });
    const total = parts.reduce((t, p) => t + p.total, 0);
    const labelled = parts.map(p => `${p.total} ${damageTypeLabel(p.type)}`.trim());
    return {
        total,
        parts,
        isCrit: crit,
        versatile: useVersatile,
        value: parts.length > 1 ? `${total} (${labelled.join(' + ')})` : `${total} ${damageTypeLabel(action.damageType)}`.trim(),
        breakdown: (crit ? 'Critico, dadi raddoppiati: ' : '') + (useVersatile ? 'A due mani: ' : '') + parts.map(p => p.pretty).join(' + '),
    };
};
