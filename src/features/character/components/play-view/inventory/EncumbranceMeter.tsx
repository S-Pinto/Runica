import { BackpackIcon } from '../../../../../components/ui/icons';
import { formatWeight, type EncumbranceState } from '../../../rules/encumbrance';
import { PlaySection, playLabelClass } from '../PlaySection';

/** Carico trasportato rispetto alla capacità (regola opzionale): numero grande, barra e stato. */
export const EncumbranceMeter = ({ state }: { state: EncumbranceState }) => {
  const percent = Math.min(100, Math.round(state.ratio * 100));
  const tone = state.over ? 'bg-destructive' : state.ratio >= 0.75 ? 'bg-warning' : 'bg-success';
  return (
    <PlaySection title="Carico" icon={<BackpackIcon className="text-muted-foreground" />}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-numeric font-bold tabular-nums text-foreground">
          {formatWeight(state.carried, state.unit)}
        </p>
        <p className="text-right text-sm text-muted-foreground">
          <span className={playLabelClass}>Capacità</span>{' '}
          <span className="font-mono tabular-nums text-foreground">{formatWeight(state.capacity, state.unit)}</span>
        </p>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-foreground/10"
        role="meter"
        aria-label="Carico trasportato"
        aria-valuemin={0}
        aria-valuemax={state.capacity}
        aria-valuenow={state.carried}
      >
        <div className={`h-full rounded-full transition-[width] duration-300 ease-soft ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      {state.over && (
        <p className="mt-2 text-sm font-medium text-destructive">Oltre la capacità di carico: chiedi al DM gli effetti.</p>
      )}
    </PlaySection>
  );
};
