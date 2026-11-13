import React, { useState, useRef, useEffect } from 'react';
import { ICompanion } from '../characterTypes';
import { SparklesIcon, EditIcon, TrashIcon, EllipsisVerticalIcon, DocumentDuplicateIcon } from '../../../components/ui/icons';
import { getModifier, formatModifier }  from '../utils/characterUtils';

const getSpeedInMeters = (speed: string | number): string | null => {
  if (typeof speed !== 'string') return null;
  const feet = parseInt(speed, 10);
  if (isNaN(feet)) return null;
  // D&D rule of thumb: 5ft is 1.5m
  const meters = Math.round((feet / 5) * 1.5);
  return `${meters}m`;
};

interface CompanionCardProps {
  companion: ICompanion;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onView?: () => void;
  readOnly?: boolean;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({ companion, onEdit, onDelete, onDuplicate, onView, readOnly = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hpPercentage = companion.hp.max > 0 ? (companion.hp.current / companion.hp.max) * 100 : 0;
  const hpColor = hpPercentage > 50 ? 'bg-success' : hpPercentage > 25 ? 'bg-warning' : 'bg-destructive';
  const dexModifier = getModifier(companion.abilityScores.dexterity);
  const initiative = dexModifier;
  const speedInMeters = getSpeedInMeters(companion.speed);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (readOnly) {
    return (
      <div
        onClick={onView}
        className="group relative cursor-pointer overflow-hidden tile transition-[transform,box-shadow] duration-200 ease-soft hover:-translate-y-0.5 hover:shadow-raised hover:ring-1 hover:ring-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onView && onView()}
      >
        <div className="aspect-[16/10] w-full overflow-hidden bg-input">
          {companion.imageUrl ? (
            <img src={companion.imageUrl} alt={companion.name} className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <SparklesIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="truncate font-cinzel text-headline text-foreground">{companion.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{companion.type || 'Compagno'}</p>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div title="Punti vita">
              <div className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">{companion.hp.current}<span className="text-base font-normal text-muted-foreground">/{companion.hp.max}</span></div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Punti vita</div>
            </div>
            <div title="Classe Armatura">
              <div className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">{companion.armorClass}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Classe Armatura</div>
            </div>
            <div title="Velocità">
              <div className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">{companion.speed}{speedInMeters && <span className="text-base font-normal text-muted-foreground"> · {speedInMeters}</span>}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Velocità</div>
            </div>
            <div title="Iniziativa">
              <div className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">{formatModifier(initiative)}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Iniziativa</div>
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-input">
            <div className={`${hpColor} h-full rounded-full transition-[width] duration-300 ease-soft`} style={{ width: `${hpPercentage}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={readOnly ? onView : undefined}
      className={`bg-card-alt border border-border rounded-lg p-4 flex flex-col gap-3 shadow-lg transition-shadow duration-300 relative ${readOnly ? 'cursor-pointer hover:shadow-accent/20' : ''}`}
      role={readOnly ? 'button' : undefined}
      tabIndex={readOnly ? 0 : undefined}
      onKeyDown={readOnly ? (e) => (e.key === 'Enter' || e.key === ' ') && onView && onView() : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
          {companion.imageUrl ? (
            <img src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover" />
          ) : (
            <SparklesIcon className="w-full h-full text-muted-foreground/50 p-4" />
          )}
        </div>
        {/* Aggiunto min-w-0 per permettere al testo di essere troncato correttamente in un contenitore flex */}
        <div className="flex-grow min-w-0">
          <h3 className="text-lg font-bold text-accent truncate">{companion.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{companion.type}</p>
        </div>
        {!readOnly && (
          <div className="absolute top-2 right-2" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-card border border-border rounded-md shadow-xl z-10">
                <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-input">
                  <EditIcon className="w-4 h-4" /> Modifica
                </button>
                <button onClick={() => { onDuplicate(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-input">
                  <DocumentDuplicateIcon className="w-4 h-4" /> Duplica
                </button>
                <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-input">
                  <TrashIcon className="w-4 h-4" /> Elimina
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div><div className="font-bold text-lg">{companion.hp.current} / {companion.hp.max}</div><div className="text-xs text-muted-foreground">PV</div></div>
        <div><div className="font-bold text-lg">{companion.armorClass}</div><div className="text-xs text-muted-foreground">CA</div></div>
        <div>
          <div className="font-bold text-lg">{companion.speed}</div>
          <div className="text-xs text-muted-foreground">Velocità {speedInMeters && `(${speedInMeters})`}</div>
        </div>
        <div>
          <div className="font-bold text-lg">{formatModifier(initiative)}</div>
          <div className="text-xs text-muted-foreground">Iniz.</div>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
        <div className={`${hpColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
      </div>
    </div>
  );
};