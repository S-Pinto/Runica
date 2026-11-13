import { describe, it, expect } from 'vitest';
import type { EquipmentItem } from '../characterTypes';
import {
    adjustItemCharges, adjustQuantity, ammunitionCandidates, canAttune, consumeAmmunition, countAttuned, getEquipWarning,
    getItemCharges, hasActivePower, hasProperty, inferItemCategory, isBodyArmor, isShield, isWeapon, normalizeItemForSave,
    removeItem, splitEquipment, toggleAttunement, toggleEquippedItem,
} from './equipment';

const item = (o: Partial<EquipmentItem>): EquipmentItem => ({ id: 'i', name: 'Oggetto', quantity: 1, description: '', ...o });

describe('classificazione', () => {
    it('armi: categoria, formato vecchio, oggetto senza categoria con danno', () => {
        expect(isWeapon(item({ itemType: 'weapon' }))).toBe(true);
        expect(isWeapon(item({ armorType: 'weapon' }))).toBe(true);
        expect(isWeapon(item({ damage: '1d6' }))).toBe(true);
        expect(isWeapon(item({ armorType: 'magic', damage: '8d6' }))).toBe(false);
        expect(isWeapon(item({ itemType: 'ring', damage: '1d6' }))).toBe(false);
    });
    it('armature e scudi', () => {
        expect(isBodyArmor(item({ armorType: 'medium' }))).toBe(true);
        expect(isBodyArmor(item({ itemType: 'armor' }))).toBe(true);
        expect(isBodyArmor(item({ itemType: 'armor', armorType: 'magic' }))).toBe(false);
        expect(isBodyArmor(item({ armorType: 'shield' }))).toBe(false);
        expect(isShield(item({ itemType: 'shield' }))).toBe(true);
        expect(isShield(item({ armorType: 'shield' }))).toBe(true);
    });
    it('poteri attivabili', () => {
        expect(hasActivePower(item({ armorType: 'magic' }))).toBe(true);
        expect(hasActivePower(item({ itemType: 'ring', grantsSpellName: 'Scudo' }))).toBe(true);
        expect(hasActivePower(item({ itemType: 'wondrous', damage: '3d6' }))).toBe(true);
        expect(hasActivePower(item({ itemType: 'gear', damage: '3d6' }))).toBe(false);
        expect(hasActivePower(item({ itemType: 'weapon', grantsSpellName: 'X' }))).toBe(false);
    });
    it('proprietà: chiave inglese o nome italiano, senza distinzione di maiuscole', () => {
        expect(hasProperty(['Finesse'], 'Finesse')).toBe(true);
        expect(hasProperty(['accurata'], 'Finesse')).toBe(true);
        expect(hasProperty(undefined, 'Finesse')).toBe(false);
    });
    it('inferItemCategory non scambia armi e oggetti magici vecchi per armature', () => {
        expect(inferItemCategory({ armorType: 'weapon' })).toBe('weapon');
        expect(inferItemCategory({ damage: '1d8' })).toBe('weapon');
        expect(inferItemCategory({ armorType: 'magic' })).toBe('wondrous');
        expect(inferItemCategory({ armorType: 'shield' })).toBe('shield');
        expect(inferItemCategory({ armorType: 'heavy' })).toBe('armor');
        expect(inferItemCategory({})).toBe('gear');
        expect(inferItemCategory({ itemType: 'potion', armorType: 'light' })).toBe('potion');
    });
});

describe('normalizeItemForSave', () => {
    it("arma vecchia: il bonus in armorClass passa in attackBonus, danno conservato", () => {
        const saved = normalizeItemForSave(item({ armorType: 'weapon', armorClass: 1, damage: '1d8', attackAbility: 'dexterity' }));
        expect(saved).toMatchObject({ itemType: 'weapon', attackBonus: '+1', damage: '1d8', attackAbility: 'dexterity' });
        expect(saved.armorType).toBeUndefined();
        expect(saved.armorClass).toBeUndefined();
    });
    it("un bonus già presente in attackBonus non viene sovrascritto", () => {
        expect(normalizeItemForSave(item({ armorType: 'weapon', armorClass: 1, attackBonus: '+2' })).attackBonus).toBe('+2');
    });
    it('oggetto magico vecchio: resta `magic` con il suo potere', () => {
        const saved = normalizeItemForSave(item({ armorType: 'magic', grantsSpellName: 'Palla di fuoco', damage: '8d6' }));
        expect(saved).toMatchObject({ itemType: 'wondrous', armorType: 'magic', damage: '8d6' });
    });
    it('armatura senza tipo diventa leggera; scudo ha sempre armorType shield; niente danni', () => {
        expect(normalizeItemForSave(item({ itemType: 'armor', damage: '1d4' }))).toMatchObject({ armorType: 'light' });
        expect(normalizeItemForSave(item({ itemType: 'armor', damage: '1d4' })).damage).toBeUndefined();
        expect(normalizeItemForSave(item({ itemType: 'shield' })).armorType).toBe('shield');
    });
    it('passando da armatura ad anello si tolgono tipo e CA base, resta il bonus magico', () => {
        const saved = normalizeItemForSave(item({ itemType: 'ring', armorType: 'light', armorClass: 12, bonusAC: 1 }));
        expect(saved.armorType).toBeUndefined();
        expect(saved.armorClass).toBeUndefined();
        expect(saved.bonusAC).toBe(1);
    });
    it('sintonia, munizioni, quantità e peso ripuliti', () => {
        const saved = normalizeItemForSave(item({ itemType: 'weapon', isAttuned: true, ammoItemId: 'x', properties: ['Finesse'], quantity: -3, weight: 0 }));
        expect(saved.isAttuned).toBeUndefined();
        expect(saved.ammoItemId).toBeUndefined();
        expect(saved.quantity).toBe(1);
        expect(saved.weight).toBeUndefined();
        const bow = normalizeItemForSave(item({ itemType: 'weapon', ammoItemId: 'x', properties: ['Ammunition'], weight: 1 }));
        expect(bow).toMatchObject({ ammoItemId: 'x', weight: 1 });
        expect(normalizeItemForSave(item({ itemType: 'gear', versatileDamage: '1d10' })).versatileDamage).toBeUndefined();
    });
});

describe('equipaggia', () => {
    const eq = [
        item({ id: 'a1', armorType: 'light', equipped: true }),
        item({ id: 'a2', itemType: 'armor', armorType: 'heavy' }),
        item({ id: 's1', armorType: 'shield', equipped: true }),
        item({ id: 's2', itemType: 'shield' }),
        item({ id: 'w', itemType: 'weapon', equipped: true }),
    ];
    it("un'armatura toglie l'altra, uno scudo toglie l'altro; le armi restano", () => {
        const next = toggleEquippedItem(eq, 'a2')!;
        expect(next.filter(i => i.equipped).map(i => i.id)).toEqual(['a2', 's1', 'w']);
        const next2 = toggleEquippedItem(next, 's2')!;
        expect(next2.filter(i => i.equipped).map(i => i.id)).toEqual(['a2', 's2', 'w']);
    });
    it('rimuovere non tocca gli altri; id inesistente → null', () => {
        expect(toggleEquippedItem(eq, 'w')!.filter(i => i.equipped).map(i => i.id)).toEqual(['a1', 's1']);
        expect(toggleEquippedItem(eq, 'zzz')).toBeNull();
    });
    it('avviso: arma a due mani insieme allo scudo', () => {
        const list = [item({ id: 'g', name: 'Spadone', itemType: 'weapon', properties: ['Two-Handed'] }), item({ id: 's', name: 'Scudo', itemType: 'shield', equipped: true })];
        const equipped = toggleEquippedItem(list, 'g')!;
        expect(getEquipWarning(equipped, 'g')).toContain('Spadone');
        expect(getEquipWarning(list, 's')).toBeNull();
        expect(getEquipWarning(toggleEquippedItem(equipped, 'g')!, 'g')).toBeNull();
    });
    it('split: armi, armature, scudi e oggetti indossati in alto; il resto nello zaino', () => {
        const { equippableItems, backpackItems } = splitEquipment([
            item({ id: 'b', name: 'Corda' }),
            item({ id: 'r', name: 'Anello', itemType: 'ring' }),
            item({ id: 'w', name: 'Arco', damage: '1d8' }),
            item({ id: 'p', name: 'Pozione', itemType: 'potion', equipped: true }),
        ]);
        expect(equippableItems.map(i => i.id)).toEqual(['r', 'w', 'p']);
        expect(backpackItems.map(i => i.id)).toEqual(['b']);
    });
});

describe('sintonia', () => {
    const magic = (id: string, isAttuned = false) => item({ id, requiresAttunement: true, isAttuned });
    it('conta solo gli oggetti che richiedono sintonia', () => {
        expect(countAttuned([magic('a', true), item({ id: 'b', isAttuned: true }), magic('c')])).toBe(1);
    });
    it('limite di 3: il quarto è rifiutato, rompere una sintonia è sempre possibile', () => {
        const eq = [magic('a', true), magic('b', true), magic('c', true), magic('d')];
        expect(canAttune(eq, 'd')).toBe(false);
        expect(canAttune(eq, 'a')).toBe(true);
        expect(toggleAttunement(eq, 'd')).toEqual({ ok: false, reason: 'limit' });
        const res = toggleAttunement(eq, 'a');
        expect(res.ok && res.equipment.find(i => i.id === 'a')?.isAttuned).toBe(false);
    });
    it('oggetto che non la richiede o inesistente', () => {
        expect(toggleAttunement([item({ id: 'x' })], 'x')).toEqual({ ok: false, reason: 'not-required' });
        expect(toggleAttunement([], 'x')).toEqual({ ok: false, reason: 'not-found' });
    });
});

describe('cariche, quantità, munizioni', () => {
    it('cariche nel campo nuovo o in `uses` (vecchio), entro 0..max, ricarica completa', () => {
        const eq = [
            item({ id: 'c', charges: { current: 2, max: 3, resetType: 'longRest' } }),
            item({ id: 'u', uses: { current: 0, max: 2 } }),
        ];
        expect(getItemCharges(eq[1])).toEqual({ current: 0, max: 2, field: 'uses' });
        expect(getItemCharges(item({ charges: { current: 0, max: 0, resetType: 'none' } }))).toBeNull();
        expect(adjustItemCharges(eq, 'c', -5)[0].charges?.current).toBe(0);
        expect(adjustItemCharges(eq, 'c', 5)[0].charges?.current).toBe(3);
        expect(adjustItemCharges(eq, 'u', 'reset')[1].uses?.current).toBe(2);
        expect(adjustItemCharges(eq, 'zzz', -1)).toEqual(eq);
    });
    it('quantità mai sotto 0', () => {
        const eq = [item({ id: 'p', quantity: 1 })];
        expect(adjustQuantity(eq, 'p', -3)[0].quantity).toBe(0);
        expect(adjustQuantity(eq, 'p', 2)[0].quantity).toBe(3);
    });
    it('consumo munizioni: scala di uno, segnala esaurite, null se l\'oggetto non esiste', () => {
        const eq = [item({ id: 'arrows', quantity: 1 })];
        const first = consumeAmmunition(eq, 'arrows')!;
        expect(first).toMatchObject({ remaining: 0, empty: false });
        expect(first.equipment[0].quantity).toBe(0);
        const second = consumeAmmunition(first.equipment, 'arrows')!;
        expect(second).toMatchObject({ remaining: 0, empty: true });
        expect(second.equipment).toBe(first.equipment);
        expect(consumeAmmunition(eq, 'nope')).toBeNull();
    });
    it('candidati come munizione: niente armi, armature e scudi, né l\'arma stessa', () => {
        const eq = [item({ id: 'bow', itemType: 'weapon' }), item({ id: 'arrows' }), item({ id: 'shield', itemType: 'shield' })];
        expect(ammunitionCandidates(eq, 'bow').map(i => i.id)).toEqual(['arrows']);
    });
    it("eliminare un oggetto scollega le armi che lo usavano come munizione", () => {
        const eq = [item({ id: 'bow', itemType: 'weapon', ammoItemId: 'arrows' }), item({ id: 'arrows' })];
        const next = removeItem(eq, 'arrows');
        expect(next.map(i => i.id)).toEqual(['bow']);
        expect(next[0].ammoItemId).toBeUndefined();
    });
});
