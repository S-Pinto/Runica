// Etichette italiane per oggetti e armi (i dati salvati restano con le chiavi inglesi).
import type { ChargeResetType, DefenseKind, EquipmentItem, ItemCategory, ItemPower, ItemRarity } from '../characterTypes';
import { WEAPON_PROPERTIES } from '../../../data/weaponProperties';
import { armorWeight, isBodyArmor, isShield, isWeapon } from '../rules/equipment';

export const ARMOR_WEIGHT_LABELS = { light: 'Leggera', medium: 'Media', heavy: 'Pesante' } as const;

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
    weapon: 'Arma',
    armor: 'Armatura',
    shield: 'Scudo',
    wondrous: 'Oggetto prodigioso',
    ring: 'Anello',
    amulet: 'Amuleto',
    helmet: 'Elmo',
    potion: 'Pozione',
    scroll: 'Pergamena',
    gear: 'Oggetto',
};

/** "Arma", "Armatura media", "Scudo", "Anello"… anche per gli oggetti salvati in formati vecchi. */
export const itemKindLabel = (item: EquipmentItem) => {
    if (isWeapon(item)) return ITEM_CATEGORY_LABELS.weapon;
    if (isShield(item)) return ITEM_CATEGORY_LABELS.shield;
    if (isBodyArmor(item)) return `Armatura ${ARMOR_WEIGHT_LABELS[armorWeight(item)].toLowerCase()}`;
    return item.itemType ? ITEM_CATEGORY_LABELS[item.itemType] : ITEM_CATEGORY_LABELS.gear;
};

export const weaponPropertyLabel = (key: string) => WEAPON_PROPERTIES[key]?.name ?? key;

/** CA da mostrare sull'oggetto: base dell'armatura o bonus dello scudo (le armi vecchie riusano `armorClass` come bonus magico). */
export const itemArmorValue = (item: EquipmentItem): string | null => {
    if (isShield(item)) return `+${item.armorClass && item.armorClass > 0 ? item.armorClass : 2}`;
    if (isBodyArmor(item) && item.armorClass && item.armorClass > 0) return String(item.armorClass);
    return null;
};

export const RARITY_LABELS: Record<ItemRarity, string> = {
    common: 'Comune',
    uncommon: 'Non comune',
    rare: 'Rara',
    veryRare: 'Molto rara',
    legendary: 'Leggendaria',
    artifact: 'Artefatto',
};

export const RARITY_ORDER: ItemRarity[] = ['common', 'uncommon', 'rare', 'veryRare', 'legendary', 'artifact'];

export const DEFENSE_KIND_LABELS: Record<DefenseKind, string> = {
    resistance: 'Resistenza',
    immunity: 'Immunità',
    vulnerability: 'Vulnerabilità',
};

export const POWER_ACTIVATION_LABELS: Record<NonNullable<ItemPower['activation']>, string> = {
    action: 'Azione',
    bonus: 'Azione bonus',
    reaction: 'Reazione',
    free: 'Gratuita',
};

export const CHARGE_RESET_LABELS: Record<ChargeResetType, string> = {
    longRest: 'Riposo lungo',
    shortRest: 'Riposo breve',
    dawn: 'All’alba',
    none: 'Mai',
};

/** Suggerimenti per il sottotipo, per categoria. */
export const SUBTYPE_SUGGESTIONS: Partial<Record<ItemCategory, string[]>> = {
    weapon: ['Spada lunga', 'Spadone', 'Ascia bipenne', 'Arco lungo', 'Pugnale', 'Martello da guerra', 'Lancia', 'Balestra'],
    armor: ['Imbottita', 'Cuoio', 'Cuoio borchiato', 'Giaco di maglia', 'Corazza a scaglie', 'Mezza armatura', 'Cotta di maglia', 'Piastre'],
    shield: ['Scudo'],
    helmet: ['Elmo', 'Corona', 'Cappello', 'Cerchietto'],
    wondrous: ['Mantello', 'Stivali', 'Guanti', 'Cintura', 'Bacchetta', 'Bastone', 'Verga', 'Borsa'],
    ring: ['Anello'],
    amulet: ['Amuleto', 'Medaglione', 'Collana'],
};
