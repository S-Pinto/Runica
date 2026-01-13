import React from 'react';
import { Attack } from '../characterTypes';

type AttackRowVariant = 'card' | 'list';

interface AttackRowProps {
  attack: Attack;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: AttackRowVariant;
}

export const AttackRow: React.FC<AttackRowProps> = ({ attack, actions, children, variant = 'card' }) => {
  const containerClasses = {
    card: 'bg-gradient-to-br from-card/40 to-card/20 hover:from-card/50 hover:to-card/30 backdrop-blur-sm rounded-xl border border-border/40 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 relative overflow-hidden group',
    list: 'border-b border-border/50 py-3 transition-all duration-300',
  };

  return (
    <div className={containerClasses[variant]}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10 -mr-16 -mt-16 pointer-events-none group-hover:bg-accent/10 transition-colors duration-500" />

      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Name and Basic Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-cinzel text-lg font-bold text-accent truncate">{attack.name}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
            <span className="bg-background/30 px-2 py-0.5 rounded border border-border/30" title="Attack Bonus">
              HIT: <span className="text-foreground font-bold">{attack.bonus.startsWith('+') || attack.bonus.startsWith('-') ? attack.bonus : `+${attack.bonus}`}</span>
            </span>
            <span className="bg-background/30 px-2 py-0.5 rounded border border-border/30 truncate max-w-[150px]" title="Damage">
              DMG: <span className="text-foreground font-bold">{attack.damage}</span>
            </span>
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