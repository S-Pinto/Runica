import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { useCampaigns } from '../../../providers/CampaignProvider';
import * as campaignService from '../../../services/campaignService';
import { toast } from '../../../components/ui/Dialogs';
import { useCharacter } from '../CharacterProvider';
import type { ICharacter, IDmAction } from '../characterTypes';
import { appendAppliedAction, applyDmAction, pendingDmActions, undoPatchFor } from '../rules/campaign';

const playPath = (id: string) => `/character/${id}`;
const editPath = (id: string) => `/character/${id}/edit`;

/**
 * Applica sulla scheda del giocatore le azioni del DM (ispirazione, riposi) delle campagne in cui siede.
 * Le modifiche passano dallo stato del `CharacterProvider` (vista di gioco aperta → `updateCharacter`, così
 * l'autosave non le sovrascrive; altrimenti `saveCharacter`). Ogni azione gestita finisce in
 * `liveStats.appliedActionIds`, e la board del DM smette di mostrarla "in attesa".
 * Mentre l'editor di quel personaggio è aperto l'azione aspetta: il giocatore ha l'ultima parola.
 */
export const useCampaignActions = () => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid ?? null;
    const { campaigns } = useCampaigns();
    const { characters, character, updateCharacter, saveCharacter } = useCharacter();
    const location = useLocation();
    const navigate = useNavigate();

    const [actions, setActions] = useState<Record<string, IDmAction[]>>({});
    const [applied, setApplied] = useState<Record<string, string[]>>({});
    const [ready, setReady] = useState<Record<string, boolean>>({});

    // Ultimi valori per i callback asincroni (Annulla arriva secondi dopo).
    const latest = useRef({ characters, character, pathname: location.pathname, updateCharacter, saveCharacter });
    latest.current = { characters, character, pathname: location.pathname, updateCharacter, saveCharacter };
    const appliedRef = useRef(applied);
    appliedRef.current = applied;
    const handled = useRef(new Set<string>());

    const cloudIds = useMemo(() => new Set(campaigns.map((c) => c.id)), [campaigns]);
    const seatedKey = useMemo(
        () => [...new Set(characters.map((c) => c.campaignId).filter((id): id is string => !!id && cloudIds.has(id)))].sort().join('|'),
        [characters, cloudIds],
    );

    useEffect(() => {
        if (!uid || !seatedKey) return;
        const ids = seatedKey.split('|');
        const stops = ids.flatMap((campaignId) => [
            campaignService.onDmActionsSnapshot(campaignId, Date.now(), (list) => setActions((prev) => ({ ...prev, [campaignId]: list })),
                (e) => console.warn('Azioni del DM non disponibili', e)),
            campaignService.onLiveStatsSnapshot(campaignId, uid, (stats) => {
                setApplied((prev) => ({ ...prev, ...Object.fromEntries(stats.map((s) => [s.id, s.appliedActionIds || []])) }));
                setReady((prev) => ({ ...prev, [campaignId]: true }));
            }, (e) => console.warn('Stato delle azioni non disponibile', e)),
        ]);
        return () => stops.forEach((stop) => stop());
    }, [uid, seatedKey]);

    useEffect(() => {
        if (!uid) return;

        const apply = (id: string, patch: Partial<ICharacter>) => {
            const now = latest.current;
            if (now.pathname === playPath(id) && now.character?.id === id) {
                now.updateCharacter(patch);
                return;
            }
            const base = now.characters.find((c) => c.id === id);
            if (base) void now.saveCharacter({ ...base, ...patch, lastUpdated: Date.now() }).catch((e) => console.warn('Azione del DM non salvata', e));
        };

        const markApplied = (campaignId: string, characterId: string, actionId: string) => {
            const next = appendAppliedAction(appliedRef.current[characterId], actionId);
            appliedRef.current = { ...appliedRef.current, [characterId]: next };
            void campaignService.setAppliedActions(campaignId, characterId, next).catch((e) => console.warn('Stato dell\'azione non aggiornato', e));
        };

        Object.entries(actions).forEach(([campaignId, list]) => {
            if (!ready[campaignId]) return;
            const mine = new Set(characters.filter((c) => c.campaignId === campaignId).map((c) => c.id));
            const isApplied = (cid: string, aid: string) => handled.current.has(`${aid}:${cid}`) || (applied[cid] || []).includes(aid);
            pendingDmActions(list, mine, isApplied, Date.now()).forEach(({ action, characterId }) => {
                if (location.pathname === editPath(characterId)) return; // riprova all'uscita dall'editor
                const listed = characters.find((c) => c.id === characterId);
                if (!listed) return;
                const base = location.pathname === playPath(characterId) && character?.id === characterId ? character : listed;
                handled.current.add(`${action.id}:${characterId}`);
                markApplied(campaignId, characterId, action.id);

                const name = base.name || 'Il tuo eroe';
                const effect = applyDmAction(base, action.type);
                if (!effect) return;
                if (effect.kind === 'prompt') {
                    toast.action(`Il DM ha dichiarato un riposo breve per ${name}.`, {
                        label: 'Riposa',
                        onAction: () => navigate(`${playPath(characterId)}?rest=short`),
                    });
                    return;
                }
                const undo = undoPatchFor(base, effect.patch);
                apply(characterId, effect.patch);
                const message = action.type === 'longRest'
                    ? `Il DM ha dichiarato un riposo lungo: ${name} recupera PF, slot e risorse.`
                    : action.type === 'grantInspiration'
                        ? `Il DM ha concesso l'Ispirazione Eroica a ${name}.`
                        : `Il DM ha revocato l'Ispirazione Eroica a ${name}.`;
                toast.action(message, { label: 'Annulla', variant: 'success', onAction: () => apply(characterId, undo) });
            });
        });
    }, [uid, actions, applied, ready, characters, character, location.pathname, navigate]);
};
