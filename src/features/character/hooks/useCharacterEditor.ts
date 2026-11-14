import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { ICharacter } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { useCampaigns } from '../../../providers/CampaignProvider';
import * as characterRepository from '../characterRepository';
import { createNewCharacter } from '../rules/defaults';
import { resolveEditorTarget } from '../editorSession';
import { getModifier } from '../utils/characterUtils';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import { describeDataError } from '../../../lib/errors';

/**
 * Stato e ciclo di vita dell'editor della scheda: caricamento, modifiche non salvate,
 * guardia di uscita, salvataggio (anche con Ctrl+S) ed eliminazione.
 */
export const useCharacterEditor = (activeTab: string) => {
    const { characterId } = useParams<{ characterId: string }>();
    const navigate = useNavigate();
    const { character, setCharacter, deleteCharacter, saveCharacter } = useCharacter();
    const { campaignNames } = useCampaigns();
    const campaignNamesRef = useRef(campaignNames);
    campaignNamesRef.current = campaignNames;
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isNewCharacter = resolveEditorTarget(characterId).kind === 'new';
    const savedSnapshot = useRef<string | null>(null);
    const isDirty = !!character && savedSnapshot.current !== null && JSON.stringify(character) !== savedSnapshot.current;

    // Warn before closing the tab with unsaved edits.
    useEffect(() => {
        if (!isDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    // Ask before leaving the editor (back button, header logo, browser Back) with unsaved edits.
    const dirtyRef = useRef(false);
    dirtyRef.current = isDirty;
    const bypassGuard = useRef(false);
    const blocker = useBlocker(({ currentLocation, nextLocation }) =>
        !bypassGuard.current && dirtyRef.current && currentLocation.pathname !== nextLocation.pathname);
    useEffect(() => {
        if (blocker.state !== 'blocked') return;
        confirmDialog({
            title: 'Uscire senza salvare?',
            message: 'Le modifiche a questa scheda andranno perse.',
            confirmLabel: 'Esci senza salvare',
            cancelLabel: 'Continua a modificare',
            destructive: true,
        }).then((leave) => (leave ? blocker.proceed() : blocker.reset()));
    }, [blocker]);

    useEffect(() => {
        let isMounted = true;
        const loadCharacter = async () => {
            try {
                if (isMounted) setError(null);
                const target = resolveEditorTarget(characterId);
                // `/character/new?campaign=<id>` (dalla scelta del personaggio dopo l'unione): eroe già associato.
                const presetCampaignId = target.kind === 'new' ? new URLSearchParams(window.location.search).get('campaign') : null;
                const loadedData = target.kind === 'new'
                    ? {
                        ...createNewCharacter(),
                        ...(presetCampaignId
                            ? { campaignId: presetCampaignId, campaignName: campaignNamesRef.current.get(presetCampaignId) }
                            : {}),
                    }
                    : await characterRepository.getCharacter(target.id);

                if (!loadedData) {
                    if (isMounted) setError('Personaggio non trovato');
                    return;
                }

                // **MIGRAZIONE DATI**: Assicura che i personaggi vecchi abbiano le nuove proprietà.
                // Unisce i dati caricati con un personaggio "vuoto" per riempire i campi mancanti.
                const charData = { ...createNewCharacter(), ...loadedData };

                if (isMounted) {
                    savedSnapshot.current = JSON.stringify(charData);
                    setCharacter(charData);
                }
            } catch (err) {
                console.error("Failed to load character:", err);
                if (isMounted) setError(describeDataError(err, 'Impossibile caricare il personaggio'));
            }
        };
        loadCharacter();
        return () => {
            isMounted = false;
        };
    }, [characterId, setCharacter]);

    const proficiencyBonus = useMemo(() => {
        if (!character) return 0;
        return Math.ceil(character.level / 4) + 1;
    }, [character?.level]);

    const initiative = useMemo(() => {
        if (!character) return 0;
        return getModifier(character.abilityScores.dexterity);
    }, [character?.abilityScores.dexterity]);

    const handleSave = async () => {
        if (!character) return;
        setIsSaving(true);

        try {
            const id = isNewCharacter ? `char_${Date.now()}` : character.id;
            const charToSave: ICharacter = { ...character, id, proficiencyBonus, initiative, lastUpdated: Date.now() };
            const savedChar = await saveCharacter(charToSave);
            savedSnapshot.current = JSON.stringify(character);
            bypassGuard.current = true;
            toast.success('Scheda salvata.');

            navigate(`/character/${savedChar.id}?tab=${activeTab}`, { replace: isNewCharacter });
        } catch (err) {
            console.error("Failed to save character:", err);
            toast.error(describeDataError(err, 'Salvataggio non riuscito. Riprova.'));
        } finally {
            setIsSaving(false);
        }
    };

    const saveRef = useRef(handleSave);
    saveRef.current = handleSave;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveRef.current();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const handleDelete = async () => {
        if (!character) return;
        const confirmMessage = isNewCharacter
            ? { title: 'Scartare questo personaggio?', message: 'Le modifiche non verranno salvate.', confirmLabel: 'Scarta', destructive: true }
            : { title: `Eliminare ${character.name}?`, message: "L'azione non può essere annullata.", confirmLabel: 'Elimina', destructive: true };

        if (await confirmDialog(confirmMessage)) {
            try {
                await deleteCharacter(character.id);
                bypassGuard.current = true;
                navigate('/');
            } catch (err) {
                console.error("Failed to delete character:", err);
                toast.error(describeDataError(err, 'Eliminazione non riuscita.'));
            }
        }
    };

    const handleBack = () => {
        if (isNewCharacter) {
            navigate('/');
        } else if (character) {
            navigate(`/character/${character.id}?tab=${activeTab}`);
        } else {
            navigate(-1);
        }
    };

    return {
        character, error, isSaving, isDirty, isNewCharacter,
        proficiencyBonus, initiative,
        handleSave, handleDelete, handleBack,
    };
};
