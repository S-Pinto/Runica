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
    <div className="bg-card/50 rounded-lg border border-border/50 flex flex-col h-full transition-shadow hover:shadow-lg hover:shadow-accent/10">
      <div className="p-3">
        <div className="flex justify-between items-start cursor-pointer" onClick={onToggleExpand}>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-accent truncate" title={spell.name}>{spell.name}</h4>
            <p className="text-xs text-muted-foreground capitalize">{spell.level === 0 ? `${spell.school} Cantrip` : `Level ${spell.level} ${spell.school}`}</p>
          </div>
          <div className="flex items-center gap-1.5 pl-2 flex-shrink-0">
            {spell.concentration && <span className="bg-primary/20 text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" title="Concentration">C</span>}
            {spell.ritual && <span className="bg-secondary/20 text-secondary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" title="Ritual">R</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">
            <div><strong className="text-foreground/80">Casting Time</strong></div><div className="text-right">{spell.castingTime}</div>
            <div><strong className="text-foreground/80">Range</strong></div><div className="text-right">{spell.range}</div>
            <div><strong className="text-foreground/80">Components</strong></div><div className="text-right">{spell.components}</div>
            <div><strong className="text-foreground/80">Duration</strong></div><div className="text-right">{spell.duration}</div>
        </div>
      </div>

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