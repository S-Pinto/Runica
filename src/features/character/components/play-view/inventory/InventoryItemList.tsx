import { EquipmentItem } from '../../../characterTypes';
import { ChevronDownIcon } from '../../../../../components/ui/icons';

const getItemIcon = (item: EquipmentItem) => {
  if (item.itemType === 'weapon' || item.damage) return '⚔️';
  if (item.itemType === 'armor' || item.armorType) return '🛡️';
  if (item.itemType === 'shield') return '🛡️';
  if (item.itemType === 'ring') return '💍';
  if (item.itemType === 'amulet') return '📿';
  if (item.itemType === 'helmet') return '🪖';
  if (item.itemType === 'wondrous') return '✨';
  if (item.itemType === 'potion') return '🧪';
  if (item.itemType === 'scroll') return '📜';
  return '🎒';
};

interface InventoryItemListProps {
  title: string;
  items: EquipmentItem[];
  expandedItem: string | null;
  onToggleExpand: (itemId: string) => void;
  onToggleEquip: (itemId: string) => void;
  onToggleAttune: (itemId: string) => void;
  onUseCharge: (itemId: string) => void;
  onResetCharge: (itemId: string) => void;
  onSelectImage: (image: { url: string; alt: string }) => void;
}

export const InventoryItemList = ({
  title, items, expandedItem, onToggleExpand, onToggleEquip, onToggleAttune, onUseCharge, onResetCharge, onSelectImage,
}: InventoryItemListProps) => (
  <div className="bg-card p-6 rounded-2xl border border-border/40 space-y-4">
    <div className="flex items-center justify-between border-b border-border/40 pb-3">
      <h3 className="text-xl font-cinzel font-bold text-foreground flex items-center gap-2">
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
                <button onClick={() => onToggleExpand(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1">
                  <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                </button>

                <div
                  className="w-12 h-12 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden relative group cursor-pointer shadow-sm text-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.imageUrl) {
                      onSelectImage({ url: item.imageUrl, alt: item.name });
                    }
                  }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <span>{getItemIcon(item)}</span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground truncate text-base" title={item.name}>
                      {item.name}
                    </p>
                    {item.isAttuned && (
                      <span className="text-[10px] bg-accent/20 text-accent font-bold px-1.5 py-0.5 rounded border border-accent/30">
                        🔮 Sintonizzato
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                    <span className="bg-background/50 px-1.5 py-0.5 rounded border border-border/30 font-mono">Qtà: {item.quantity}</span>
                    {item.damage && <span className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">Danni: {item.damage}</span>}
                    {item.armorClass && <span className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">CA: {item.armorClass}</span>}
                    {item.bonusAC && <span className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">+ {item.bonusAC} CA</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.requiresAttunement && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleAttune(item.id); }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                      item.isAttuned
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-background/40 text-muted-foreground border-border/40 hover:text-accent'
                    }`}
                    title="Sintonizzazione Magica (Max 3)"
                  >
                    🔮
                  </button>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); onToggleEquip(item.id); }}
                  className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex-shrink-0 ${
                    item.equipped
                      ? 'bg-accent text-accent-foreground shadow-accent/20 font-black'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50'
                  }`}
                >
                  {item.equipped ? 'Equipaggiato' : 'Equipaggia'}
                </button>
              </div>
            </div>

            {/* Charge Tracker Bar for Active Magic Items */}
            {item.charges && item.charges.max > 0 && (
              <div className="px-3.5 py-2 bg-accent/10 border-t border-accent/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent flex items-center gap-1">
                    ⚡ Cariche:
                  </span>
                  <span className="text-sm font-black font-mono text-foreground">
                    {item.charges.current} / {item.charges.max}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-accent/70">
                    ({item.charges.resetType === 'longRest' ? 'Riposo Lungo' : item.charges.resetType})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onUseCharge(item.id); }}
                    disabled={item.charges.current <= 0}
                    className="px-2.5 py-1 bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-accent-foreground font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1"
                  >
                    ⚡ Usa
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onResetCharge(item.id); }}
                    className="p-1 bg-background/50 hover:bg-background border border-accent/30 text-accent rounded-lg transition-colors text-xs"
                    title="Ricarica Manuale"
                  >
                    🔄
                  </button>
                </div>
              </div>
            )}

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
