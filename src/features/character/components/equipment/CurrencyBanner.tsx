import { useMemo } from 'react';
import { Currency } from '../../characterTypes';

const COINS: { key: keyof Currency; label: string; color: string }[] = [
  { key: 'pp', label: 'MP (platino)', color: 'border-accent/30 bg-accent/5 text-accent' },
  { key: 'gp', label: 'MO (oro)', color: 'border-warning/30 bg-warning/5 text-warning' },
  { key: 'ep', label: 'ME (electrum)', color: 'border-accent/30 bg-accent/5 text-accent' },
  { key: 'sp', label: 'MA (argento)', color: 'border-text-muted/30 bg-text-muted/5 text-text-muted' },
  { key: 'cp', label: 'MR (rame)', color: 'border-warning/30 bg-warning/5 text-warning' },
];

/** Monete con pulsanti +/- e valore totale stimato in monete d'oro. */
export const CurrencyBanner = ({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (type: keyof Currency, value: number) => void;
}) => {
  const totalGp = useMemo(() => {
    const c = currency || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    const total = (c.pp || 0) * 10 + (c.gp || 0) + (c.ep || 0) * 0.5 + (c.sp || 0) * 0.1 + (c.cp || 0) * 0.01;
    return total.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [currency]);

  return (
    <div className="bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <h3 className="text-xl font-cinzel text-accent flex items-center gap-2">
          <span>🪙</span> Monete
        </h3>
        <div className="bg-accent/10 text-accent px-3.5 py-1 rounded-xl border border-accent/20 text-xs font-bold font-mono">
          Valore totale stimato: <span className="text-foreground text-sm font-black">{totalGp} MO</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {COINS.map((coin) => {
          const val = currency[coin.key] || 0;
          return (
            <div key={coin.key} className={`p-3 rounded-xl border ${coin.color} flex flex-col items-center justify-between gap-2 shadow-sm`}>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{coin.label}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(coin.key, val - 1)}
                  className="w-7 h-7 rounded-lg bg-background/50 hover:bg-background border border-border/50 text-foreground font-bold flex items-center justify-center transition-colors text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => onChange(coin.key, parseInt(e.target.value) || 0)}
                  className="w-14 bg-background/60 text-center font-mono font-bold text-base rounded border border-border/40 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => onChange(coin.key, val + 1)}
                  className="w-7 h-7 rounded-lg bg-background/50 hover:bg-background border border-border/50 text-foreground font-bold flex items-center justify-center transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
