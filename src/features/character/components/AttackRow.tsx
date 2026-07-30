import React from 'react';
import { Attack, AbilityScores } from '../characterTypes';

type AttackRowVariant = 'card' | 'list';

interface AttackRowProps {
  attack: Attack;
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
  dexterity: 'DEX',
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
      dcText: `CD ${attack.bonus || 10} ${attack.saveAbility.toUpperCase()}`,
      damageText: attack.damage ? `${attack.damage} ${attack.damageType || ''}`.trim() : 'N/A',
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
    hitParts.push(`+${proficiencyBonus} PB`);
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

export const AttackRow: React.FC<AttackRowProps> = ({
  attack,
  actions,
  children,
  variant = 'card',
  onClick,
  abilityScores,
  proficiencyBonus,
}) => {
  const summary = getAttackSummary(attack, abilityScores, proficiencyBonus);

  const containerClasses = {
    card: `bg-gradient-to-br from-card/80 via-card/60 to-card/40 hover:from-card/90 hover:to-card/50 backdrop-blur-md rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-accent/40 transition-all duration-300 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`,
    list: 'border-b border-border/50 py-3 transition-all duration-300',
  };

  return (
    <div className={containerClasses[variant]} onClick={onClick}>
      <div className="absolute top-0 right-0 w-36 h-36 bg-accent/5 rounded-full blur-3xl -z-10 -mr-16 -mt-16 pointer-events-none group-hover:bg-accent/15 transition-colors duration-500" />

      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Top Header: Name and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-cinzel text-lg sm:text-xl font-bold text-accent tracking-wide truncate">
            {attack.name}
          </h4>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Stats Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summary.isSave ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">🛡️ Tiro Salvezza</span>
              <span className="text-sm font-black text-foreground">{summary.dcText}</span>
            </div>
          ) : (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">🎯 Hit:</span>
                <span className="text-sm sm:text-base font-black text-accent">{summary.rollToHitDice}</span>
              </div>
              {summary.hitBreakdownParts.length > 0 && (
                <div className="flex items-center gap-1">
                  {summary.hitBreakdownParts.map((part, idx) => (
                    <span key={idx} className="bg-primary/20 text-foreground font-bold px-2 py-0.5 rounded text-[11px] border border-primary/30">
                      {part}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!summary.isSave && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-destructive uppercase tracking-wider">⚔️ Danno:</span>
                <span className="text-sm sm:text-base font-black text-foreground">{summary.damageFormula}</span>
                {summary.damageType && (
                  <span className="text-[10px] uppercase font-bold text-foreground bg-destructive/30 px-1.5 py-0.5 rounded border border-destructive/40">
                    {summary.damageType}
                  </span>
                )}
              </div>
              {summary.damageBreakdownParts.length > 0 && (
                <div className="flex items-center gap-1">
                  {summary.damageBreakdownParts.map((part, idx) => (
                    <span key={idx} className="bg-destructive/20 text-foreground font-bold px-2 py-0.5 rounded text-[11px] border border-destructive/30">
                      {part}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Extra Damage Badges */}
        {summary.additionalDamage && summary.additionalDamage.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.additionalDamage.map((extra, idx) => (
              <div key={idx} className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span>🔥 Extra:</span>
                <span>+{extra.formula}</span>
                <span className="text-[10px] uppercase">{extra.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Properties & Mastery Row */}
        {(attack.mastery || (attack.properties && attack.properties.length > 0)) && (
          <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-border/30">
            {attack.mastery && (
              <span className="bg-purple-500/15 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 shadow-sm">
                ✨ {attack.mastery}
              </span>
            )}
            {attack.properties && attack.properties.map(p => (
              <span key={p} className="bg-muted/40 text-muted-foreground px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-semibold uppercase tracking-wide">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {children && <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">{children}</div>}
    </div>
  );
};