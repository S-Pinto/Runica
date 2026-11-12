// Campagne dell'utente: condivise su Firestore se loggato, locali (solo browser) altrimenti.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ICampaign, ILocalCampaign } from '../features/character/characterTypes';
import * as campaignService from '../services/campaignService';
import { useAuth } from './AuthProvider';
import { describeDataError } from '../lib/errors';

interface ICampaignContext {
    /** Campagne condivise di cui l'utente è membro (vuote se non loggato). */
    campaigns: ICampaign[];
    /** Campagne salvate solo su questo dispositivo. */
    localCampaigns: ILocalCampaign[];
    loading: boolean;
    loadError: string | null;
    /** Nome per id, per campagne condivise e locali. */
    campaignNames: ReadonlyMap<string, string>;
    refreshLocalCampaigns: () => void;
}

const CampaignContext = createContext<ICampaignContext | undefined>(undefined);

export const useCampaigns = () => {
    const context = useContext(CampaignContext);
    if (!context) throw new Error('useCampaigns must be used within a CampaignProvider');
    return context;
};

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid ?? null;
    const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
    const [localCampaigns, setLocalCampaigns] = useState<ILocalCampaign[]>(() => campaignService.getLocalCampaigns());
    const [loading, setLoading] = useState(!!uid);
    const [loadError, setLoadError] = useState<string | null>(null);

    const refreshLocalCampaigns = useCallback(() => setLocalCampaigns(campaignService.getLocalCampaigns()), []);

    useEffect(() => {
        // Al cambio utente le campagne dell'account precedente non devono restare visibili.
        setCampaigns([]);
        setLoadError(null);
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        let active = true;
        let unsubscribe: () => void = () => undefined;
        try {
            unsubscribe = campaignService.onCampaignsSnapshot(
                uid,
                (list) => {
                    if (!active) return;
                    setCampaigns([...list].sort((a, b) => a.name.localeCompare(b.name)));
                    setLoadError(null);
                    setLoading(false);
                },
                (error) => {
                    if (!active) return;
                    setLoadError(describeDataError(error, 'Impossibile caricare le campagne.'));
                    setLoading(false);
                },
            );
        } catch (error) {
            // Firebase non inizializzato: si lavora in modalità locale.
            console.warn('Campagne condivise non disponibili', error);
            setLoading(false);
        }
        return () => {
            active = false;
            unsubscribe();
        };
    }, [uid]);

    const campaignNames = useMemo(() => {
        const names = new Map<string, string>();
        localCampaigns.forEach((c) => names.set(c.id, c.name));
        campaigns.forEach((c) => names.set(c.id, c.name));
        return names;
    }, [campaigns, localCampaigns]);

    const value = useMemo(
        () => ({ campaigns, localCampaigns, loading, loadError, campaignNames, refreshLocalCampaigns }),
        [campaigns, localCampaigns, loading, loadError, campaignNames, refreshLocalCampaigns],
    );

    return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
};
