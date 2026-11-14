import { useEffect, useMemo, useState } from 'react';
import * as campaignService from '../../../services/campaignService';
import { describeDataError } from '../../../lib/errors';
import type { CampaignRole, ICampaign, ICampaignMember, IDmAction, ILiveStats, ISharedCharacter } from '../../character/characterTypes';
import { canReadPartyLiveStats } from '../../character/rules/campaign';

export interface CampaignLive {
    members: ICampaignMember[];
    shared: ISharedCharacter[];
    /** Numeri dal vivo: tutto il gruppo (DM o modalità numerica) oppure solo i propri personaggi. */
    liveById: ReadonlyMap<string, ILiveStats>;
    /** Azioni del DM non scadute (solo per il DM: la board mostra "in attesa"). */
    actions: IDmAction[];
    /** false se i dati vengono dalla cache locale (offline o server non raggiungibile). */
    isLive: boolean;
    error: string | null;
}

const useOnline = () => {
    const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
    useEffect(() => {
        const update = () => setOnline(navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);
    return online;
};

/**
 * Abbonamenti in tempo reale di una campagna: membri, riepiloghi, numeri dal vivo e (per il DM) azioni attive.
 * In modalità narrativa un giocatore legge solo i propri `liveStats`: i numeri degli altri non arrivano nemmeno al client.
 */
export const useCampaignLive = (campaign: ICampaign | null | undefined, role: CampaignRole | null, uid: string | null): CampaignLive => {
    const campaignId = campaign?.id ?? null;
    const [members, setMembers] = useState<ICampaignMember[]>([]);
    const [shared, setShared] = useState<ISharedCharacter[]>([]);
    const [live, setLive] = useState<ILiveStats[]>([]);
    const [fromCache, setFromCache] = useState(false);
    const [actions, setActions] = useState<IDmAction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const online = useOnline();

    const isMember = !!campaignId && !!role;
    const liveScope = campaign && role ? (canReadPartyLiveStats(campaign, role) ? 'party' : 'own') : null;

    useEffect(() => {
        if (!campaignId || !isMember) return;
        setError(null);
        const fail = (e: unknown) => setError(describeDataError(e, 'Impossibile caricare i dati della campagna.'));
        const stopMembers = campaignService.onCampaignMembersSnapshot(campaignId, setMembers, fail);
        const stopShared = campaignService.onSharedCharactersSnapshot(campaignId, setShared, fail);
        return () => {
            stopMembers();
            stopShared();
        };
    }, [campaignId, isMember]);

    useEffect(() => {
        if (!campaignId || !liveScope || !uid) return;
        setLive([]);
        return campaignService.onLiveStatsSnapshot(
            campaignId,
            liveScope === 'own' ? uid : null,
            (stats, cached) => {
                setLive(stats);
                setFromCache(cached);
            },
            (e) => console.warn('Numeri dal vivo non disponibili', e),
        );
    }, [campaignId, liveScope, uid]);

    useEffect(() => {
        if (!campaignId || role !== 'dm') {
            setActions([]);
            return;
        }
        return campaignService.onDmActionsSnapshot(campaignId, Date.now(), setActions, (e) => console.warn('Azioni del DM non disponibili', e));
    }, [campaignId, role]);

    const liveById = useMemo(() => new Map(live.map((s) => [s.id, s])), [live]);

    return { members, shared, liveById, actions, isLive: online && !fromCache, error };
};
