import React, { forwardRef } from 'react';
import { ICharacter } from '../characterTypes';
import { TrashIcon, EditIcon, PhotoIcon, PlayIcon, CopyIcon, ArrowDownTrayIcon, UserGroupIcon } from '../../../components/ui/icons';
import { calculateArmorClass } from '../characterService';

interface CharacterCardProps {
  character: ICharacter;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
  onExport?: (e: React.MouseEvent) => void;
  activeCardId?: string | null;
  style?: React.CSSProperties;
  [key: string]: any;
}

export const CharacterCard = forwardRef<HTMLDivElement, CharacterCardProps>(
  ({ character, onSelect, onDelete, onEdit, onDuplicate, onExport, activeCardId, style, ...rest }, ref) => {
    const isActive = character.id === activeCardId;
    const hpPercent = character.hp.max > 0 ? Math.min(100, Math.max(0, (character.hp.current / character.hp.max) * 100)) : 100;

    return (
      <div
        ref={ref}
        style={style}
        {...rest}
        onClick={onSelect}
        className={`bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:border-accent/60 hover:shadow-[0_0_20px_rgba(var(--color-accent),0.15)] group relative cursor-pointer touch-pan-y character-card-observable flex flex-col justify-between ${isActive ? 'is-active border-accent' : ''}`}
        role="button"
        tabIndex={0}
        data-character-id={character.id}
      >
        {/* Banner Top Image */}
        <div className="relative w-full h-36 overflow-hidden bg-muted/40">
          {character.imageUrl ? (
            <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-gradient-to-b from-card/30 to-card">
              <PhotoIcon className="w-14 h-14" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

          {/* Level Badge */}
          <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md border border-accent/40 px-2.5 py-1 rounded-full text-xs font-bold text-accent shadow-md flex items-center gap-1 font-mono">
            <span>LV.</span>
            <span>{character.level || 1}</span>
          </div>

          {/* Campaign Badge if set */}
          {character.campaignName && (
            <div className="absolute top-3 right-3 bg-accent/20 backdrop-blur-md border border-accent/40 text-accent px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
              <UserGroupIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px]">{character.campaignName}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-2xl font-bold font-cinzel text-accent truncate group-hover:text-accent-light transition-colors">
              {character.name || 'Unnamed Adventurer'}
            </h3>
            <p className="text-muted-foreground capitalize text-xs font-semibold tracking-wide mt-1">
              {character.race || 'Unknown Race'} &bull; {character.class || 'Unknown Class'} {character.subclass ? `(${character.subclass})` : ''}
            </p>
          </div>

          {/* HP Bar & AC Indicator */}
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1 font-semibold">
                <span className="text-rose-400 font-bold">HP</span>
                <span className="font-mono text-foreground">{character.hp.current} / {character.hp.max}</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <span className="text-amber-400 font-bold">CA</span>
                <span className="font-mono text-foreground">{calculateArmorClass(character)}</span>
              </div>
            </div>
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-3 bg-background/50 border-t border-border/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-accent text-accent-foreground text-xs font-bold rounded-xl shadow-md hover:bg-accent-light transition-all active:scale-95"
          >
            <PlayIcon className="w-4 h-4" /> Gioca
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="p-2 rounded-xl bg-secondary/80 hover:bg-accent hover:text-accent-foreground text-secondary-foreground transition-all"
            title="Modifica Scheda"
          >
            <EditIcon className="w-4 h-4" />
          </button>
          {onDuplicate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(e);
              }}
              className="p-2 rounded-xl bg-secondary/80 hover:bg-accent hover:text-accent-foreground text-secondary-foreground transition-all"
              title="Duplica Personaggio"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExport(e);
              }}
              className="p-2 rounded-xl bg-secondary/80 hover:bg-accent hover:text-accent-foreground text-secondary-foreground transition-all"
              title="Esporta JSON"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="p-2 rounded-xl bg-secondary/80 hover:bg-destructive hover:text-destructive-foreground text-secondary-foreground transition-all"
            title="Elimina Personaggio"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

CharacterCard.displayName = 'CharacterCard';