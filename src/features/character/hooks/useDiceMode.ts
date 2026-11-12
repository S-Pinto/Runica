import { useState, useEffect } from 'react';

type DiceMode = 'dock' | 'modal';

const readDiceMode = (): DiceMode => (localStorage.getItem('runica_dice_mode') as DiceMode) || 'dock';

/** Modalità della dadiera (fissa in basso o in finestra), salvata nel browser e sincronizzata tra schede. */
export const useDiceMode = (): DiceMode => {
    const [diceMode, setDiceMode] = useState<DiceMode>('dock');

    useEffect(() => {
        setDiceMode(readDiceMode());

        const handleStorageChange = () => setDiceMode(readDiceMode());
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return diceMode;
};
