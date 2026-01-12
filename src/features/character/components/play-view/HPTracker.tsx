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
            // I PF temporanei nuovi sostituiscono i vecchi, non si sommano.
            updateCharacter({ hp: { ...hp, temporary: amount } });
            setAdjustment('');
        }
    };

    const hpPercentage = hp.max > 0 ? (hp.current / hp.max) * 100 : 100;
    const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-card p-4 rounded-lg border border-border space-y-3">
            <h3 className="text-lg font-cinzel text-accent mb-3 text-center">Hit Points</h3>
            <div className="text-center mb-4">
                <span className="text-5xl font-bold text-destructive">{hp.current}</span>
                {hp.temporary > 0 && <span className="text-3xl font-bold text-accent" title="Temporary HP"> +{hp.temporary}</span>}
                <span className="text-2xl text-muted-foreground"> / {hp.max}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
                <div className={`${hpColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
            </div>
            {/* Layout reattivo: si adatta e va a capo se lo spazio non è sufficiente */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center gap-4 sm:gap-2">
                {/* StatInput ora occupa tutta la larghezza su mobile per massima visibilità */}
                <div className="w-full sm:flex-none">
                    <StatInput value={adjustment} onChange={(val) => setAdjustment(val === '' ? '' : Number(val))} placeholder="Value" inputClassName="text-3xl" showModifier={false} />
                </div>
                <div className="w-full sm:w-auto flex gap-2 justify-center">
                    <button onClick={handleDamage} className="flex-1 sm:flex-auto flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors"><MinusIcon className="w-5 h-5" /> Damage</button>
                    <button onClick={handleHeal} className="flex-1 sm:flex-auto flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"><PlusIcon className="w-5 h-5" /> Heal</button>
                    <button onClick={handleSetTempHp} className="flex-1 sm:flex-auto flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"><HeartIcon className="w-5 h-5" /> Temp</button>
                </div>
            </div>
        </div>
    );
};