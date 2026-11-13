// Etichette italiane per oggetti e armi (i dati salvati restano con le chiavi inglesi).
import type { EquipmentItem, ItemCategory } from '../characterTypes';
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
