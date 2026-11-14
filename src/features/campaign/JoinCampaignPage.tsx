import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import * as campaignService from '../../services/campaignService';
import { describeDataError } from '../../lib/errors';
import { Button, buttonClass } from '../../components/ui/Button';
import { ArrowLeftIcon, UserGroupIcon } from '../../components/ui/icons';
import type { ICampaignInvite } from '../character/characterTypes';
import { formatInviteCode, normalizeInviteCode } from '../character/rules/campaign';
import { CampaignJoinForm } from '../character/components/campaign/CampaignJoinForm';
import { PlaySection } from '../character/components/play-view/PlaySection';

type JoinState =
    | { kind: 'idle' }
    | { kind: 'resolving' }
    | { kind: 'ready'; invite: ICampaignInvite; alreadyMember: boolean }
    | { kind: 'error'; message: string };

const describeJoinError = (error: unknown, fallback: string) =>
    error instanceof campaignService.CampaignError ? error.message : describeDataError(error, fallback);

/** Pagina del link d'invito: `/campaigns/join?code=RUN-X7K9AB`. */
export const JoinCampaignPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const rawCode = searchParams.get('code') ?? '';
    const [state, setState] = useState<JoinState>({ kind: 'idle' });
    const [joining, setJoining] = useState(false);
    const uid = currentUser?.uid ?? null;

    useEffect(() => {
        if (!uid || !rawCode) {
            setState({ kind: 'idle' });
            return;
        }
        let active = true;
        setState({ kind: 'resolving' });
        (async () => {
            try {
                const invite = await campaignService.resolveInvite(rawCode);
                const alreadyMember = await campaignService.isMemberOf(invite.campaignId, uid);
                if (active) setState({ kind: 'ready', invite, alreadyMember });
            } catch (error) {
                if (active) setState({ kind: 'error', message: describeJoinError(error, 'Impossibile verificare l\'invito.') });
            }
        })();
        return () => {
            active = false;
        };
    }, [uid, rawCode]);

    const openCampaign = (campaignId: string, pickCharacter: boolean) =>
        navigate(`/campaigns/${campaignId}`, { replace: true, state: pickCharacter ? { pickCharacter: true } : undefined });

    const handleJoin = async (invite: ICampaignInvite) => {
        if (!currentUser || joining) return;
        setJoining(true);
        try {
            const campaign = await campaignService.joinCampaignByCode(
                { uid: currentUser.uid, displayName: currentUser.displayName || currentUser.email || 'Giocatore', photoURL: currentUser.photoURL },
                invite,
            );
            openCampaign(campaign.id, true);
        } catch (error) {
            if (error instanceof campaignService.CampaignError && error.code === 'already-member') {
                openCampaign(invite.campaignId, false);
                return;
            }
            setState({ kind: 'error', message: describeJoinError(error, 'Impossibile unirsi alla campagna.') });
        } finally {
            setJoining(false);
        }
    };

    const loginHref = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
    const shownCode = rawCode ? formatInviteCode(normalizeInviteCode(rawCode)) : '';

    return (
        <div className="mx-auto max-w-lg space-y-5 p-4 sm:py-10">
            <Link to="/" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
                <ArrowLeftIcon className="h-4 w-4" /> I tuoi eroi
            </Link>

            <PlaySection title="Invito a una campagna" icon={<UserGroupIcon />}>
                {!uid ? (
                    <div className="space-y-4">
                        <p className="text-sm leading-relaxed text-text">
                            {shownCode ? <>Hai ricevuto l'invito <span className="font-mono font-bold text-foreground">{shownCode}</span>. </> : null}
                            Accedi per unirti al gruppo: le campagne condivise richiedono un account.
                        </p>
                        <Link to={loginHref} className={buttonClass('primary', 'lg', 'w-full')}>Accedi per unirti</Link>
                    </div>
                ) : !rawCode ? (
                    <CampaignJoinForm onJoin={async (code) => setSearchParams({ code: formatInviteCode(normalizeInviteCode(code)) })} />
                ) : state.kind === 'resolving' || state.kind === 'idle' ? (
                    <p className="py-4 text-center text-sm text-muted-foreground" role="status">Verifico l'invito {shownCode}…</p>
                ) : state.kind === 'error' ? (
                    <div className="space-y-4">
                        <p role="alert" className="text-sm text-destructive">{state.message}</p>
                        <Button variant="secondary" className="w-full" onClick={() => setSearchParams({})}>Inserisci un altro codice</Button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-2xl bg-background/50 p-4">
                            <p className="text-label uppercase text-muted-foreground">Campagna</p>
                            <p className="mt-1 break-words font-cinzel text-2xl font-bold text-foreground">{state.invite.campaignName || 'Campagna senza nome'}</p>
                            {state.invite.dmName && <p className="mt-1 text-sm text-muted-foreground">Dungeon Master: {state.invite.dmName}</p>}
                            <p className="mt-3 font-mono text-sm tracking-widest text-muted-foreground">{formatInviteCode(state.invite.code)}</p>
                        </div>
                        {state.alreadyMember ? (
                            <Button size="lg" className="w-full" onClick={() => openCampaign(state.invite.campaignId, false)}>
                                Sei già nel gruppo · Apri la campagna
                            </Button>
                        ) : (
                            <Button size="lg" className="w-full" disabled={joining} onClick={() => void handleJoin(state.invite)}>
                                {joining ? 'Entro…' : 'Unisciti al gruppo'}
                            </Button>
                        )}
                    </div>
                )}
            </PlaySection>
        </div>
    );
};
