import { useEffect, useRef, useCallback } from 'react';
import * as characterRepository from '../characterRepository';
import type { ICharacter } from '../characterTypes';
import { toast } from '../../../components/ui/Dialogs';
import { describeDataError } from '../../../lib/errors';

/**
 * Salvataggio automatico della vista di gioco: ogni modifica viene salvata dopo 1,5 s
 * di quiete, e l'ultima modifica viene salvata anche quando si lascia la pagina.
 * `onSaved` riceve la scheda salvata: la vista di gioco la usa per aggiornare la campagna dal vivo.
 */
export const usePlayViewAutosave = (character: ICharacter | null, onSaved?: (saved: ICharacter) => void) => {
    const isInitialMount = useRef(true);
    const pendingSave = useRef<ICharacter | null>(null);
    const saveFailed = useRef(false);
    const onSavedRef = useRef(onSaved);
    onSavedRef.current = onSaved;

    const flushSave = useCallback(() => {
        const toSave = pendingSave.current;
        if (!toSave) return;
        pendingSave.current = null;
        characterRepository.saveCharacter(toSave).then(
            (saved) => {
                saveFailed.current = false;
                onSavedRef.current?.(saved);
            },
            (error) => {
                console.error('Autosave failed', error);
                // Un solo avviso per serie di fallimenti, per non spammare ogni 1,5 s.
                if (!saveFailed.current) {
                    toast.error(describeDataError(error, 'Salvataggio automatico non riuscito.'));
                }
                saveFailed.current = true;
            },
        );
    }, []);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (character) {
            pendingSave.current = character;
            const handler = setTimeout(() => flushSave(), 1500);
            return () => clearTimeout(handler);
        }
    }, [character, flushSave]);

    // Se si lascia la pagina entro il debounce, l'ultima modifica non va persa.
    useEffect(() => () => flushSave(), [flushSave]);
};
