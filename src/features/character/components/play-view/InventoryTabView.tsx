import { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { EquipmentItem, Currency } from '../../characterTypes';
import { ChevronDownIcon } from '../../../../components/ui/icons';
import { ImageModal } from '../../../../components/ui/ImageModal';

const InventoryTabView = () => {
  const { character, updateCharacter } = useCharacter();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  if (!character) return null;

  const handleToggleEquip = (itemId: string) => {
    const clickedItem = character.equipment.find(item => item.id === itemId);
    if (!clickedItem) return;

    const isEquipping = !clickedItem.equipped;
    const isClickedBodyArmor = clickedItem.itemType === 'armor' || ['light', 'medium', 'heavy'].includes(clickedItem.armorType || '');
    const isClickedShield = clickedItem.itemType === 'shield' || clickedItem.armorType === 'shield';

    const newEquipment = character.equipment.map(item => {
      if (item.id === itemId) {
        return { ...item, equipped: isEquipping };
      }
      if (isEquipping) {
        const isItemBodyArmor = item.itemType === 'armor' || ['light', 'medium', 'heavy'].includes(item.armorType || '');
        const isItemShield = item.itemType === 'shield' || item.armorType === 'shield';

        if (isClickedBodyArmor && isItemBodyArmor) return { ...item, equipped: false };
        if (isClickedShield && isItemShield) return { ...item, equipped: false };
      }
      return item;
    });
    updateCharacter({ equipment: newEquipment });
  };

  const handleCurrencyChange = (type: keyof Currency, val: number) => {
    updateCharacter({
      currency: {
        ...character.currency,
        [type]: Math.max(0, val),
      },
    });
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItem(prev => (prev === itemId ? null : itemId));
  };

  const totalGp = useMemo(() => {
    const c = character.currency || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    const total = (c.pp || 0) * 10 + (c.gp || 0) + (c.ep || 0) * 0.5 + (c.sp || 0) * 0.1 + (c.cp || 0) * 0.01;
    return total.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [character.currency]);

  const { equippableItems, backpackItems } = useMemo(() => {
    const equippable: EquipmentItem[] = [];
    const backpack: EquipmentItem[] = [];
    (character.equipment || []).forEach(item => {
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
  }, [character.equipment]);

  const ItemList = ({ title, items }: { title: string; items: EquipmentItem[] }) => (
    <div className="bg-card/20 backdrop-blur-md p-6 rounded-2xl border border-border/40 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h3 className="text-xl font-cinzel text-accent flex items-center gap-2">
          {title}
        </h3>
        <span className="text-xs font-mono font-bold bg-accent/10 text-accent px-2.5 py-1 rounded-lg border border-accent/20">
          {items.length} oggetti
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8 border border-dashed border-border/30 rounded-xl">
          Nessun oggetto in questa sezione.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-card/50 backdrop-blur-sm rounded-xl text-sm border border-border/40 overflow-hidden transition-all hover:border-accent/40 shadow-sm flex flex-col justify-between">
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => handleToggleExpand(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1">
                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    className="w-12 h-12 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden relative group cursor-pointer shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.imageUrl) {
                        setSelectedImage({ url: item.imageUrl, alt: item.name });
                      }
                    }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-accent/5 flex items-center justify-center text-accent/30 font-bold text-sm">
                        {item.armorType ? '🛡️' : (item.damage ? '⚔️' : '🎒')}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <p className="font-bold text-foreground truncate text-base" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <span className="bg-background/50 px-1.5 py-0.5 rounded border border-border/30 font-mono">Qtà: {item.quantity}</span>
                      {item.damage && <span className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">Dmg: {item.damage}</span>}
                      {item.armorClass && <span className="text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">CA: {item.armorClass}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleEquip(item.id); }}
                  className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex-shrink-0 ${
                    item.equipped
                      ? 'bg-accent text-accent-foreground shadow-accent/20 font-black'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50'
                  }`}
                >
                  {item.equipped ? 'Equipped' : 'Equip'}
                </button>
              </div>

              {expandedItem === item.id && (
                <div className="px-4 pb-4 pt-2 border-t border-border/30 bg-muted/10 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.armorType && (
                      <div className="bg-background/60 px-2.5 py-1 rounded-md border border-border/40">
                        <span className="text-muted-foreground capitalize mr-1">Armatura:</span>
                        <span className="font-semibold text-foreground">{item.armorType}</span>
                      </div>
                    )}
                    {item.damageType && (
                      <div className="bg-background/60 px-2.5 py-1 rounded-md border border-border/40">
                        <span className="text-muted-foreground capitalize mr-1">Tipo Danno:</span>
                        <span className="font-semibold text-foreground">{item.damageType}</span>
                      </div>
                    )}
                  </div>
                  {item.description ? (
                    <p className="text-foreground/90 whitespace-pre-wrap text-[13px] leading-relaxed bg-background/40 p-3 rounded-lg border border-border/30">{item.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic text-xs pl-1">Nessuna descrizione disponibile.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <ImageModal
        imageUrl={selectedImage?.url || ''}
        altText={selectedImage?.alt || ''}
        onClose={() => setSelectedImage(null)}
      />

      {/* Top Currency Banner */}
      <div className="bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <h3 className="text-xl font-cinzel text-accent flex items-center gap-2">
            <span>🪙</span> Monete & Portamonete
          </h3>
          <div className="bg-accent/10 text-accent px-3.5 py-1 rounded-xl border border-accent/20 text-xs font-bold font-mono">
            Valore Totale Stimato: <span className="text-white text-sm font-black">{totalGp} GP</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { key: 'pp', label: 'PP (Platino)', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
            { key: 'gp', label: 'GP (Oro)', color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400' },
            { key: 'ep', label: 'EP (Elettro)', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' },
            { key: 'sp', label: 'SP (Argento)', color: 'border-slate-400/30 bg-slate-400/5 text-slate-200' },
            { key: 'cp', label: 'CP (Rame)', color: 'border-orange-600/30 bg-orange-600/5 text-orange-400' },
          ].map((coin) => {
            const val = character.currency[coin.key as keyof Currency] || 0;
            return (
              <div key={coin.key} className={`p-3 rounded-xl border ${coin.color} flex flex-col items-center justify-between gap-2 shadow-sm`}>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{coin.label}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange(coin.key as keyof Currency, val - 1)}
                    className="w-7 h-7 rounded-lg bg-background/50 hover:bg-background border border-border/50 text-foreground font-bold flex items-center justify-center transition-colors text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handleCurrencyChange(coin.key as keyof Currency, parseInt(e.target.value) || 0)}
                    className="w-14 bg-background/60 text-center font-mono font-bold text-base rounded border border-border/40 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange(coin.key as keyof Currency, val + 1)}
                    className="w-7 h-7 rounded-lg bg-background/50 hover:bg-background border border-border/50 text-foreground font-bold flex items-center justify-center transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Full-Width Inventory Lists */}
      <div className="space-y-6">
        <ItemList title="🛡️ Armi, Armature & Oggetti Equipaggiati" items={equippableItems} />
        <ItemList title="🎒 Zaino & Oggetti da Avventura" items={backpackItems} />
      </div>
    </div>
  );
};

export default InventoryTabView;