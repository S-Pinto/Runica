import React, { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { EquipmentItem, Currency } from '../../characterTypes';
import { ChevronDownIcon } from '../../../../components/ui/icons';

const InventoryTabView = () => {
  const { character, updateCharacter } = useCharacter();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleToggleEquip = (itemId: string) => {
    const clickedItem = character.equipment.find(item => item.id === itemId);
    if (!clickedItem) return;

    const isEquipping = !clickedItem.equipped;

    const newEquipment = character.equipment.map(item => {
      if (item.id === itemId) {
        return { ...item, equipped: isEquipping };
      }
      if (isEquipping) {
        const isClickedItemArmor = clickedItem.armorType && clickedItem.armorType !== 'shield';
        const isCurrentItemArmor = item.equipped && item.armorType && item.armorType !== 'shield';
        if (isClickedItemArmor && isCurrentItemArmor) {
          return { ...item, equipped: false };
        }
        if (clickedItem.armorType === 'shield' && item.equipped && item.armorType === 'shield') {
          return { ...item, equipped: false };
        }
      }
      return item;
    });
    updateCharacter({ equipment: newEquipment });
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItem(prev => (prev === itemId ? null : itemId));
  };

  const { equippableItems, backpackItems } = useMemo(() => {
    const equippable: EquipmentItem[] = [];
    const backpack: EquipmentItem[] = [];
    (character.equipment || []).forEach(item => {
      if (item.armorType) {
        equippable.push(item);
      } else {
        backpack.push(item);
      }
    });
    return { 
      equippableItems: equippable.sort((a, b) => a.name.localeCompare(b.name)),
      backpackItems: backpack.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [character.equipment]);

  const ItemList = ({ title, items }: { title: string; items: EquipmentItem[] }) => (
    <div className="bg-card p-4 rounded-lg border border-border">
      <h3 className="text-lg font-cinzel text-accent mb-3">{title}</h3>
      {items.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">None.</p> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-card/50 rounded-lg text-sm">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => handleToggleExpand(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="font-semibold text-accent truncate" title={item.name}>{item.name} <span className="text-xs text-muted-foreground">(x{item.quantity})</span></p>
                </div>
                {item.armorType && (
                  <button onClick={() => handleToggleEquip(item.id)} className={`px-3 py-1 text-xs font-bold rounded ${item.equipped ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
                    {item.equipped ? 'Equipped' : 'Equip'}
                  </button>
                )}
              </div>
              {expandedItem === item.id && (
                <div className="p-3 border-t border-border/50 bg-muted/30 space-y-2">
                  {item.armorType && (
                    <p><strong className="text-muted-foreground capitalize">{item.armorType} Armor</strong>
                      {item.armorClass ? <span className="text-foreground"> (AC: {item.armorClass})</span> : ''}
                    </p>
                  )}
                  <p className="text-foreground whitespace-pre-wrap">{item.description || 'No description.'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <h3 className="text-lg font-cinzel text-accent mb-3">Currency</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(Object.keys(character.currency) as Array<keyof Currency>).map(c => (
              <div key={c}>
                <p className="text-xl font-mono text-foreground">{character.currency[c]}</p>
                <p className="text-xs uppercase text-muted-foreground">{c}</p>
              </div>
            ))}
          </div>
        </div>
        <ItemList title="Equippable Gear" items={equippableItems} />
      </div>
      <div className="lg:col-span-2"><ItemList title="Backpack" items={backpackItems} /></div>
    </div>
  );
};

export default InventoryTabView;