import { EquipmentItem } from '../characterTypes';

const isBodyArmor = (item: EquipmentItem) =>
    item.itemType === 'armor' || ['light', 'medium', 'heavy'].includes(item.armorType || '');
const isShield = (item: EquipmentItem) =>
    item.itemType === 'shield' || item.armorType === 'shield';

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

/** Divide l'equipaggiamento in "equipaggiabile" (armi, armature, oggetti indossati) e "zaino", ciascuno in ordine alfabetico. */
export const splitEquipment = (equipment: EquipmentItem[] | undefined) => {
    const equippable: EquipmentItem[] = [];
    const backpack: EquipmentItem[] = [];
    (equipment || []).forEach(item => {
        if (item.equipped || item.itemType === 'weapon' || item.itemType === 'armor' || item.itemType === 'shield' || item.armorType || item.damage) {
            equippable.push(item);
        } else {
            backpack.push(item);
        }
    });
    return {
        equippableItems: equippable.sort((a, b) => a.name.localeCompare(b.name)),
        backpackItems: backpack.sort((a, b) => a.name.localeCompare(b.name)),
    };
};
