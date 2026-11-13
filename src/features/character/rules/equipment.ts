// Regole pure dell'equipaggiamento: classificazione degli oggetti (anche nei formati salvati in passato),
// equipaggia/rimuovi, sintonia, cariche, quantità e munizioni.
import type { EquipmentItem, ItemCategory } from '../characterTypes';
import { WEAPON_PROPERTIES } from '../../../data/weaponProperties';

export type ArmorWeight = 'light' | 'medium' | 'heavy';
const ARMOR_WEIGHTS: readonly string[] = ['light', 'medium', 'heavy'];

/** Limite delle sintonie contemporanee (regole 2024). */
export const MAX_ATTUNED_ITEMS = 3;

// ---------- Classificazione ----------

export const isShield = (item: EquipmentItem) =>
    item.itemType === 'shield' || item.armorType === 'shield';

/**
 * Arma: categoria `weapon`, oppure i formati vecchi (`armorType: 'weapon'`, o un oggetto senza
 * categoria che ha solo un danno). Un oggetto magico con un potere (`armorType: 'magic'`) non è un'arma.
 */
export const isWeapon = (item: EquipmentItem) =>
    item.itemType === 'weapon' ||
    item.armorType === 'weapon' ||
    (!item.itemType && !item.armorType && !!item.damage?.trim());

/** Armatura indossata: tipo leggero/medio/pesante, o categoria `armor` senza tipo (vale come leggera). */
export const isBodyArmor = (item: EquipmentItem) =>
    !isShield(item) &&
    !isWeapon(item) &&
    (ARMOR_WEIGHTS.includes(item.armorType || '') || (item.itemType === 'armor' && item.armorType !== 'magic'));

export const armorWeight = (item: EquipmentItem): ArmorWeight =>
    ARMOR_WEIGHTS.includes(item.armorType || '') ? (item.armorType as ArmorWeight) : 'light';

/** Categorie che possono avere un potere attivabile (incantesimo, capacità, effetto con danni). */
export const MAGIC_POWER_TYPES: readonly string[] = ['wondrous', 'ring', 'amulet', 'helmet', 'potion', 'scroll'];

/**
 * Oggetto con un potere attivabile: formato vecchio `magic`, nome del potere,
 * oppure un oggetto magico con un effetto/danno compilato.
 */
export const hasActivePower = (item: EquipmentItem) =>
    !isWeapon(item) && (
        item.armorType === 'magic' ||
        !!item.grantsSpellName?.trim() ||
        (MAGIC_POWER_TYPES.includes(item.itemType || '') && !!item.damage?.trim())
    );

/** Oggetti che si indossano (oltre ad armi, armature e scudi). */
const WORN_TYPES = ['ring', 'amulet', 'helmet'];

/**
 * Categoria di un oggetto salvato prima che esistesse `itemType`.
 * Le armi (`armorType: 'weapon'`) e gli oggetti magici (`magic`) non vanno scambiati per armature.
 */
export const inferItemCategory = (item: Pick<EquipmentItem, 'itemType' | 'armorType' | 'damage'>): ItemCategory => {
    if (item.itemType) return item.itemType;
    if (item.armorType === 'shield') return 'shield';
    if (item.armorType === 'weapon' || (!item.armorType && item.damage?.trim())) return 'weapon';
    if (item.armorType === 'magic') return 'wondrous';
    if (item.armorType) return 'armor';
    return 'gear';
};

/**
 * Ripulisce un oggetto prima del salvataggio in base alla categoria scelta nel form, senza perdere valori:
 * il vecchio bonus magico delle armi (`armorClass`) passa in `attackBonus`, la sintonia si toglie se non serve,
 * un'armatura ha sempre un tipo e le munizioni si scollegano se l'arma non le usa.
 */
export const normalizeItemForSave = <T extends Omit<EquipmentItem, 'id'>>(input: T): T => {
    const item: T = { ...input, itemType: inferItemCategory(input) };
    const category = item.itemType;

    if (category === 'weapon') {
        if (item.armorType === 'weapon' && item.armorClass && !(item.attackBonus && String(item.attackBonus).trim())) {
            item.attackBonus = item.armorClass > 0 ? `+${item.armorClass}` : String(item.armorClass);
        }
        delete item.armorType;
        delete item.armorClass;
    } else {
        delete item.versatileDamage;
        delete item.ammoItemId;
        if (category === 'armor') {
            if (!ARMOR_WEIGHTS.includes(item.armorType || '')) item.armorType = 'light';
            delete item.damage;
            delete item.damageType;
        } else if (category === 'shield') {
            item.armorType = 'shield';
            delete item.damage;
            delete item.damageType;
        } else {
            // Anelli, amuleti, consumabili…: niente CA base; resta solo il formato vecchio degli oggetti magici.
            if (item.armorType !== 'magic') delete item.armorType;
            delete item.armorClass;
        }
    }

    if (item.ammoItemId && !hasProperty(item.properties, 'Ammunition')) delete item.ammoItemId;
    if (!item.requiresAttunement) delete item.isAttuned;
    if (!Number.isFinite(item.quantity) || item.quantity < 0) item.quantity = 1;
    if (item.weight !== undefined && (!Number.isFinite(item.weight) || item.weight <= 0)) delete item.weight;
    return item;
};

// ---------- Proprietà delle armi ----------

/** Vero se l'arma ha la proprietà (chiave inglese salvata, o il suo nome italiano scritto a mano). */
export const hasProperty = (properties: string[] | undefined, key: string) => {
    const italian = WEAPON_PROPERTIES[key]?.name.toLowerCase();
    return (properties || []).some(p => {
        const v = p.trim().toLowerCase();
        return v === key.toLowerCase() || (!!italian && v === italian);
    });
};

export const usesAmmunition = (item: Pick<EquipmentItem, 'properties'>) => hasProperty(item.properties, 'Ammunition');
export const isTwoHanded = (item: Pick<EquipmentItem, 'properties'>) => hasProperty(item.properties, 'Two-Handed');

// ---------- Sintonia ----------

/** Vero se l'oggetto non richiede sintonia o se il personaggio è in sintonia con esso. */
export const isAttunementSatisfied = (item: EquipmentItem) => !item.requiresAttunement || !!item.isAttuned;

/** Equipaggiato e (se serve) in sintonia: le sue proprietà magiche sono attive. */
export const isItemActive = (item: EquipmentItem) => !!item.equipped && isAttunementSatisfied(item);

/** Oggetti in sintonia (contano solo quelli che la richiedono), escluso eventualmente `excludeId`. */
export const countAttuned = (equipment: EquipmentItem[] | undefined, excludeId?: string) =>
    (equipment || []).filter(i => i.id !== excludeId && i.requiresAttunement && i.isAttuned).length;

export const canAttune = (equipment: EquipmentItem[] | undefined, itemId?: string) =>
    countAttuned(equipment, itemId) < MAX_ATTUNED_ITEMS;

export type AttunementResult =
    | { ok: true; equipment: EquipmentItem[] }
    | { ok: false; reason: 'not-found' | 'not-required' | 'limit' };

/** Sintonizza o rompe la sintonia, rispettando il limite di 3 oggetti. */
export const toggleAttunement = (equipment: EquipmentItem[], itemId: string): AttunementResult => {
    const item = equipment.find(i => i.id === itemId);
    if (!item) return { ok: false, reason: 'not-found' };
    if (!item.requiresAttunement) return { ok: false, reason: 'not-required' };
    if (!item.isAttuned && !canAttune(equipment, itemId)) return { ok: false, reason: 'limit' };
    return { ok: true, equipment: equipment.map(i => (i.id === itemId ? { ...i, isAttuned: !i.isAttuned } : i)) };
};

// ---------- Equipaggia / rimuovi ----------

/**
 * Equipaggia o rimuove un oggetto. Equipaggiare un'armatura o uno scudo
 * toglie di dosso l'altra armatura / l'altro scudo già equipaggiato.
 * Restituisce `null` se l'oggetto non esiste.
 */
export const toggleEquippedItem = (equipment: EquipmentItem[], itemId: string): EquipmentItem[] | null => {
    const clickedItem = equipment.find(item => item.id === itemId);
    if (!clickedItem) return null;

    const isEquipping = !clickedItem.equipped;
    const clickedIsBodyArmor = isBodyArmor(clickedItem);
    const clickedIsShield = isShield(clickedItem);

    return equipment.map(item => {
        if (item.id === itemId) {
            return { ...item, equipped: isEquipping };
        }
        if (isEquipping) {
            if (clickedIsBodyArmor && isBodyArmor(item)) return { ...item, equipped: false };
            if (clickedIsShield && isShield(item)) return { ...item, equipped: false };
        }
        return item;
    });
};

/** Avviso (non bloccante) dopo aver equipaggiato: arma a due mani insieme allo scudo. */
export const getEquipWarning = (equipment: EquipmentItem[], itemId: string): string | null => {
    const item = equipment.find(i => i.id === itemId);
    if (!item?.equipped) return null;
    const shield = equipment.find(i => i.equipped && isShield(i));
    const twoHanded = equipment.find(i => i.equipped && isWeapon(i) && isTwoHanded(i));
    if (!shield || !twoHanded) return null;
    if (item.id !== shield.id && item.id !== twoHanded.id) return null;
    return `${twoHanded.name} richiede due mani: con ${shield.name} imbracciato non puoi attaccare con quest'arma.`;
};

/** Divide l'equipaggiamento in "equipaggiabile" (armi, armature, oggetti indossati) e "zaino", ciascuno in ordine alfabetico. */
export const splitEquipment = (equipment: EquipmentItem[] | undefined) => {
    const equippable: EquipmentItem[] = [];
    const backpack: EquipmentItem[] = [];
    (equipment || []).forEach(item => {
        const wearable = item.equipped || isWeapon(item) || isBodyArmor(item) || isShield(item) ||
            !!item.armorType || WORN_TYPES.includes(item.itemType || '');
        (wearable ? equippable : backpack).push(item);
    });
    return {
        equippableItems: equippable.sort((a, b) => a.name.localeCompare(b.name)),
        backpackItems: backpack.sort((a, b) => a.name.localeCompare(b.name)),
    };
};

// ---------- Cariche e usi ----------

export interface ItemCharges {
    current: number;
    max: number;
    /** Campo in cui sono salvate: `charges` (form attuale) o `uses` (formato vecchio). */
    field: 'charges' | 'uses';
}

/** Cariche dell'oggetto, qualunque sia il campo in cui sono salvate. */
export const getItemCharges = (item: EquipmentItem): ItemCharges | null => {
    if (item.charges && item.charges.max > 0) return { current: item.charges.current, max: item.charges.max, field: 'charges' };
    if (item.uses && item.uses.max > 0) return { current: item.uses.current, max: item.uses.max, field: 'uses' };
    return null;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Spende (delta < 0), recupera (delta > 0) o ricarica del tutto (`'reset'`) le cariche di un oggetto. */
export const adjustItemCharges = (equipment: EquipmentItem[], itemId: string, delta: number | 'reset'): EquipmentItem[] =>
    equipment.map(item => {
        if (item.id !== itemId) return item;
        const charges = getItemCharges(item);
        if (!charges) return item;
        const current = delta === 'reset' ? charges.max : clamp(charges.current + delta, 0, charges.max);
        if (charges.field === 'charges') return { ...item, charges: { ...item.charges!, current } };
        return { ...item, uses: { ...item.uses!, current } };
    });

/** Elimina un oggetto e scollega le armi che lo usavano come munizione. */
export const removeItem = (equipment: EquipmentItem[], itemId: string): EquipmentItem[] =>
    equipment
        .filter(item => item.id !== itemId)
        .map(item => (item.ammoItemId === itemId ? { ...item, ammoItemId: undefined } : item));

// ---------- Quantità e munizioni ----------

/** Cambia la quantità di un oggetto, senza scendere sotto 0. */
export const adjustQuantity = (equipment: EquipmentItem[], itemId: string, delta: number): EquipmentItem[] =>
    equipment.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, (Number.isFinite(item.quantity) ? item.quantity : 1) + delta) } : item,
    );

/** Oggetti che possono fare da munizione: tutto ciò che non è arma, armatura o scudo. */
export const ammunitionCandidates = (equipment: EquipmentItem[] | undefined, weaponId?: string) =>
    (equipment || []).filter(i => i.id !== weaponId && !isWeapon(i) && !isBodyArmor(i) && !isShield(i));

export interface AmmoConsumption {
    equipment: EquipmentItem[];
    /** Munizioni rimaste dopo il tiro. */
    remaining: number;
    /** Vero se non c'era nessuna munizione da consumare. */
    empty: boolean;
}

/** Consuma una munizione dell'oggetto collegato; `null` se l'oggetto non esiste più. */
export const consumeAmmunition = (equipment: EquipmentItem[], ammoItemId: string): AmmoConsumption | null => {
    const ammo = equipment.find(i => i.id === ammoItemId);
    if (!ammo) return null;
    const quantity = Number.isFinite(ammo.quantity) ? ammo.quantity : 0;
    if (quantity <= 0) return { equipment, remaining: 0, empty: true };
    return { equipment: adjustQuantity(equipment, ammoItemId, -1), remaining: quantity - 1, empty: false };
};
