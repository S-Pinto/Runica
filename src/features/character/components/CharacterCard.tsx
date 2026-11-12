import React, { forwardRef } from 'react';
import { ICharacter } from '../characterTypes';
import {
  TrashIcon,
  EditIcon,
  PlayIcon,
  CopyIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  ShieldIcon,
} from '../../../components/ui/icons';
import { Menu, MenuItem } from '../../../components/ui/Menu';
import { calculateArmorClass } from '../rules/combat';
import { resolveCampaignName } from '../rules/campaign';
import { useCampaigns } from '../../../providers/CampaignProvider';

interface CharacterCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  character: ICharacter;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
  onExport?: (e: React.MouseEvent) => void;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

const hpTone = (pct: number) => (pct > 50 ? 'bg-success' : pct > 20 ? 'bg-warning' : 'bg-destructive');

export const CharacterCard = forwardRef<HTMLDivElement, CharacterCardProps>(
  ({ character, onSelect, onDelete, onEdit, onDuplicate, onExport, className = '', onKeyDown, ...rest }, ref) => {
    const { hp } = character;
    const { campaignNames } = useCampaigns();
    const campaignName = resolveCampaignName(character, campaignNames);
    const hpPercent = hp.max > 0 ? Math.min(100, Math.max(0, (hp.current / hp.max) * 100)) : 100;
    const subtitle = [character.race, character.class].filter(Boolean).join(' · ') || 'Avventuriero';

    // The menu passes no event; parents only use it for stopPropagation, which the menu already does.
    const noEvent = {} as React.MouseEvent;
    const menuItems: MenuItem[] = [
      { label: 'Modifica scheda', icon: <EditIcon />, onSelect: () => onEdit(noEvent) },
      ...(onDuplicate ? [{ label: 'Duplica', icon: <CopyIcon />, onSelect: () => onDuplicate(noEvent) }] : []),
      ...(onExport ? [{ label: 'Esporta JSON', icon: <ArrowDownTrayIcon />, onSelect: () => onExport(noEvent) }] : []),
      { label: 'Elimina', icon: <TrashIcon />, onSelect: () => onDelete(noEvent), destructive: true },
    ];

    return (
      <div
        ref={ref}
        {...rest}
        onClick={onSelect}
        onKeyDown={(e) => {
          onKeyDown?.(e); // dnd-kit keyboard sorting
          if (e.defaultPrevented) return;
          if (e.target === e.currentTarget && e.key === 'Enter') {
            e.preventDefault();
            onSelect();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Apri ${character.name || 'personaggio'}`}
        data-character-id={character.id}
        className={`group relative flex flex-col rounded-2xl border border-border/70 bg-card cursor-pointer touch-pan-y select-none transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_18px_40px_-12px_rgb(var(--color-accent)/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      >
        {/* Portrait */}
        <div className="relative aspect-video overflow-hidden rounded-t-2xl sm:aspect-[4/3]">
          {character.imageUrl ? (
            <img
              src={character.imageUrl}
              alt=""
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgb(var(--color-accent)/0.28),transparent_60%),linear-gradient(160deg,rgb(var(--color-input)/0.6),rgb(var(--color-card)))]">
              <span className="font-cinzel text-6xl font-bold text-accent/70 drop-shadow-[0_0_24px_rgb(var(--color-accent)/0.5)]">
                {initials(character.name || '')}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <span className="rounded-full border border-accent/40 bg-background/80 px-2.5 py-0.5 font-mono text-xs font-bold text-accent backdrop-blur">
              Lv {character.level || 1}
            </span>
            {campaignName && (
              <span className="flex min-w-0 items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-xs font-medium text-text backdrop-blur">
                <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate max-w-[9rem]">{campaignName}</span>
              </span>
            )}
          </div>

          <div className="absolute inset-x-4 bottom-3">
            <h3 className="truncate font-cinzel text-2xl font-bold text-foreground drop-shadow">
              {character.name || 'Senza nome'}
            </h3>
            <p className="truncate text-sm capitalize text-muted-foreground">
              {subtitle}
              {character.subclass && <span className="text-muted-foreground/70"> · {character.subclass}</span>}
            </p>
          </div>
        </div>

        {/* Vitals */}
        <div className="flex items-center gap-4 px-4 pt-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">Punti vita</span>
              <span className="font-mono font-semibold text-text">
                {hp.current}
                <span className="text-muted-foreground">/{hp.max}</span>
                {hp.temporary > 0 && <span className="ml-1 text-accent">+{hp.temporary}</span>}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted/50"
              role="progressbar"
              aria-label="Punti vita"
              aria-valuemin={0}
              aria-valuemax={hp.max}
              aria-valuenow={hp.current}
            >
              <div className={`h-full rounded-full transition-all duration-500 ${hpTone(hpPercent)}`} style={{ width: `${hpPercent}%` }} />
            </div>
          </div>
          <div className="relative flex h-11 w-10 shrink-0 items-center justify-center" title="Classe Armatura">
            <ShieldIcon className="absolute inset-0 h-full w-full text-accent/25" />
            <span className="relative font-mono text-sm font-bold text-text">{calculateArmorClass(character)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 p-4 pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PlayIcon className="h-4 w-4" /> Gioca
          </button>
          <Menu
            label={`Altre azioni per ${character.name || 'personaggio'}`}
            trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
            items={menuItems}
            placement="top"
            triggerClassName="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
    );
  },
);

CharacterCard.displayName = 'CharacterCard';
