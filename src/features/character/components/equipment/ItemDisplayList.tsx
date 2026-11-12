import { EquipmentItem } from '../../characterTypes';
import { TrashIcon, EditIcon, ChevronDownIcon } from '../../../../components/ui/icons';

export const ItemDisplayList = ({
  title,
  items,
  expandedItem,
  onToggleExpand,
  onToggleEquip,
  onEdit,
  onDelete,
}: {
  title: string;
  items: EquipmentItem[];
  expandedItem: string | null;
  onToggleExpand: (id: string) => void;
  onToggleEquip: (id: string) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (id: string) => void;
}) => (
  <div>
    <h4 className="text-base font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center justify-between">
      {title}
      <span className="text-xs bg-muted/40 px-2 py-0.5 rounded text-muted-foreground">{items.length}</span>
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.length === 0 && <p className="text-center text-muted-foreground text-xs py-4 border border-dashed border-border/30 rounded-lg">Nessun oggetto in {title.toLowerCase()}.</p>}
      {items.map(item => (
        <div key={item.id} className="bg-card/40 backdrop-blur-sm rounded-lg text-sm border border-border/30 hover:border-accent/30 transition-all">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => onToggleExpand(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`} />
              </button>

              {/* Item Thumbnail */}
              <div className="w-10 h-10 rounded bg-muted/30 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent/5 flex items-center justify-center text-accent/20">
                    <span className="text-[9px] font-bold uppercase">{item.name.substring(0, 2)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <p className="font-semibold text-accent truncate" title={item.name}>
                  {item.name}
                  {item.equipped && <span className="ml-2 text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Equipaggiato</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  Q.tà: {item.quantity} {item.damage && `• Dmg: ${item.damage}`} {item.armorClass ? `• AC: ${item.armorClass}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onToggleEquip(item.id)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-sm ${
                  item.equipped
                    ? 'bg-primary text-primary-foreground shadow-primary/20'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50'
                }`}
              >
                {item.equipped ? 'Equipaggiato' : 'Equipaggia'}
              </button>
              <button onClick={() => onEdit(item)} className="text-muted-foreground hover:text-accent p-1.5 hover:bg-accent/10 rounded transition-colors"><EditIcon className="w-4 h-4" /></button>
              <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive p-1.5 hover:bg-destructive/10 rounded transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
          </div>
          {expandedItem === item.id && (
            <div className="p-3 border-t border-border/30 bg-muted/10 space-y-2">
              <div className="flex flex-wrap gap-2 text-xs">
                {item.armorType && (
                  <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                    <span className="text-muted-foreground capitalize mr-1">Armatura:</span>
                    <span className="font-medium">{item.armorType}</span>
                  </div>
                )}
                {item.armorClass && (
                  <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                    <span className="text-muted-foreground capitalize mr-1">CA:</span>
                    <span className="font-medium">{item.armorClass}</span>
                  </div>
                )}
                {item.damage && (
                  <div className="bg-background/50 px-2 py-1 rounded border border-border/50">
                    <span className="text-muted-foreground capitalize mr-1">Danni:</span>
                    <span className="font-medium">{item.damage} {item.damageType}</span>
                  </div>
                )}
              </div>
              {item.description && <p className="text-foreground/80 whitespace-pre-wrap text-[13px] leading-relaxed pl-1">{item.description}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
