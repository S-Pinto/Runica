import { useMemo } from 'react';
import { Currency } from '../../../characterTypes';
import { MinusIcon, PlusIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { PlaySection, playLabelClass } from '../PlaySection';

const COINS: { key: keyof Currency; label: string; short: string }[] = [
  { key: 'pp', label: 'Platino', short: 'MP' },
  { key: 'gp', label: 'Oro', short: 'MO' },
  { key: 'ep', label: 'Electrum', short: 'ME' },
  { key: 'sp', label: 'Argento', short: 'MA' },
  { key: 'cp', label: 'Rame', short: 'MR' },
];

interface InventoryCurrencyBannerProps {
  currency: Currency;
  attunedCount: number;
  onChange: (type: keyof Currency, value: number) => void;
}

/** Monete, valore totale stimato e conteggio delle sintonizzazioni (max 3). */
export const InventoryCurrencyBanner = ({ currency, attunedCount, onChange }: InventoryCurrencyBannerProps) => {
  const totalGp = useMemo(() => {
    const c = currency || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    const total = (c.pp || 0) * 10 + (c.gp || 0) + (c.ep || 0) * 0.5 + (c.sp || 0) * 0.1 + (c.cp || 0) * 0.01;
    return total.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [currency]);

  return (
    <PlaySection
      title="Monete"
      aside={
        <p className="text-right text-xs text-muted-foreground">
          Valore totale <span className="ml-1 font-mono text-base font-bold tabular-nums text-foreground">{totalGp}</span> MO
        </p>
      }
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        {COINS.map((coin) => {
          const val = currency[coin.key] || 0;
          const inputId = `coin-${coin.key}`;
          return (
            <div key={coin.key}>
              <label htmlFor={inputId} className={`${playLabelClass} mb-1.5 block`}>
                {coin.label} <span className="font-normal">· {coin.short}</span>
              </label>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="icon" onClick={() => onChange(coin.key, val - 1)} disabled={val <= 0} aria-label={`Togli una moneta: ${coin.label}`}>
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <input
                  id={inputId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={val}
                  onChange={(e) => onChange(coin.key, parseInt(e.target.value) || 0)}
                  className="no-spinner h-10 min-w-0 flex-1 rounded-xl border border-border-strong/60 bg-background px-1 text-center font-mono text-base font-bold tabular-nums text-foreground transition-colors duration-150 hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <Button variant="secondary" size="icon" onClick={() => onChange(coin.key, val + 1)} aria-label={`Aggiungi una moneta: ${coin.label}`}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
        Oggetti in sintonia{' '}
        <span className={`font-mono font-bold tabular-nums ${attunedCount >= 3 ? 'text-warning' : 'text-foreground'}`}>{attunedCount}/3</span>
      </p>
    </PlaySection>
  );
};
