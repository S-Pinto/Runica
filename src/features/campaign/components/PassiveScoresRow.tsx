import type { ILiveStats } from '../../character/characterTypes';
import { playInsetClass, playLabelClass } from '../../character/components/play-view/PlaySection';

const PASSIVES: { key: keyof ILiveStats['passives']; short: string; label: string }[] = [
    { key: 'perception', short: 'Perc', label: 'Percezione passiva' },
    { key: 'insight', short: 'Intu', label: 'Intuizione passiva' },
    { key: 'investigation', short: 'Inda', label: 'Indagare passiva' },
];

/** Le tre passive in una riga: il DM le confronta con le CD senza chiedere tiri. */
export const PassiveScoresRow = ({ passives }: { passives: ILiveStats['passives'] }) => (
    <div className={`${playInsetClass} flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2`}>
        <span className={`${playLabelClass} shrink-0 font-semibold tracking-wider`}>Passive</span>
        <dl className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-3 gap-y-1 sm:justify-start sm:gap-x-4">
            {PASSIVES.map(({ key, short, label }) => (
                <div key={key} className="flex items-baseline gap-1" title={label}>
                    <dt className="text-xs text-muted-foreground"><abbr title={label} className="no-underline">{short}</abbr></dt>
                    <dd className="font-mono text-base font-bold tabular-nums text-foreground">{passives[key]}</dd>
                </div>
            ))}
        </dl>
    </div>
);
