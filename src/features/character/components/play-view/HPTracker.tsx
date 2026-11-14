import { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { HeartIcon, PlusIcon, MinusIcon, ShieldIcon } from '../../../../components/ui/icons';
import { HpBar } from './HpBar';
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

    const isDown = hp.current === 0;

    return (
        <section aria-label="Punti vita" className={`tile tile-danger flex h-full flex-col justify-between gap-5 p-5 sm:p-6 ${isDown ? 'ring-2 ring-destructive/60' : ''}`}>
            <div>
                <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-label font-semibold uppercase tracking-widest text-muted-foreground">
                        <HeartIcon className="h-4 w-4 text-destructive" /> Punti vita
                    </h3>
                    {hp.temporary > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                            <ShieldIcon className="h-3.5 w-3.5" /> <span className="font-mono">+{hp.temporary}</span> temp
                        </span>
                    )}
                </div>
                <div className="mt-2 flex items-baseline gap-3" aria-live="polite">
                    <span className={`font-mono text-8xl font-black leading-none tracking-tighter tabular-nums sm:text-9xl ${isDown ? 'text-destructive' : 'text-foreground'}`}>{hp.current}</span>
                    <span className="font-mono text-3xl font-semibold tabular-nums text-muted-foreground">/ {hp.max}</span>
                </div>
                {isDown && <p className="mt-2 text-sm font-semibold text-destructive">A terra: effettua i tiri salvezza contro la morte</p>}
                <div className="mt-4">
                    <HpBar current={hp.current} max={hp.max} temp={hp.temporary} />
                </div>
            </div>

            <div className="space-y-2">
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
                        className="no-spinner h-12 min-w-0 flex-1 rounded-2xl bg-background/60 px-3 text-center font-mono text-xl font-bold text-foreground transition-shadow duration-150 placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60"
                    />
                    {QUICK_AMOUNTS.map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setAmount(String(value + n))}
                            className="h-12 w-12 shrink-0 rounded-2xl bg-foreground/10 font-mono text-sm font-semibold text-text transition-[background-color,color,transform] duration-150 ease-soft hover:bg-accent/20 hover:text-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-destructive/15 text-sm font-semibold text-destructive transition-[background-color,color,transform] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-destructive hover:text-destructive-foreground active:scale-[0.97] disabled:opacity-60 disabled:hover:bg-destructive/15 disabled:hover:text-destructive"
                    >
                        <MinusIcon className="h-4 w-4" /> Danno
                    </button>
                    <button
                        type="button"
                        onClick={applyHeal}
                        disabled={value <= 0 || hp.current >= hp.max}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-success/15 text-sm font-semibold text-success transition-[background-color,color,transform] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-success hover:text-background active:scale-[0.97] disabled:opacity-60 disabled:hover:bg-success/15 disabled:hover:text-success"
                    >
                        <PlusIcon className="h-4 w-4" /> Cura
                    </button>
                    <button
                        type="button"
                        onClick={setTemp}
                        disabled={amount === ''}
                        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-accent/15 text-sm font-semibold text-accent transition-[background-color,color,transform] duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground active:scale-[0.97] disabled:opacity-60 disabled:hover:bg-accent/15 disabled:hover:text-accent"
                        title="Imposta i punti vita temporanei"
                    >
                        <ShieldIcon className="h-4 w-4" /> Temp
                    </button>
                </div>
            </div>
        </section>
    );
};
