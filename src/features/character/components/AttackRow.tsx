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
    card: 'bg-card/50 rounded-lg text-sm transition-all duration-300',
    list: 'border-b border-border/50 text-sm transition-all duration-300',
  };

  return (
    <div className={containerClasses[variant]}>
      <div className="grid grid-cols-6 items-center p-3 gap-2">
        <span className="font-semibold text-accent col-span-6 sm:col-span-3 truncate">{attack.name}</span>
        <span className="font-mono text-foreground col-span-2 sm:col-span-1 text-left sm:text-center" title="Attack Bonus">{attack.bonus}</span>
        <span className="font-mono text-foreground col-span-2 sm:col-span-1 text-left sm:text-center" title="Damage">{attack.damage}</span>
        <div className="flex items-center gap-1 justify-end col-span-2 sm:col-span-1">
          {actions}
        </div>
      </div>
      {children && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
};