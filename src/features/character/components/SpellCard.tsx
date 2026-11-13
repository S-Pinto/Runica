import React from 'react';
import { Spell } from '../characterTypes';
import { EditIcon, TrashIcon, CheckIcon, XMarkIcon, BookmarkIcon, ChevronDownIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';

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

const tagClass = 'rounded-md px-1.5 py-0.5 text-xs font-medium';

/** Etichetta del tempo di lancio: l'azione è neutra, bonus e reazione si distinguono. */
const castingTag = (castingTime: string): { label: string; className: string } | null => {
  const value = castingTime.toLowerCase();
  if (value.includes('bonus')) return { label: 'Bonus', className: 'bg-warning/15 text-warning' };
  if (value.includes('reaction')) return { label: 'Reazione', className: 'bg-warning/15 text-warning' };
  if (value.includes('1 action')) return { label: 'Azione', className: 'bg-foreground/10 text-muted-foreground' };
  return null;
};

const META: { label: string; key: 'castingTime' | 'range' | 'duration' | 'components' }[] = [
  { label: 'Lancio', key: 'castingTime' },
  { label: 'Gittata', key: 'range' },
  { label: 'Durata', key: 'duration' },
  { label: 'Componenti', key: 'components' },
];

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
  const casting = castingTag(spell.castingTime);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-background/50 transition-colors duration-150 hover:bg-background/70">
      <div className="flex items-start gap-1 p-1">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand();
            }
          }}
          className="min-w-0 flex-1 cursor-pointer rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h4 className="flex items-center gap-1.5 text-base font-semibold leading-snug text-foreground" title={spell.name}>
            <span className="truncate">{spell.name}</span>
            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
          </h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`${tagClass} bg-foreground/10 text-muted-foreground`}>
              {spell.level === 0 ? 'Trucchetto' : `Livello ${spell.level}`}
            </span>
            {casting && <span className={`${tagClass} ${casting.className}`}>{casting.label}</span>}
            {spell.concentration && <span className={`${tagClass} bg-accent/15 text-accent`}>Concentrazione</span>}
            {spell.ritual && <span className={`${tagClass} bg-foreground/10 text-muted-foreground`}>Rituale</span>}
          </div>
        </div>

        {spell.level > 0 && (
          <button
            type="button"
            onClick={() => onTogglePrepared?.()}
            aria-pressed={!!spell.prepared}
            aria-label={spell.prepared ? `${spell.name}: preparato` : `Prepara ${spell.name}`}
            title={spell.prepared ? 'Preparato' : 'Prepara'}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              spell.prepared ? 'text-accent' : 'text-border-strong hover:text-accent'
            }`}
          >
            <BookmarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-foreground/10 px-3 py-2.5">
        {META.map(({ label, key }) => (
          <div key={key} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="truncate text-sm text-text" title={spell[key]}>{spell[key] || '–'}</dd>
          </div>
        ))}
      </dl>

      {isExpanded && (
        <div className="animate-fadeIn border-t border-foreground/10">
          <p className="whitespace-pre-wrap px-3 py-3 text-sm leading-relaxed text-text">
            {spell.description || <span className="text-muted-foreground">Nessuna descrizione.</span>}
          </p>
          {canBeEdited && (
            <div className="flex items-center justify-end gap-1 border-t border-foreground/10 p-1">
              {isDeleting ? (
                <>
                  <span className="mr-auto pl-2 text-sm text-destructive">Eliminare?</span>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Conferma eliminazione" onClick={(e) => { e.stopPropagation(); onConfirmDelete?.(); }}>
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Annulla" onClick={(e) => { e.stopPropagation(); onCancelDelete?.(); }}>
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="icon" aria-label={`Modifica ${spell.name}`} disabled={isEditingActive} onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Elimina ${spell.name}`} disabled={isEditingActive} onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
