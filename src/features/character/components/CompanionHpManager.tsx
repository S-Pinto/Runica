import React, { useState } from 'react';
import { HeartIcon, PlusIcon, MinusIcon } from '../../../components/ui/icons';
import { StatInput } from './StatInput';

interface HpData {
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
    const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-3">
            <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-muted-foreground text-sm uppercase">Punti Ferita</span>
                <div>
                    <span>{hp.current}</span>
                    {hp.temporary > 0 && <span className="text-blue-400"> + {hp.temporary}</span>}
                    <span className="text-muted-foreground"> / {hp.max || '??'}</span>
                </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
                <div className={`${hpColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                <StatInput
                    value={adjustment}
                    onChange={(val) => setAdjustment(val === '' ? '' : Number(val))}
                    placeholder="Valore"
                    inputClassName="w-16"
                    showModifier={false}
                />
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => handleApply(-(Number(adjustment) || 0))} className="flex-1 sm:flex-auto flex items-center justify-center gap-2 px-3 py-2 bg-red-800/50 text-red-200 font-bold rounded-lg shadow-md hover:bg-red-700/60 transition-colors">
                        <MinusIcon className="w-5 h-5" /> Danno
                    </button>
                    <button onClick={() => handleApply(Number(adjustment) || 0)} className="flex-1 sm:flex-auto flex items-center justify-center gap-2 px-3 py-2 bg-green-800/50 text-green-200 font-bold rounded-lg shadow-md hover:bg-green-700/60 transition-colors">
                        <PlusIcon className="w-5 h-5" /> Cura
                    </button>
                    <button onClick={handleTempHp} className="flex-1 sm:flex-auto flex items-center justify-center gap-2 px-3 py-2 bg-blue-800/50 text-blue-200 font-bold rounded-lg shadow-md hover:bg-blue-700/60 transition-colors">
                        <HeartIcon className="w-5 h-5" /> Temp
                    </button>
                </div>
            </div>
        </div>
    );
};