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
        className={`bg-card/75 backdrop-blur-xl border border-border/70 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 hover:border-accent/70 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:shadow-accent/15 group relative cursor-pointer touch-pan-y character-card-observable flex flex-col justify-between ${isActive ? 'is-active border-accent ring-2 ring-accent/30' : ''}`}
        role="button"
        tabIndex={0}
        data-character-id={character.id}
      >
        {/* Banner Top Image */}
        <div className="relative w-full h-40 overflow-hidden bg-muted/40">
          {character.imageUrl ? (
            <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-gradient-to-b from-card/30 via-card/60 to-card">
              <PhotoIcon className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

          {/* Level Badge */}
          <div className="absolute top-3.5 left-3.5 bg-background/85 backdrop-blur-md border border-accent/50 px-3 py-1 rounded-full text-xs font-black text-accent shadow-lg flex items-center gap-1 font-mono tracking-wider">
            <span className="text-[10px] text-muted-foreground">LV.</span>
            <span>{character.level || 1}</span>
          </div>

          {/* Campaign Badge if set */}
          {character.campaignName && (
            <div className="absolute top-3.5 right-3.5 bg-accent/25 backdrop-blur-md border border-accent/40 text-accent px-3 py-1 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1.5">
              <UserGroupIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[110px]">{character.campaignName}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-2xl font-bold font-cinzel text-accent truncate group-hover:text-accent-light transition-colors drop-shadow-sm">
              {character.name || 'Senza Nome'}
            </h3>
            <p className="text-muted-foreground capitalize text-xs font-bold tracking-wide mt-1 flex items-center gap-1.5">
              <span className="text-foreground/90">{character.race || 'Razza Sconosciuta'}</span>
              <span>•</span>
              <span className="text-accent/90">{character.class || 'Classe Sconosciuta'}</span>
              {character.subclass && <span className="text-muted-foreground/80 font-normal">({character.subclass})</span>}
            </p>
          </div>

          {/* HP Bar & AC Indicator */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-rose-400 uppercase text-[10px] tracking-wider">HP</span>
                <span className="font-mono text-foreground">{character.hp.current} / {character.hp.max}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold bg-background/50 px-2 py-0.5 rounded-lg border border-border/40">
                <span className="text-amber-400 uppercase text-[10px] tracking-wider">CA</span>
                <span className="font-mono text-amber-300 font-extrabold">{calculateArmorClass(character)}</span>
              </div>
            </div>
            <div className="w-full bg-background/60 h-2 rounded-full overflow-hidden p-0.5 border border-border/30">
              <div
                className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                  hpPercent > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : hpPercent > 20 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-3 bg-background/60 backdrop-blur-md border-t border-border/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-accent text-accent-foreground text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:bg-accent-light hover:shadow-[0_0_15px_rgba(var(--color-accent),0.4)] transition-all active:scale-95"
          >
            <PlayIcon className="w-4 h-4" /> Gioca
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="p-2.5 rounded-xl bg-card border border-border/50 hover:border-accent/60 hover:text-accent text-muted-foreground transition-all"
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
              className="p-2.5 rounded-xl bg-card border border-border/50 hover:border-accent/60 hover:text-accent text-muted-foreground transition-all"
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
              className="p-2.5 rounded-xl bg-card border border-border/50 hover:border-accent/60 hover:text-accent text-muted-foreground transition-all"
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
            className="p-2.5 rounded-xl bg-card border border-border/50 hover:bg-destructive/20 hover:border-destructive hover:text-destructive text-muted-foreground transition-all"
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