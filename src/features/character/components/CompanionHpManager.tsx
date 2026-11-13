import React, { useState } from 'react';
import { HeartIcon, PlusIcon, MinusIcon } from '../../../components/ui/icons';
import { StatInput } from './StatInput';
import { hpActionClass } from './play-view/hpActions';

export interface HpData {
    current: number;
    max: number;
    temporary: number;
}

interface CompanionHpManagerProps {
    hp: HpData;
    onHpChange: (newHp: HpData) => void;
}

export const CompanionHpManager: React.FC<CompanionHpManagerProps> = ({ hp, onHpChange }) => {
    const [adjustment, setAdjustment] = useState<number | ''>('');

    const handleApply = (amount: number) => {
        if (isNaN(amount) || amount === 0) return;

        let newCurrent = hp.current;
        let newTemporary = hp.temporary;

        if (amount < 0) { // Danno
            const damage = Math.abs(amount);
            if (newTemporary > 0) {
                const tempDamage = Math.min(damage, newTemporary);
                newTemporary -= tempDamage;
                newCurrent -= (damage - tempDamage);
            } else {
                newCurrent -= damage;
            }
        } else { // Cura
            newCurrent += amount;
        }

        newCurrent = Math.max(0, Math.min(newCurrent, hp.max || newCurrent));

        onHpChange({ ...hp, current: newCurrent, temporary: newTemporary });
        setAdjustment('');
    };

    const handleTempHp = () => {
        const amount = Number(adjustment);
        if (isNaN(amount) || amount < 0) return;
        onHpChange({ ...hp, temporary: Math.max(hp.temporary, amount) });
        setAdjustment('');
    };

    const hpPercentage = hp.max > 0 ? (hp.current / hp.max) * 100 : 100;
    const hpColor = hpPercentage > 50 ? 'bg-success' : hpPercentage > 25 ? 'bg-warning' : 'bg-destructive';

    return (
        <div className="frame-rune space-y-3 p-4">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-label uppercase text-muted-foreground">Punti vita</span>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground" aria-live="polite">
                    {hp.current}
                    {hp.temporary > 0 && <span className="text-accent"> +{hp.temporary}</span>}
                    <span className="text-base font-normal text-muted-foreground"> / {hp.max || '–'}</span>
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-input" role="progressbar" aria-label="Punti vita" aria-valuemin={0} aria-valuemax={hp.max} aria-valuenow={hp.current}>
                <div className={`${hpColor} h-full transition-[width] duration-300 ease-soft`} style={{ width: `${Math.min(100, hpPercentage)}%` }} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <StatInput
                    value={adjustment}
                    onChange={(val) => setAdjustment(val === '' ? '' : Number(val))}
                    placeholder="0"
                    className="sm:w-40 sm:shrink-0"
                />
                <div className="grid flex-1 grid-cols-3 gap-2">
                    <button type="button" onClick={() => handleApply(-(Number(adjustment) || 0))} className={`${hpActionClass.damage} h-11`}>
                        <MinusIcon className="h-4 w-4" /> Danno
                    </button>
                    <button type="button" onClick={() => handleApply(Number(adjustment) || 0)} className={`${hpActionClass.heal} h-11`}>
                        <PlusIcon className="h-4 w-4" /> Cura
                    </button>
                    <button type="button" onClick={handleTempHp} className={`${hpActionClass.temp} h-11`} title="Imposta i punti vita temporanei">
                        <HeartIcon className="h-4 w-4" /> Temp
                    </button>
                </div>
            </div>
        </div>
    );
};
