import { hpTone } from '../../utils/characterDisplay';

interface HpBarProps {
    current: number;
    max: number;
    temp?: number;
    /** `lg` nella vista di gioco (16px), `md` nelle tessere del gruppo (10px). */
    size?: 'lg' | 'md';
    /** Nome accessibile della barra (es. "Punti vita di Thalia"). */
    label?: string;
}

/**
 * Barra dei punti vita: riempimento `.hp-fill` con il colore di stato, PV temporanei in accento,
 * dieci tacche incise e il riflesso `.hp-sheen` a ogni cambio di valore.
 * Condivisa da `HPTracker` (vista di gioco) e dalle tessere della Live Board.
 */
export const HpBar = ({ current, max, temp = 0, size = 'lg', label = 'Punti vita' }: HpBarProps) => {
    const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 100;
    const tempPct = max > 0 ? Math.min(100 - pct, (temp / max) * 100) : 0;
    return (
        <div
            className={`relative flex overflow-hidden rounded-full bg-background/60 shadow-[inset_0_2px_4px_rgb(var(--color-shadow)/0.45)] ${size === 'lg' ? 'h-4' : 'h-2.5'}`}
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={current}
        >
            <div className="hp-fill relative h-full overflow-hidden rounded-full" data-tone={hpTone(pct)} style={{ width: `${pct}%` }}>
                <span key={current} aria-hidden className="hp-sheen" />
            </div>
            {tempPct > 0 && <div className="h-full bg-accent/70 transition-[width] duration-300 ease-soft" style={{ width: `${tempPct}%` }} />}
            {/* Tacche: dieci segmenti, come le incisioni di un righello. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent calc(10% - 2px), rgb(var(--color-card)) calc(10% - 2px), rgb(var(--color-card)) 10%)' }}
            />
        </div>
    );
};
