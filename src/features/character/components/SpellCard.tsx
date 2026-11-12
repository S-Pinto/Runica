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
  isEditingActive?: boolean;
  onTogglePrepared?: () => void;
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
  onTogglePrepared,
}) => {
  const canBeEdited = !!onEdit;

  return (
    <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 hover:border-accent/30 group">
      <div
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-t-xl transition-colors hover:bg-accent/5 cursor-pointer relative"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg text-accent truncate group-hover:text-accent-light transition-colors" title={spell.name}>
              {spell.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                {spell.level === 0 ? 'Trucchetto' : `Liv. ${spell.level}`}
              </span>
              {/* Casting Time Badge */}
              {spell.castingTime.toLowerCase().includes('bonus') ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-warning/30 text-warning bg-warning/10 uppercase tracking-wide">Bonus</span>
              ) : spell.castingTime.toLowerCase().includes('reaction') ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-warning/30 text-warning bg-warning/10 uppercase tracking-wide">Reazione</span>
              ) : spell.castingTime.toLowerCase().includes('1 action') ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-accent/30 text-accent bg-accent/10 uppercase tracking-wide">Azione</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            {/* Prepared Toggle - Only for Level 1+ */}
            {spell.level > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePrepared?.();
                }}
                // Placeholder until I add the prop
                className={`w-6 h-6 flex items-center justify-center rounded-lg border transition-all ${spell.prepared
                  ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_8px_rgb(var(--color-accent)/0.5)]'
                  : 'bg-background/20 text-muted-foreground/30 border-border/30 hover:border-accent/50 hover:text-accent'
                  }`}
                title={spell.prepared ? "Preparato" : "Clicca per preparare"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {spell.concentration && (
              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-sm" title="Concentrazione">C</span>
            )}
            {spell.ritual && (
              <span className="bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-sm" title="Rituale">R</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Lancio</span>
            <span className="text-foreground/90 truncate">{spell.castingTime}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Gittata</span>
            <span className="text-foreground/90 truncate">{spell.range}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Durata</span>
            <span className="text-foreground/90 truncate">{spell.duration}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold text-[9px]">Comp.</span>
            <span className="text-foreground/90 truncate">{spell.components}</span>
          </div>
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
                  <span className="text-xs text-destructive mr-auto">Sicuro?</span>
                  <button onClick={(e) => { e.stopPropagation(); onConfirmDelete?.(); }} className="text-destructive hover:text-destructive-foreground p-1"><CheckIcon className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onCancelDelete?.(); }} className="text-muted-foreground hover:text-accent p-1"><XIcon className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} disabled={isEditingActive} className="text-muted-foreground hover:text-accent p-1 disabled:text-muted-foreground/50 disabled:cursor-not-allowed"><EditIcon className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} disabled={isEditingActive} className="text-muted-foreground hover:text-destructive p-1 disabled:text-muted-foreground/50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};