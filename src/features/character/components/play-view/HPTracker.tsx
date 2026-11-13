import { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { HeartIcon, PlusIcon, MinusIcon, ShieldIcon } from '../../../../components/ui/icons';
import { toast } from '../../../../components/ui/Dialogs';
import { PlaySection } from './PlaySection';

const QUICK_AMOUNTS = [1, 5, 10];

export const HPTracker = () => {
    const { character, updateCharacter } = useCharacter();
    const [amount, setAmount] = useState('');

    if (!character) return null;
    const { hp } = character;
    const value = Math.max(0, Math.floor(Number(amount) || 0));

    const applyDamage = () => {
        if (value <= 0) return;
        const toTemp = Math.min(value, hp.temporary);
        const toHp = value - toTemp;
        const newCurrent = Math.max(0, hp.current - toHp);
        const saves = character.deathSaves;
        let deathSaves = saves;

        if (hp.current === 0 && toHp > 0) {
            // Already down: each hit is a failed death save; massive damage (>= max HP) kills outright.
            deathSaves = { ...saves, failures: toHp >= hp.max ? 3 : Math.min(3, saves.failures + 1) };
        } else if (newCurrent === 0 && toHp - hp.current >= hp.max) {
            // Dropped to 0 and the leftover damage is at least the HP maximum: instant death.
            deathSaves = { ...saves, failures: 3 };
        }

        updateCharacter({
            hp: { ...hp, temporary: hp.temporary - toTemp, current: newCurrent },
            ...(deathSaves !== saves ? { deathSaves } : {}),
        });
        if (hp.current === 0 && toHp > 0 && deathSaves.failures < 3) toast.info('Danno a 0 PV: un fallimento al tiro contro la morte.');
        setAmount('');
    };

    const applyHeal = () => {
        if (value <= 0) return;
        updateCharacter({
            hp: { ...hp, current: Math.min(hp.max, hp.current + value) },
            // Regaining any HP at 0 brings you back and clears death saves.
            ...(hp.current === 0 ? { deathSaves: { successes: 0, failures: 0 } } : {}),
        });
        setAmount('');
    };

    const setTemp = () => {
        if (amount === '') return;
        updateCharacter({ hp: { ...hp, temporary: value } });
        setAmount('');
    };

    const pct = hp.max > 0 ? Math.min(100, (hp.current / hp.max) * 100) : 100;
    const tempPct = hp.max > 0 ? Math.min(100 - pct, (hp.temporary / hp.max) * 100) : 0;
    const tone = pct > 50 ? 'bg-success' : pct > 25 ? 'bg-warning' : 'bg-destructive';
    const isDown = hp.current === 0;

    return (
        <PlaySection
            title="Punti vita"
            icon={<HeartIcon className="text-destructive" />}
            aside={hp.temporary > 0 && (
                <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                    <ShieldIcon className="h-3.5 w-3.5" /> <span className="font-mono">+{hp.temporary}</span> temporanei
                </span>
            )}
        >
            <div>
                <div className="flex items-baseline justify-center gap-2" aria-live="polite">
                    <span className={`font-mono text-6xl font-bold leading-none tabular-nums ${isDown ? 'text-destructive' : 'text-foreground'}`}>{hp.current}</span>
                    <span className="font-mono text-2xl tabular-nums text-muted-foreground">/ {hp.max}</span>
                </div>
                {isDown && <p className="mt-2 text-center text-sm font-semibold text-destructive">A terra: effettua i tiri salvezza contro la morte</p>}
                <div
                    className="relative mt-4 flex h-4 overflow-hidden rounded-full bg-input shadow-[inset_0_1px_2px_rgb(var(--color-shadow)/0.5)]"
                    role="progressbar"
                    aria-label="Punti vita"
                    aria-valuemin={0}
                    aria-valuemax={hp.max}
                    aria-valuenow={hp.current}
                >
                    <div className={`${tone} h-full transition-[width] duration-300 ease-soft`} style={{ width: `${pct}%` }} />
                    {tempPct > 0 && <div className="h-full bg-accent/70 transition-[width] duration-300 ease-soft" style={{ width: `${tempPct}%` }} />}
                    {/* Tacche: dieci segmenti, come le incisioni di un righello. */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent calc(10% - 2px), rgb(var(--color-card)) calc(10% - 2px), rgb(var(--color-card)) 10%)' }}
                    />
                </div>
            </div>

            <div className="mt-5 space-y-2">
                <div className="flex gap-2">
                    <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        aria-label="Quantità"
                        placeholder="Quantità"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyDamage()}
                        className="no-spinner h-12 min-w-0 flex-1 rounded-xl border border-border-strong/60 bg-background px-3 text-center font-mono text-xl font-bold text-foreground transition-colors duration-150 placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    {QUICK_AMOUNTS.map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setAmount(String(value + n))}
                            className="h-12 w-11 shrink-0 rounded-xl border border-border-strong/60 font-mono text-sm font-semibold text-text transition-[border-color,color,transform] duration-150 ease-soft hover:border-accent/70 hover:text-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Aggiungi ${n}`}
                        >
                            +{n}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={applyDamage}
                        disabled={value <= 0}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-destructive/15 text-sm font-semibold text-destructive transition-[background-color,color,transform] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-destructive hover:text-destructive-foreground active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-destructive/15 disabled:hover:text-destructive"
                    >
                        <MinusIcon className="h-4 w-4" /> Danno
                    </button>
                    <button
                        type="button"
                        onClick={applyHeal}
                        disabled={value <= 0 || hp.current >= hp.max}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-success/15 text-sm font-semibold text-success transition-[background-color,color,transform] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-success hover:text-background active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-success/15 disabled:hover:text-success"
                    >
                        <PlusIcon className="h-4 w-4" /> Cura
                    </button>
                    <button
                        type="button"
                        onClick={setTemp}
                        disabled={amount === ''}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-accent/15 text-sm font-semibold text-accent transition-[background-color,color,transform] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-accent/15 disabled:hover:text-accent"
                        title="Imposta i punti vita temporanei"
                    >
                        <ShieldIcon className="h-4 w-4" /> Temp
                    </button>
                </div>
            </div>
        </PlaySection>
    );
};
