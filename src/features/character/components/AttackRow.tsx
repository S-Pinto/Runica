import React from 'react';
import { Attack } from '../characterTypes';

type AttackRowVariant = 'card' | 'list';

interface AttackRowProps {
  attack: Attack;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: AttackRowVariant;
  onClick?: () => void;
}

export const AttackRow: React.FC<AttackRowProps> = ({ attack, actions, children, variant = 'card', onClick }) => {
  const containerClasses = {
    card: `bg-gradient-to-br from-card/40 to-card/20 hover:from-card/50 hover:to-card/30 backdrop-blur-sm rounded-xl border border-border/40 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`,
    list: 'border-b border-border/50 py-3 transition-all duration-300',
  };

  return (
    <div className={containerClasses[variant]} onClick={onClick}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10 -mr-16 -mt-16 pointer-events-none group-hover:bg-accent/10 transition-colors duration-500" />

      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Name and Basic Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-cinzel text-lg font-bold text-accent truncate">{attack.name}</h4>
          <div className="flex flex-col gap-1.5 mt-1">
            {/* Vital Stats Row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              {attack.saveAbility ? (
                <span className="bg-background/40 px-2 py-0.5 rounded border border-border/30 shadow-sm" title="Saving Throw DC">
                  DC {attack.bonus} <span className="text-foreground font-bold uppercase">{attack.saveAbility}</span>
                </span>
              ) : (
                <span className="bg-background/40 px-2 py-0.5 rounded border border-border/30 shadow-sm" title="Attack Bonus">
                  HIT: <span className="text-foreground font-bold">{attack.bonus.startsWith('+') || attack.bonus.startsWith('-') ? attack.bonus : `+${attack.bonus}`}</span>
                </span>
              )}
              <span className="bg-background/40 px-2 py-0.5 rounded border border-border/30 shadow-sm truncate max-w-[150px]" title="Damage">
                DMG: <span className="text-foreground font-bold">{attack.damage}</span>
              </span>
            </div>

            {/* Properties & Mastery Row */}
            {(attack.mastery || (attack.properties && attack.properties.length > 0)) && (
              <div className="flex flex-wrap gap-1.5 items-center">
                {attack.mastery && (
                  <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 shadow-[0_0_8px_-2px_rgba(168,85,247,0.3)]">
                    {attack.mastery}
                  </span>
                )}
                {attack.properties && attack.properties.length > 0 && (
                  <>
                    {attack.properties.map(p => (
                      <span key={p} className="bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded border border-border/30 text-[9px] uppercase tracking-wide">
                        {p}
                      </span>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      </div>

      {children && <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">{children}</div>}
    </div>
  );
};