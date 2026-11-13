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
  ShieldOutlineIcon,
} from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { Menu, MenuItem } from '../../../components/ui/Menu';
import { calculateArmorClass } from '../rules/combat';
import { resolveCampaignName } from '../rules/campaign';
import { useCampaigns } from '../../../providers/CampaignProvider';
import { hpBarTone, hpPercent, initials } from '../utils/characterDisplay';

interface CharacterCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  character: ICharacter;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
  onExport?: (e: React.MouseEvent) => void;
}

const MENU_TRIGGER =
  'flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Scheda di un personaggio nella lista. Su telefono è una riga compatta
 * (miniatura a sinistra) per vedere più eroi senza scorrere; da `sm` diventa
 * una card con il ritratto in alto. Tutta la scheda apre la vista di gioco.
 */
export const CharacterCard = forwardRef<HTMLDivElement, CharacterCardProps>(
  ({ character, onSelect, onDelete, onEdit, onDuplicate, onExport, className = '', onKeyDown, ...rest }, ref) => {
    const { hp } = character;
    const { campaignNames } = useCampaigns();
    const campaignName = resolveCampaignName(character, campaignNames);
    const percent = hpPercent(hp.current, hp.max);
    const subtitle = [character.race, character.class, character.subclass].filter(Boolean).join(' · ') || 'Avventuriero';
    const displayName = character.name || 'Senza nome';
    const armorClass = calculateArmorClass(character);

    // The menu passes no event; parents only use it for stopPropagation, which the menu already does.
    const noEvent = {} as React.MouseEvent;
    const menuItems: MenuItem[] = [
      { label: 'Modifica scheda', icon: <EditIcon />, onSelect: () => onEdit(noEvent) },
      ...(onDuplicate ? [{ label: 'Duplica', icon: <CopyIcon />, onSelect: () => onDuplicate(noEvent) }] : []),
      ...(onExport ? [{ label: 'Esporta JSON', icon: <ArrowDownTrayIcon />, onSelect: () => onExport(noEvent) }] : []),
      { label: 'Elimina', icon: <TrashIcon />, onSelect: () => onDelete(noEvent), destructive: true },
    ];
    const menuLabel = `Altre azioni per ${character.name || 'personaggio'}`;

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
        className={`group relative flex cursor-pointer touch-pan-y select-none gap-3 rounded-2xl border border-border bg-card p-2.5 transition-[transform,box-shadow,border-color] duration-200 ease-soft hover:border-accent/60 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-col sm:gap-0 sm:p-0 sm:hover:-translate-y-0.5 ${className}`}
      >
        {/* Ritratto */}
        <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-input sm:aspect-[16/10] sm:h-auto sm:w-full sm:rounded-b-none sm:rounded-t-[15px]">
          {character.imageUrl ? (
            <img
              src={character.imageUrl}
              alt=""
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-cinzel text-3xl font-bold text-accent/60 sm:text-6xl">{initials(character.name || '')}</span>
            </div>
          )}

          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-background/85 px-1.5 py-0.5 font-mono text-xs font-bold text-foreground sm:bottom-auto sm:left-3 sm:top-3 sm:rounded-full sm:px-2.5">
            Lv {character.level || 1}
          </span>
          {campaignName && (
            <span className="absolute right-3 top-3 hidden max-w-[60%] items-center gap-1 rounded-full bg-background/85 px-2.5 py-0.5 text-xs font-medium text-text sm:flex">
              <UserGroupIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{campaignName}</span>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:gap-3 sm:p-4">
          <div className="min-w-0">
            <h3 className="truncate font-cinzel text-lg font-bold leading-snug text-foreground sm:text-xl">{displayName}</h3>
            <p className="truncate text-sm capitalize text-muted-foreground">{subtitle}</p>
            {campaignName && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
                <UserGroupIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{campaignName}</span>
              </p>
            )}
          </div>

          {/* Punti vita e classe armatura */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-label uppercase text-muted-foreground">
                  <span className="sm:hidden">PV</span>
                  <span className="hidden sm:inline">Punti vita</span>
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {hp.current}
                  <span className="font-normal text-muted-foreground">/{hp.max}</span>
                  {hp.temporary > 0 && <span className="ml-1 text-accent">+{hp.temporary}</span>}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-input"
                role="progressbar"
                aria-label="Punti vita"
                aria-valuemin={0}
                aria-valuemax={hp.max}
                aria-valuenow={hp.current}
              >
                <div className={`h-full rounded-full transition-[width] duration-500 ease-soft ${hpBarTone(percent)}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
            <div className="relative flex h-10 w-9 shrink-0 items-center justify-center" title="Classe Armatura">
              <ShieldOutlineIcon aria-hidden className="absolute inset-0 h-full w-full text-border-strong" />
              <span className="relative font-mono text-sm font-bold text-foreground">
                <span className="sr-only">Classe Armatura </span>
                {armorClass}
              </span>
            </div>
            {/* Su telefono la riga intera apre il personaggio: resta solo il menu. */}
            <div className="sm:hidden">
              <Menu label={menuLabel} trigger={<EllipsisVerticalIcon className="h-5 w-5" />} items={menuItems} placement="top" triggerClassName={`${MENU_TRIGGER} hover:bg-muted/60`} />
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {/* Secondario a riposo: l'accento arriva quando si punta la card. */}
            <Button
              variant="secondary"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 group-hover:border-accent/70 group-hover:text-accent"
            >
              <PlayIcon className="h-4 w-4" /> Gioca
            </Button>
            <Menu
              label={menuLabel}
              trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
              items={menuItems}
              placement="top"
              triggerClassName={`${MENU_TRIGGER} border border-border-strong/60 hover:border-accent/70`}
            />
          </div>
        </div>
      </div>
    );
  },
);

CharacterCard.displayName = 'CharacterCard';
