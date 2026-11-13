import React from 'react';
import { WEAPON_MASTERIES } from '../../../data/weaponProperties';
import { damageTypeLabel } from '../../../lib/labels';
import { ChevronDownIcon } from '../../../components/ui/icons';
import { formatActionHit, formatPart, type ResolvedAction } from '../rules/attacks';
import { weaponPropertyLabel } from '../utils/itemLabels';

type AttackRowVariant = 'card' | 'list';

interface AttackRowProps {
  action: ResolvedAction;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: AttackRowVariant;
  onClick?: () => void;
  isExpanded?: boolean;
}

const SOURCE_LABELS: Record<ResolvedAction['source'], string | null> = {
  weapon: "Dall'inventario",
  item: 'Oggetto magico',
  spell: 'Trucchetto',
  feat: 'Privilegio',
  custom: null,
};

const labelClass = 'text-label uppercase text-muted-foreground';
const valueClass = 'mt-0.5 font-mono text-xl font-bold leading-tight tabular-nums text-foreground';
const chipClass = 'rounded-md bg-foreground/10 px-1.5 py-0.5 text-xs text-muted-foreground';
const accentChipClass = 'rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent';

/** Riga di un'azione risolta: "Colpire" (o CD) e "Danno" con il dettaglio del calcolo sotto. */
export const AttackRow: React.FC<AttackRowProps> = ({ action, actions, children, variant = 'card', onClick, isExpanded }) => {
  const containerClasses = {
    card: 'rounded-2xl bg-background/50 transition-colors duration-150 hover:bg-background/70',
    list: 'border-b border-foreground/10 py-3',
  };
  const source = SOURCE_LABELS[action.source];
  const name = <span className="min-w-0 break-words">{action.name}</span>;
  const damageSub = [damageTypeLabel(action.damageType), ...action.damageParts.map(formatPart)].filter(Boolean).join(' · ');

  return (
    <div className={containerClasses[variant]}>
      <div className="flex flex-col gap-3 p-3 sm:p-4">
        {/* Nome (apre i dettagli) e azioni */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h4 className="min-w-0 flex-1 basis-40 text-base font-semibold leading-snug text-foreground">
            {onClick ? (
              <button
                type="button"
                onClick={onClick}
                aria-expanded={isExpanded}
                className="-mx-1 flex min-h-10 w-full items-center gap-1.5 rounded-lg px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {name}
                <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            ) : name}
          </h4>

          {actions && <div className="flex grow flex-wrap items-center gap-2 sm:grow-0">{actions}</div>}
        </div>

        {/* Valori: il numero prima della parola */}
        {(action.roll !== 'none' || action.damage) && (
          <dl className="grid grid-cols-2 gap-3">
            {action.roll === 'save' ? (
              <div>
                <dt className={labelClass}>Tiro salvezza</dt>
                <dd className={valueClass}>{formatActionHit(action)}</dd>
              </div>
            ) : action.roll === 'attack' ? (
              <div>
                <dt className={labelClass}>Colpire</dt>
                <dd className={valueClass}>{formatActionHit(action)}</dd>
                {action.hitParts.length > 0 && (
                  <dd className="mt-0.5 text-xs text-muted-foreground">{action.hitParts.map(formatPart).join(' · ')}</dd>
                )}
              </div>
            ) : <div />}

            <div>
              <dt className={labelClass}>Danno</dt>
              <dd className={valueClass}>{action.damage || '–'}</dd>
              {damageSub && <dd className="mt-0.5 text-xs text-muted-foreground">{damageSub}</dd>}
              {action.damage && action.additionalDamage.map((extra, idx) => (
                <dd key={idx} className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-accent">
                  + {extra.formula} <span className="font-sans text-xs font-medium">{damageTypeLabel(extra.type)}</span>
                </dd>
              ))}
              {action.versatileDamage && (
                <dd className="mt-0.5 text-xs text-muted-foreground">
                  A due mani <span className="font-mono text-foreground">{action.versatileDamage}</span>
                </dd>
              )}
            </div>
          </dl>
        )}

        {(source || action.mastery || action.properties.length > 0 || action.uses || action.ammo || action.attunementMissing) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {source && <span className={chipClass}>{source}</span>}
            {action.attunementMissing && (
              <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-xs font-medium text-warning">Senza sintonia: niente bonus magici</span>
            )}
            {action.uses && (
              <span className={chipClass}>Usi <span className="font-mono text-foreground">{action.uses.current}/{action.uses.max}</span></span>
            )}
            {action.ammo && (
              <span className={action.ammo.quantity > 0 ? chipClass : 'rounded-md bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive'}>
                {action.ammo.name} <span className="font-mono">×{action.ammo.quantity}</span>
              </span>
            )}
            {action.mastery && (
              <span className={accentChipClass}>Maestria: {WEAPON_MASTERIES[action.mastery]?.name ?? action.mastery}</span>
            )}
            {action.properties.map(p => <span key={p} className={chipClass}>{weaponPropertyLabel(p)}</span>)}
          </div>
        )}
      </div>

      {children && <div className="px-3 pb-3 sm:px-4 sm:pb-4">{children}</div>}
    </div>
  );
};
