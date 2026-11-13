import React from 'react';
import { Attack, AbilityScores } from '../characterTypes';
import { WEAPON_MASTERIES } from '../../../data/weaponProperties';
import { ChevronDownIcon } from '../../../components/ui/icons';

type AttackRowVariant = 'card' | 'list';

interface AttackRowProps {
  attack: Attack & { sourceName?: string; uses?: { max: number; current: number }; recovery?: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: AttackRowVariant;
  onClick?: () => void;
  abilityScores?: AbilityScores;
  proficiencyBonus?: number;
}

const ABILITY_MAP: Record<string, keyof AbilityScores> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

const ABILITY_LABELS: Record<string, string> = {
  strength: 'FOR',
  dexterity: 'DES',
  constitution: 'COS',
  intelligence: 'INT',
  wisdom: 'SAG',
  charisma: 'CAR',
};

function combineDamageFormula(baseDamage: string, modifier: number): string {
  let cleanDmg = (baseDamage || '1d6').trim();
  const match = cleanDmg.match(/^(.*?)(?:\s*([\+\-])\s*(\d+))?$/);
  if (match) {
    const dicePart = match[1].trim();
    const sign = match[2];
    const existingNum = match[3] ? parseInt(match[3], 10) * (sign === '-' ? -1 : 1) : 0;
    const totalMod = existingNum + modifier;

    if (totalMod === 0) {
      return dicePart.replace(/\s*\+\s*/g, ' + ').replace(/\s*\-\s*/g, ' - ');
    }
    const finalSign = totalMod > 0 ? '+' : '-';
    return `${dicePart.replace(/\s*\+\s*/g, ' + ').replace(/\s*\-\s*/g, ' - ')} ${finalSign} ${Math.abs(totalMod)}`;
  }
  if (modifier === 0) return cleanDmg;
  const finalSign = modifier > 0 ? '+' : '-';
  return `${cleanDmg} ${finalSign} ${Math.abs(modifier)}`;
}

export function getAttackSummary(
  attack: Attack,
  abilityScores?: AbilityScores,
  proficiencyBonus?: number
) {
  if (attack.saveAbility) {
    return {
      isSave: true,
      dcText: `CD ${attack.bonus || 10} ${ABILITY_LABELS[ABILITY_MAP[attack.saveAbility.toLowerCase()] || attack.saveAbility] || attack.saveAbility.toUpperCase()}`,
      damageText: attack.damage ? `${attack.damage} ${attack.damageType || ''}`.trim() : '–',
      additionalDamage: attack.additionalDamage,
      hitBreakdownParts: [],
      damageBreakdownParts: [],
    };
  }

  // To Hit breakdown & total
  let hitBonus = 0;
  const hitParts: string[] = [];

  if (attack.attackAbility && abilityScores) {
    const key = ABILITY_MAP[attack.attackAbility.toLowerCase()] || (attack.attackAbility as keyof AbilityScores);
    if (abilityScores[key] !== undefined) {
      const mod = Math.floor((abilityScores[key] - 10) / 2);
      hitBonus += mod;
      const label = ABILITY_LABELS[key] || attack.attackAbility.toUpperCase();
      hitParts.push(`${mod >= 0 ? '+' : ''}${mod} ${label}`);
    }
  }

  if (attack.isProficient && proficiencyBonus) {
    hitBonus += proficiencyBonus;
    hitParts.push(`+${proficiencyBonus} Comp.`);
  }

  if (attack.bonus) {
    const parsed = parseInt(attack.bonus.replace('+', ''), 10);
    if (!isNaN(parsed) && parsed !== 0) {
      hitBonus += parsed;
      hitParts.push(`${parsed > 0 ? '+' : ''}${parsed} Magico`);
    }
  }

  const hitString = hitBonus >= 0 ? `+${hitBonus}` : `${hitBonus}`;
  const rollToHitDice = `1d20 ${hitString}`;

  // Damage breakdown & total
  let dmgMod = 0;
  const dmgParts: string[] = [];

  if (attack.damageAbility && abilityScores) {
    const key = ABILITY_MAP[attack.damageAbility.toLowerCase()] || (attack.damageAbility as keyof AbilityScores);
    if (abilityScores[key] !== undefined) {
      const mod = Math.floor((abilityScores[key] - 10) / 2);
      dmgMod += mod;
      if (mod !== 0) {
        const label = ABILITY_LABELS[key] || attack.damageAbility.toUpperCase();
        dmgParts.push(`${mod >= 0 ? '+' : ''}${mod} ${label}`);
      }
    }
  }

  let magicBonus = 0;
  if (attack.bonus) {
    const parsed = parseInt(attack.bonus.replace('+', ''), 10);
    if (!isNaN(parsed) && parsed !== 0) {
      magicBonus = parsed;
      dmgParts.push(`${magicBonus > 0 ? '+' : ''}${magicBonus} Magico`);
    }
  }

  const damageFormula = combineDamageFormula(attack.damage || '1d6', dmgMod + magicBonus);

  return {
    isSave: false,
    hitBonus,
    hitString,
    rollToHitDice,
    hitBreakdownParts: hitParts,
    damageFormula,
    damageBreakdownParts: dmgParts,
    damageType: attack.damageType || '',
    additionalDamage: attack.additionalDamage,
  };
}

const labelClass = 'text-label uppercase text-muted-foreground';
const valueClass = 'mt-0.5 font-mono text-xl font-bold leading-tight tabular-nums text-foreground';
const chipClass = 'rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground';

export const AttackRow: React.FC<AttackRowProps & { isExpanded?: boolean }> = ({
  attack,
  actions,
  children,
  variant = 'card',
  onClick,
  abilityScores,
  proficiencyBonus,
  isExpanded,
}) => {
  const summary = getAttackSummary(attack, abilityScores, proficiencyBonus);

  const containerClasses = {
    card: 'rounded-xl border border-border bg-background/40 transition-colors duration-150 hover:border-accent/40',
    list: 'border-b border-border py-3',
  };

  const name = <span className="min-w-0 break-words">{attack.name}</span>;

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

          {actions && <div className="flex grow items-center gap-2 sm:grow-0">{actions}</div>}
        </div>

        {/* Valori: il numero prima della parola */}
        <dl className="grid grid-cols-2 gap-3">
          {summary.isSave ? (
            <div>
              <dt className={labelClass}>Tiro salvezza</dt>
              <dd className={valueClass}>{summary.dcText}</dd>
            </div>
          ) : (
            <div>
              <dt className={labelClass}>Colpire</dt>
              <dd className={valueClass}>{summary.hitString}</dd>
              {summary.hitBreakdownParts.length > 0 && (
                <dd className="mt-0.5 text-xs text-muted-foreground">{summary.hitBreakdownParts.join(' · ')}</dd>
              )}
            </div>
          )}

          <div>
            <dt className={labelClass}>Danno</dt>
            <dd className={valueClass}>{summary.isSave ? summary.damageText : summary.damageFormula}</dd>
            {!summary.isSave && (summary.damageType || summary.damageBreakdownParts.length > 0) && (
              <dd className="mt-0.5 text-xs text-muted-foreground">
                {[summary.damageType, ...summary.damageBreakdownParts].filter(Boolean).join(' · ')}
              </dd>
            )}
          </div>
        </dl>

        {summary.additionalDamage && summary.additionalDamage.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {summary.additionalDamage.map((extra, idx) => (
              <span key={idx} className="rounded-md border border-accent/40 px-1.5 py-0.5 text-xs font-medium text-accent">
                Extra <span className="font-mono">+{extra.formula}</span> {extra.type}
              </span>
            ))}
          </div>
        )}

        {(attack.mastery || (attack.properties && attack.properties.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {attack.mastery && (
              <span className="rounded-md border border-accent/40 px-1.5 py-0.5 text-xs font-medium text-accent">
                Maestria: {WEAPON_MASTERIES[attack.mastery]?.name ?? attack.mastery}
              </span>
            )}
            {attack.properties && attack.properties.map(p => (
              <span key={p} className={chipClass}>{p}</span>
            ))}
          </div>
        )}
      </div>

      {children && <div className="px-3 pb-3 sm:px-4 sm:pb-4">{children}</div>}
    </div>
  );
};
