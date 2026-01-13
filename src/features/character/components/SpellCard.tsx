import React from 'react';
import { Spell } from '../characterTypes';
import { EditIcon, TrashIcon, CheckIcon, XMarkIcon as XIcon } from '../../../components/ui/icons';

interface SpellCardProps {
  spell: Spell;
  onToggleExpand: () => void;
  isExpanded: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
  isEditingActive?: boolean; // Per disabilitare i pulsanti
}

export const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  onToggleExpand,
  isExpanded,
  onEdit,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  isEditingActive,
}) => {
  const canBeEdited = !!onEdit;

  return (
    <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 hover:border-accent/30 group">
      <button
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-t-xl transition-colors hover:bg-accent/5"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg text-accent truncate group-hover:text-accent-light transition-colors" title={spell.name}>
              {spell.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                {spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`}
              </span>
              <span className="text-xs text-muted-foreground/80 capitalize italic">{spell.school}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            {spell.concentration && (
              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-sm" title="Concentration">C</span>
            )}
            {spell.ritual && (
              <span className="bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-sm" title="Ritual">R</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Casting</span>
            <span className="text-foreground/90 truncate">{spell.castingTime}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Range</span>
            <span className="text-foreground/90 truncate">{spell.range}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Duration</span>
            <span className="text-foreground/90 truncate">{spell.duration}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Comp.</span>
            <span className="text-foreground/90 truncate">{spell.components}</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="flex-grow flex flex-col">
          <div className="px-3 pb-3 border-t border-border/50 text-sm bg-muted/30 flex-grow">
            <p className="text-foreground mt-2 whitespace-pre-wrap">{spell.description}</p>
          </div>
          {canBeEdited && (
            <div className="p-2 border-t border-border/50 bg-muted/30 flex justify-end items-center gap-2">
              {isDeleting ? (
                <>
                  <span className="text-xs text-destructive mr-auto">Sure?</span>
                  <button onClick={(e) => { e.stopPropagation(); onConfirmDelete?.(); }} className="text-destructive hover:text-destructive-foreground p-1"><CheckIcon className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onCancelDelete?.(); }} className="text-muted-foreground hover:text-accent p-1"><XIcon className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} disabled={isEditingActive} className="text-muted-foreground hover:text-accent p-1 disabled:text-muted/50 disabled:cursor-not-allowed"><EditIcon className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} disabled={isEditingActive} className="text-muted-foreground hover:text-destructive p-1 disabled:text-muted/50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};