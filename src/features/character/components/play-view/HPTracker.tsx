import { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { StatInput } from '../StatInput';
import { HeartIcon, PlusIcon, MinusIcon } from '../../../../components/ui/icons';

export const HPTracker = () => {
    const { character, updateCharacter } = useCharacter();
    if (!character) return null;
    const { hp } = character;
    const [adjustment, setAdjustment] = useState<number | ''>('');

    const handleDamage = () => {
        const damage = Number(adjustment) || 0;
        if (damage <= 0) return;

        const damageToTemp = Math.min(damage, hp.temporary);
        const newTemporary = hp.temporary - damageToTemp;
        const remainingDamage = damage - damageToTemp;
        const newCurrent = Math.max(0, hp.current - remainingDamage);

        updateCharacter({ hp: { ...hp, current: newCurrent, temporary: newTemporary } });
        setAdjustment('');
    };

    const handleHeal = () => {
        const healing = Number(adjustment) || 0;
        if (healing <= 0) return;

        const newCurrent = Math.min(hp.max, hp.current + healing);

        updateCharacter({ hp: { ...hp, current: newCurrent } });
        setAdjustment('');
    };

    const handleSetTempHp = () => {
        const amount = Number(adjustment);
        if (!isNaN(amount) && amount >= 0) {
            updateCharacter({ hp: { ...hp, temporary: amount } });
            setAdjustment('');
        }
    };

    const hpPercentage = hp.max > 0 ? (hp.current / hp.max) * 100 : 100;
    const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 space-y-6">
            <h3 className="text-xl font-cinzel text-accent flex items-center justify-center gap-2">
                <HeartIcon className="w-5 h-5 text-destructive" />
                Hit Points
            </h3>

            <div className="flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-foreground drop-shadow-md">{hp.current}</span>
                    <span className="text-2xl text-muted-foreground/60 font-semibold italic">/ {hp.max}</span>
                </div>
                {hp.temporary > 0 && (
                    <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/30 flex items-center gap-1.5 animate-in zoom-in duration-300">
                        <PlusIcon className="w-3.5 h-3.5" />
                        {hp.temporary} Temporary
                    </div>
                )}
            </div>

            <div className="relative w-full bg-background/40 rounded-full h-4 overflow-hidden border border-border/20 shadow-inner">
                <div
                    className={`${hpColor} h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(var(--color-hp),0.5)]`}
                    style={{ width: `${hpPercentage}%` }}
                >
                    <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent" />
                </div>
            </div>

            <div className="space-y-4">
                <StatInput
                    value={adjustment}
                    onChange={(val) => setAdjustment(val === '' ? '' : Number(val))}
                    placeholder="Enter amount..."
                    inputClassName="text-3xl font-mono text-center bg-background/20"
                    showModifier={false}
                />

                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={handleDamage}
                        className="flex flex-col items-center gap-1 p-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl border border-red-600/30 transition-all active:scale-95 group"
                    >
                        <MinusIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Damage</span>
                    </button>
                    <button
                        onClick={handleHeal}
                        className="flex flex-col items-center gap-1 p-3 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white rounded-xl border border-green-600/30 transition-all active:scale-95 group"
                    >
                        <PlusIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Heal</span>
                    </button>
                    <button
                        onClick={handleSetTempHp}
                        className="flex flex-col items-center gap-1 p-3 bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl border border-blue-600/30 transition-all active:scale-95 group"
                    >
                        <HeartIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Temp</span>
                    </button>
                </div>
            </div>
        </div>
    );
};