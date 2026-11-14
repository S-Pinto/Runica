import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { useCampaigns } from '../../providers/CampaignProvider';
import * as campaignService from '../../services/campaignService';
import { describeDataError } from '../../lib/errors';
import { buttonClass } from '../../components/ui/Button';
import type { ICampaign } from '../character/characterTypes';
import { getRole } from '../character/rules/campaign';
import { useCampaignLive } from './hooks/useCampaignLive';
import { DmLiveBoard } from './DmLiveBoard';
import { PartyHub } from './PartyHub';

const Notice = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-16 text-center text-muted-foreground">
        {children}
        <Link to="/" className="inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">Torna ai tuoi eroi</Link>
    </div>
);

const Loading = () => (
    <div className="mx-auto max-w-7xl space-y-4 p-3 sm:p-6" aria-busy="true" aria-label="Caricamento campagna">
        <div className="h-28 animate-pulse rounded-3xl bg-muted/30" />
        <div className="h-12 animate-pulse rounded-full bg-muted/20" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted/20" />)}
        </div>
    </div>
);

/** `undefined` = in attesa del primo snapshot, `null` = non esiste o non si è membri. */
type CampaignState = ICampaign | null | undefined;

/** `/campaigns/:id`: smista per ruolo fra la Live Board del DM e il Party Hub del giocatore. */
export const CampaignPage = () => {
    const { campaignId } = useParams<{ campaignId: string }>();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { campaigns } = useCampaigns();
    const [direct, setDirect] = useState<CampaignState>(undefined);
    const [error, setError] = useState<string | null>(null);

    const uid = currentUser?.uid ?? null;
    // L'elenco in tempo reale arriva dal provider; subito dopo l'unione può non averla ancora,
    // quindi si ascolta anche il documento della campagna direttamente.
    const campaign: CampaignState = campaigns.find((c) => c.id === campaignId) ?? direct;
    const role = campaign ? getRole(campaign, uid) : null;
    const live = useCampaignLive(campaign, role, uid);

    useEffect(() => {
        if (!campaignId || !uid) return;
        setDirect(undefined);
        return campaignService.onCampaignSnapshot(campaignId, setDirect, (e) => {
            setDirect(null);
            setError(describeDataError(e, 'Impossibile caricare la campagna.'));
        });
    }, [campaignId, uid]);

    if (!uid || !currentUser) {
        return (
            <Notice>
                <p>Accedi per vedere le campagne condivise.</p>
                <p><Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className={buttonClass('primary')}>Accedi</Link></p>
            </Notice>
        );
    }
    if (campaign === undefined) return <Loading />;
    if (!campaign || !role) {
        return <Notice><p>{error ?? 'Campagna non trovata, oppure non ne fai parte.'}</p></Notice>;
    }

    const user = { uid, displayName: currentUser.displayName || 'Giocatore', photoURL: currentUser.photoURL };
    return role === 'dm'
        ? <DmLiveBoard campaign={campaign} user={user} live={live} />
        : <PartyHub campaign={campaign} user={user} live={live} />;
};
