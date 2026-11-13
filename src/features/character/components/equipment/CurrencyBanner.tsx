import { useMemo } from 'react';
import { Currency } from '../../characterTypes';
import { StyledSection } from '../ui/StyledInputs';
import { StatInput } from '../StatInput';

const COINS: { key: keyof Currency; label: string }[] = [
  { key: 'pp', label: 'Platino' },
  { key: 'gp', label: 'Oro' },
  { key: 'ep', label: 'Electrum' },
  { key: 'sp', label: 'Argento' },
  { key: 'cp', label: 'Rame' },
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
    <StyledSection
      title="Monete"
      action={
        <p className="text-sm text-muted-foreground">
          Valore <span className="font-mono text-base font-bold tabular-nums text-foreground">{totalGp}</span> mo
        </p>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {COINS.map((coin) => (
          <StatInput
            key={coin.key}
            label={coin.label}
            value={currency[coin.key] || 0}
            onChange={(val) => onChange(coin.key, Number(val) || 0)}
          />
        ))}
      </div>
    </StyledSection>
  );
};
