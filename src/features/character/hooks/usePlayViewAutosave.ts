import { useEffect, useRef, useCallback } from 'react';
import * as characterRepository from '../characterRepository';
import type { ICharacter } from '../characterTypes';
import { toast } from '../../../components/ui/Dialogs';
import { describeDataError } from '../../../lib/errors';

/**
 * Salvataggio automatico della vista di gioco: ogni modifica viene salvata dopo 1,5 s
 * di quiete, e l'ultima modifica viene salvata anche quando si lascia la pagina.
 */
export const usePlayViewAutosave = (character: ICharacter | null) => {
    const isInitialMount = useRef(true);
    const pendingSave = useRef<ICharacter | null>(null);
    const saveFailed = useRef(false);

    const flushSave = useCallback(() => {
        const toSave = pendingSave.current;
        if (!toSave) return;
        pendingSave.current = null;
        characterRepository.saveCharacter(toSave).then(
            () => { saveFailed.current = false; },
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
