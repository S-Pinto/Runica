import React from 'react';
import { useCharacter } from '../CharacterProvider';

/** Handler generico per input/textarea/select: aggiorna il campo `name` del personaggio (i numeri sono convertiti). */
export const useFieldChange = () => {
    const { character, updateCharacter } = useCharacter();
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!character) return;
        const { name, value, type } = e.target;
        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = parseInt(value) || 0;
        }
        updateCharacter({ [name]: processedValue });
    };
};
