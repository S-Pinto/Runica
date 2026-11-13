import React from 'react';
import { ICompanion } from '../characterTypes';
import { SparklesIcon, EditIcon, TrashIcon, EllipsisVerticalIcon, DocumentDuplicateIcon } from '../../../components/ui/icons';
import { Menu, MenuItem } from '../../../components/ui/Menu';
import { getModifier, formatModifier }  from '../utils/characterUtils';
import { playInsetClass, playLabelClass } from './play-view/PlaySection';

const MENU_TRIGGER =
  'flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

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
  const hpPercentage = companion.hp.max > 0 ? (companion.hp.current / companion.hp.max) * 100 : 0;
  const hpColor = hpPercentage > 50 ? 'bg-success' : hpPercentage > 25 ? 'bg-warning' : 'bg-destructive';
  const dexModifier = getModifier(companion.abilityScores.dexterity);
  const initiative = dexModifier;
  const speedInMeters = getSpeedInMeters(companion.speed);

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

  const menuItems: MenuItem[] = [
    { label: 'Modifica', icon: <EditIcon className="h-4 w-4" />, onSelect: onEdit },
    { label: 'Duplica', icon: <DocumentDuplicateIcon className="h-4 w-4" />, onSelect: onDuplicate },
    { label: 'Elimina', icon: <TrashIcon className="h-4 w-4" />, onSelect: onDelete, destructive: true },
  ];

  const stats: { label: string; value: React.ReactNode }[] = [
    { label: 'PV', value: <>{companion.hp.current}<span className="text-sm font-normal text-muted-foreground">/{companion.hp.max}</span></> },
    { label: 'CA', value: companion.armorClass },
    { label: speedInMeters ? `Vel. · ${speedInMeters}` : 'Velocità', value: companion.speed },
    { label: 'Iniz.', value: formatModifier(initiative) },
  ];

  // Compagno modificabile: tessera `.tile` senza bordo, valori in riquadri interni, azioni nel `Menu` condiviso.
  return (
    <div className="tile flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-input">
          {companion.imageUrl ? (
            <img src={companion.imageUrl} alt={companion.name} className="h-full w-full object-cover" />
          ) : (
            <SparklesIcon className="h-full w-full p-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate font-cinzel text-title text-foreground">{companion.name}</h3>
          <p className="text-sm capitalize text-muted-foreground">{companion.type || 'Compagno'}</p>
        </div>
        <Menu label={`Azioni per ${companion.name}`} trigger={<EllipsisVerticalIcon className="h-5 w-5" />} items={menuItems} triggerClassName={MENU_TRIGGER} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {stats.map(s => (
          <div key={s.label} className={`${playInsetClass} px-1 py-2`}>
            <div className="font-mono text-lg font-bold leading-none tabular-nums text-foreground">{s.value}</div>
            <div className={`${playLabelClass} mt-1 truncate`}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-input">
        <div className={`${hpColor} h-full rounded-full transition-[width] duration-300 ease-soft`} style={{ width: `${hpPercentage}%` }} />
      </div>
    </div>
  );
};
