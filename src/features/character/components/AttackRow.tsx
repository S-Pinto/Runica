import React from 'react';
import { Attack } from '../characterTypes';

type AttackRowVariant = 'card' | 'list';

interface AttackRowProps {
  attack: Attack & { sourceName?: string; uses?: { max: number; current: number }; recovery?: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: AttackRowVariant;
  onClick?: () => void;
}

export const AttackRow: React.FC<AttackRowProps> = ({ attack, actions, children, variant = 'card', onClick }) => {
  const getSourceConfig = (type?: string) => {
    switch (type) {
      case 'weapon': return { color: 'text-accent', border: 'border-accent/30', bg: 'bg-accent/5', badge: 'bg-accent/10 border-accent/20 text-accent' };
      case 'spell': return { color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5', badge: 'bg-purple-500/10 border-purple-500/20 text-purple-400' };
      case 'feat': return { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' };
      case 'item': return { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
      default: return { color: 'text-accent', border: 'border-accent/30', bg: 'bg-accent/5', badge: 'bg-accent/10 border-accent/20 text-accent' };
    }
  };

  const config = getSourceConfig(attack.sourceType);

  const containerClasses = {
    card: `bg-gradient-to-br from-card/60 to-card/40 hover:from-card/80 hover:to-card/50 backdrop-blur-md rounded-xl border ${config.border} shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`,
    list: 'border-b border-border/50 py-3 transition-all duration-300',
  };

  return (
    <div className={containerClasses[variant]} onClick={onClick}>
      {/* Decorative background element */}
      <div className={`absolute top-0 right-0 w-64 h-64 ${config.bg} rounded-full blur-3xl -z-10 -mr-20 -mt-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="p-4 flex flex-col sm:flex-col gap-4">
        {/* Header Row: Name & Source Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h4 className={`font-cinzel text-xl font-bold ${config.color} leading-tight truncate`}>{attack.name}</h4>
            <div className="flex items-center gap-2">
              {attack.sourceName && (
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${config.badge}`}>
                  {attack.sourceName}
                </span>
              )}
              {/* Properties row (inline if short, otherwise expanded below) */}
              {(attack.mastery || (attack.properties && attack.properties.length > 0)) && (
                <div className="flex items-center gap-1.5 opacity-80">
                  {attack.mastery && (
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      {attack.mastery}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions (Buttons) */}
          {actions && (
            <div className="shrink-0 flex items-start">
              {actions}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-[auto_auto_1fr] gap-3 items-center bg-background/20 p-2.5 rounded-lg border border-border/10">

          {/* Hit / DC Box */}
          <div className="flex flex-col items-center justify-center p-2 rounded bg-background/40 border border-border/20 min-w-[80px]">
            {attack.saveAbility ? (
              <>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Save DC</span>
                <span className="text-lg font-black text-foreground">{attack.bonus} <span className="text-sm font-bold text-muted-foreground">{attack.saveAbility.slice(0, 3).toUpperCase()}</span></span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">To Hit</span>
                <span className="text-lg font-black text-foreground">{attack.bonus}</span>
              </>
            )}
          </div>

          {/* Damage Box */}
          <div className="flex flex-col items-center justify-center p-2 rounded bg-background/40 border border-border/20 min-w-[100px]">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Damage</span>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-foreground">{attack.damage}</span>
              {attack.damageType && <span className="text-[9px] uppercase font-bold text-muted-foreground/80 tracking-wide">{attack.damageType}</span>}
            </div>
          </div>

          {/* Additional Info / Notes (Optional) */}
          {attack.additionalDamage && attack.additionalDamage.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
              {attack.additionalDamage.map((extra, idx) => (
                <div key={idx} className="flex flex-col items-center p-1.5 px-2.5 rounded bg-background/40 border border-border/20">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{extra.type || 'Extra'}</span>
                  <span className="text-sm font-bold text-foreground">+{extra.formula}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Counters */}
        {attack.uses && attack.uses.max > 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-2 bg-background/40 rounded-lg border border-border/30 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-70 mb-1">Uses</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-mono font-bold ${attack.uses.current === 0 ? 'text-destructive' : 'text-foreground'}`}>
                {attack.uses.current}
              </span>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-sm font-mono text-muted-foreground">
                {attack.uses.max}
              </span>
            </div>
            {attack.recovery && attack.recovery !== 'none' && (
              <span className="text-[9px] text-muted-foreground italic mt-1 uppercase">{attack.recovery} rest</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      </div>

      {children && <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">{children}</div>}
    </div>
  );
};