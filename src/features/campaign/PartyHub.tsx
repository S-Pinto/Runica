import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ICampaign } from '../character/characterTypes';
import type { CampaignUser } from '../../services/campaignService';
import { PillTabBar, type PillTab } from '../character/components/play-view/PillTabBar';
import { PlaySection, playEmptyClass, playGroupTitleClass } from '../character/components/play-view/PlaySection';
import { RuneDivider } from '../../components/ui/RuneDivider';
import { Button, buttonClass } from '../../components/ui/Button';
import { ArrowRightIcon, ChatBubbleIcon, ChevronDownIcon, LogoutIcon, PlayIcon, UserCircleIcon, UserGroupIcon } from '../../components/ui/icons';
import { useNow } from '../../hooks/useNow';
import { getCampaignSettings } from '../character/rules/campaign';
import type { CampaignLive } from './hooks/useCampaignLive';
import { useCampaignAdmin } from './hooks/useCampaignAdmin';
import { useTabParam } from './hooks/useTabParam';
import { CampaignHero } from './components/CampaignHero';
import { CampaignBoard } from './components/CampaignBoard';
import { CharacterPickerModal } from './components/CharacterPickerModal';
import { PartyMemberTile } from './components/PartyMemberTile';

type HubTab = 'party' | 'board';

const HUB_TABS: PillTab<HubTab>[] = [
    { key: 'party', label: 'Gruppo', icon: UserGroupIcon },
    { key: 'board', label: 'Bacheca', icon: ChatBubbleIcon },
];

interface PartyHubProps {
    campaign: ICampaign;
    user: CampaignUser;
    live: CampaignLive;
}

/**
 * Vista del giocatore: il proprio eroe in cima, poi i compagni (numeri o solo stato narrativo,
 * secondo le impostazioni del DM), cambio rapido del personaggio iscritto e bacheca.
 */
export const PartyHub = ({ campaign, user, live }: PartyHubProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const now = useNow();
    const [tab, setTab] = useTabParam<HubTab>(HUB_TABS.map((t) => t.key), 'party');
    const [pickerOpen, setPickerOpen] = useState(() => !!(location.state as { pickCharacter?: boolean } | null)?.pickCharacter);
    const admin = useCampaignAdmin(campaign, user.uid, user.displayName);
    const narrative = getCampaignSettings(campaign).partyVitals === 'narrative';

    const ownerNames = useMemo(() => new Map(live.members.map((m) => [m.uid, m.displayName])), [live.members]);
    const activeId = live.members.find((m) => m.uid === user.uid)?.activeCharacterId;
    const mine = useMemo(
        () => live.shared.filter((c) => c.ownerUid === user.uid).sort((a, b) => Number(b.id === activeId) - Number(a.id === activeId)),
        [live.shared, user.uid, activeId],
    );
    const companions = useMemo(
        () => live.shared.filter((c) => c.ownerUid !== user.uid).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
        [live.shared, user.uid],
    );
    const seated = mine[0];

    const seat = seated ? (
        <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={`Siedi come ${seated.name || 'il tuo eroe'}: cambia personaggio`}
            className="-mx-1 inline-flex min-h-8 min-w-0 max-w-full items-center gap-1 rounded-lg px-1 text-text transition-colors duration-150 hover:bg-foreground/5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span className="min-w-0 truncate">siedi come <span className="font-semibold">{seated.name || 'Senza nome'}</span></span>
            <ChevronDownIcon aria-hidden className="h-4 w-4 shrink-0" />
        </button>
    ) : <span>nessun eroe al tavolo</span>;

    return (
        <div className="mx-auto max-w-7xl space-y-3 p-3 pb-28 sm:space-y-4 sm:p-6 sm:pb-28">
            <CampaignHero
                campaign={campaign}
                role="player"
                isLive={live.isLive}
                detail={seat}
                onBack={() => navigate('/')}
                primary={seated ? (
                    <Link to={`/character/${seated.id}`} className={buttonClass('primary', 'md', 'flex-1 sm:flex-none')}>
                        <PlayIcon className="h-4 w-4" /> La mia scheda
                    </Link>
                ) : (
                    <Button onClick={() => setPickerOpen(true)} className="flex-1 sm:flex-none">
                        <UserCircleIcon className="h-4 w-4" /> Scegli l'eroe
                    </Button>
                )}
                menuItems={[
                    { label: 'Cambia personaggio', icon: <UserCircleIcon className="h-4 w-4" />, onSelect: () => setPickerOpen(true) },
                    { label: 'Abbandona la campagna', icon: <LogoutIcon className="h-4 w-4" />, onSelect: () => void admin.leave(), destructive: true },
                ]}
            />

            <PillTabBar tabs={HUB_TABS} activeTab={tab} onChange={setTab} tabId={(k) => `hub-tab-${k}`} panelId={(k) => `hub-panel-${k}`} />

            {live.error && <p role="alert" className="text-sm text-destructive">{live.error}</p>}

            <div role="tabpanel" id={`hub-panel-${tab}`} aria-labelledby={`hub-tab-${tab}`} className="animate-fadeIn space-y-3 sm:space-y-4">
                {tab === 'party' && (
                    <>
                        {campaign.description && (
                            <PlaySection title="La campagna">
                                <p className="whitespace-pre-line text-sm leading-relaxed text-text">{campaign.description}</p>
                            </PlaySection>
                        )}
                        {mine.length === 0 ? (
                            <PlaySection>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className={playGroupTitleClass}>Con chi siedi al tavolo?</p>
                                        <p className="text-sm text-muted-foreground">Associa uno dei tuoi eroi: il DM e il gruppo lo vedranno qui, aggiornato mentre giochi.</p>
                                    </div>
                                    <Button onClick={() => setPickerOpen(true)}>Scegli il personaggio</Button>
                                </div>
                            </PlaySection>
                        ) : (
                            <ul className="grid gap-3 sm:gap-4 md:grid-cols-2">
                                {mine.map((c) => (
                                    <li key={c.id} className="min-w-0">
                                        <PartyMemberTile
                                            character={c}
                                            live={live.liveById.get(c.id)}
                                            isMine
                                            now={now}
                                            onOpen={() => navigate(`/character/${c.id}`)}
                                            openLabel={`Apri la scheda di ${c.name || 'Senza nome'}`}
                                            footer={
                                                <Link to={`/character/${c.id}`} className={buttonClass('secondary', 'md', 'w-full')}>
                                                    Apri la tua scheda <ArrowRightIcon className="h-4 w-4" />
                                                </Link>
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <h2 className={playGroupTitleClass}>I compagni</h2>
                            <span className="text-xs text-muted-foreground">{narrative ? 'stato narrativo' : 'dal vivo'}</span>
                        </div>
                        <RuneDivider glyph="notch" />
                        {companions.length === 0 ? (
                            <p className={playEmptyClass}>Nessun compagno al tavolo per ora.</p>
                        ) : (
                            <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {companions.map((c) => (
                                    <li key={c.id} className="min-w-0">
                                        <PartyMemberTile
                                            character={c}
                                            // In modalità narrativa le regole non permettono nemmeno di leggerli: qui restano comunque fuori.
                                            live={narrative ? undefined : live.liveById.get(c.id)}
                                            ownerName={ownerNames.get(c.ownerUid)}
                                            now={now}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
                {tab === 'board' && <CampaignBoard campaign={campaign} role="player" user={user} now={now} />}
            </div>

            <CharacterPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} campaign={campaign} />
        </div>
    );
};
