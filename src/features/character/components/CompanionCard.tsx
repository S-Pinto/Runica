import React, { useState, useRef, useEffect } from 'react';
import { ICompanion } from '../characterTypes';
import { SparklesIcon, EditIcon, TrashIcon, EllipsisVerticalIcon, HeartIcon, ShieldCheckIcon, ArrowTrendingUpIcon, BoltIcon, DocumentDuplicateIcon } from '../../../components/ui/icons';
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
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';
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
        className="bg-card-alt border border-border rounded-lg shadow-lg transition-all duration-300 relative overflow-hidden group cursor-pointer hover:shadow-accent/20 hover:border-accent/30 hover:scale-[1.02]"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onView && onView()}
      >
        <div className="w-full aspect-video bg-muted overflow-hidden">
          {companion.imageUrl ? (
            <img src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <SparklesIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-xl font-cinzel font-bold text-accent truncate">{companion.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{companion.type || 'Companion'}</p>

          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div title="Hit Points">
              <HeartIcon className="w-6 h-6 mx-auto text-destructive/80 mb-1" />
              <div className="font-bold text-xl sm:text-2xl text-foreground">{companion.hp.current} / {companion.hp.max}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">HP</div>
            </div>
            <div title="Armor Class">
              <ShieldCheckIcon className="w-6 h-6 mx-auto text-accent/80 mb-1" />
              <div className="font-bold text-2xl text-foreground">{companion.armorClass}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">AC</div>
            </div>
            <div title="Speed">
              <ArrowTrendingUpIcon className="w-6 h-6 mx-auto text-primary/80 mb-1" />
              <div className="font-bold text-xl sm:text-2xl text-foreground">{companion.speed}{speedInMeters && <span className="text-base font-normal"> ({speedInMeters})</span>}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Speed</div>
            </div>
            <div title="Initiative">
              <BoltIcon className="w-6 h-6 mx-auto text-yellow-400/80 mb-1" />
              <div className="font-bold text-2xl text-foreground">{formatModifier(initiative)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Initiative</div>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2.5 mt-4">
            <div className={`${hpColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
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
              <div className="absolute right-0 mt-1 w-32 bg-zinc-800 border border-border rounded-md shadow-xl z-10">
                <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700">
                  <EditIcon className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { onDuplicate(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-700">
                  <DocumentDuplicateIcon className="w-4 h-4" /> Duplicate
                </button>
                <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-zinc-700">
                  <TrashIcon className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div><div className="font-bold text-lg">{companion.hp.current} / {companion.hp.max}</div><div className="text-xs text-muted-foreground">HP</div></div>
        <div><div className="font-bold text-lg">{companion.armorClass}</div><div className="text-xs text-muted-foreground">AC</div></div>
        <div>
          <div className="font-bold text-lg">{companion.speed}</div>
          <div className="text-xs text-muted-foreground">Speed {speedInMeters && `(${speedInMeters})`}</div>
        </div>
        <div>
          <div className="font-bold text-lg">{formatModifier(initiative)}</div>
          <div className="text-xs text-muted-foreground">Init</div>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
        <div className={`${hpColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
      </div>
    </div>
  );
};