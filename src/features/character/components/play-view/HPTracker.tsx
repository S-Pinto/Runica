import { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { HeartIcon, PlusIcon, MinusIcon, ShieldIcon } from '../../../../components/ui/icons';
import { toast } from '../../../../components/ui/Dialogs';

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
        <section aria-labelledby="hp-title" className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
                <h3 id="hp-title" className="flex items-center gap-2 font-cinzel text-lg font-bold text-foreground">
                    <HeartIcon className="h-5 w-5 text-destructive" /> Punti vita
                </h3>
                {hp.temporary > 0 && (
                    <span className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                        <ShieldIcon className="h-3.5 w-3.5" /> {hp.temporary} temporanei
                    </span>
                )}
            </div>

            <div>
                <div className="flex items-baseline justify-center gap-2" aria-live="polite">
                    <span className={`font-mono text-6xl font-bold leading-none ${isDown ? 'text-destructive' : 'text-foreground'}`}>{hp.current}</span>
                    <span className="font-mono text-2xl text-muted-foreground">/ {hp.max}</span>
                </div>
                {isDown && <p className="mt-2 text-center text-sm font-semibold text-destructive">A terra: effettua i tiri salvezza contro la morte</p>}
                <div
                    className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted/40"
                    role="progressbar"
                    aria-label="Punti vita"
                    aria-valuemin={0}
                    aria-valuemax={hp.max}
                    aria-valuenow={hp.current}
                >
                    <div className={`${tone} h-full transition-all duration-500 ease-out`} style={{ width: `${pct}%` }} />
                    {tempPct > 0 && <div className="h-full bg-accent/70 transition-all duration-500" style={{ width: `${tempPct}%` }} />}
                </div>
            </div>

            <div className="space-y-3">
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
                        className="no-spinner h-11 min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-3 text-center font-mono text-xl font-bold text-foreground placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                    {QUICK_AMOUNTS.map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setAmount(String(value + n))}
                            className="h-11 w-11 shrink-0 rounded-xl border border-border font-mono text-sm font-semibold text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
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
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-destructive/15 text-sm font-semibold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-destructive/15 disabled:hover:text-destructive"
                    >
                        <MinusIcon className="h-4 w-4" /> Danno
                    </button>
                    <button
                        type="button"
                        onClick={applyHeal}
                        disabled={value <= 0 || hp.current >= hp.max}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-success/15 text-sm font-semibold text-success transition-all hover:bg-success hover:text-background active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-success/15 disabled:hover:text-success"
                    >
                        <PlusIcon className="h-4 w-4" /> Cura
                    </button>
                    <button
                        type="button"
                        onClick={setTemp}
                        disabled={amount === ''}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-accent/15 text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-accent-foreground active:scale-[0.97] disabled:opacity-40 disabled:hover:bg-accent/15 disabled:hover:text-accent"
                        title="Imposta i punti vita temporanei"
                    >
                        <ShieldIcon className="h-4 w-4" /> Temp
                    </button>
                </div>
            </div>
        </section>
    );
};
