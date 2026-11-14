import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ICampaign } from '../character/characterTypes';
import type { CampaignUser } from '../../services/campaignService';
import { PillTabBar, type PillTab } from '../character/components/play-view/PillTabBar';
import { PlaySection } from '../character/components/play-view/PlaySection';
import { Button } from '../../components/ui/Button';
import { ChatBubbleIcon, EditIcon, LockIcon, SwordIcon, TrashIcon, UserGroupIcon, UserPlusIcon } from '../../components/ui/icons';
import { useNow } from '../../hooks/useNow';
import type { CampaignLive } from './hooks/useCampaignLive';
import { useCampaignAdmin } from './hooks/useCampaignAdmin';
import { useTabParam } from './hooks/useTabParam';
import { CampaignHero } from './components/CampaignHero';
import { CampaignEditModal } from './components/CampaignEditModal';
import { DmTableTab } from './components/DmTableTab';
import { DmNotesTab } from './components/DmNotesTab';
import { CampaignBoard } from './components/CampaignBoard';
import { InvitePanel } from './components/InvitePanel';
import { CampaignSettingsPanel } from './components/CampaignSettingsPanel';
import { MemberList } from './components/MemberList';

type DmTab = 'table' | 'board' | 'notes' | 'party';

const DM_TABS: PillTab<DmTab>[] = [
    { key: 'table', label: 'Tavolo', icon: SwordIcon },
    { key: 'board', label: 'Bacheca', icon: ChatBubbleIcon },
    { key: 'notes', label: 'Note segrete', icon: LockIcon },
    { key: 'party', label: 'Gruppo', icon: UserGroupIcon },
];

interface DmLiveBoardProps {
    campaign: ICampaign;
    user: CampaignUser;
    live: CampaignLive;
}

/** Schermo del DM al tavolo: PF, slot e condizioni del gruppo in tempo reale, azioni rapide, bacheca, note e gestione. */
export const DmLiveBoard = ({ campaign, user, live }: DmLiveBoardProps) => {
    const navigate = useNavigate();
    const now = useNow();
    const [tab, setTab] = useTabParam<DmTab>(DM_TABS.map((t) => t.key), 'table');
    const [editing, setEditing] = useState(false);
    const admin = useCampaignAdmin(campaign, user.uid, user.displayName, live.shared);
    const characterNames = useMemo(() => new Map(live.shared.map((c) => [c.id, c.name])), [live.shared]);
    const heroes = live.shared.length === 1 ? '1 eroe' : `${live.shared.length} eroi`;

    const openInvite = () => {
        setTab('party');
        requestAnimationFrame(() => document.getElementById('invite')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    return (
        <div className="mx-auto max-w-7xl space-y-3 p-3 pb-28 sm:space-y-4 sm:p-6 sm:pb-28">
            <CampaignHero
                campaign={campaign}
                role="dm"
                isLive={live.isLive}
                detail={<span>{heroes}</span>}
                onBack={() => navigate('/')}
                primary={
                    <Button variant="secondary" onClick={openInvite} className="flex-1 sm:flex-none">
                        <UserPlusIcon className="h-4 w-4" /> Invita
                    </Button>
                }
                menuItems={[
                    { label: 'Modifica nome e descrizione', icon: <EditIcon className="h-4 w-4" />, onSelect: () => setEditing(true) },
                    { label: 'Elimina campagna', icon: <TrashIcon className="h-4 w-4" />, onSelect: () => void admin.remove(), destructive: true },
                ]}
            />

            <PillTabBar tabs={DM_TABS} activeTab={tab} onChange={setTab} tabId={(k) => `dm-tab-${k}`} panelId={(k) => `dm-panel-${k}`} />

            {live.error && <p role="alert" className="text-sm text-destructive">{live.error}</p>}

            <div role="tabpanel" id={`dm-panel-${tab}`} aria-labelledby={`dm-tab-${tab}`} className="animate-fadeIn">
                {tab === 'table' && <DmTableTab campaignId={campaign.id} uid={user.uid} live={live} now={now} />}
                {tab === 'board' && <CampaignBoard campaign={campaign} role="dm" user={user} now={now} />}
                {tab === 'notes' && <DmNotesTab campaignId={campaign.id} now={now} />}
                {tab === 'party' && (
                    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                        <div className="space-y-3 sm:space-y-4">
                            <InvitePanel campaign={campaign} onRegenerateCode={admin.regenerateCode} />
                            <CampaignSettingsPanel campaign={campaign} onChange={(s) => void admin.changeSettings(s)} />
                        </div>
                        <PlaySection title={`Membri (${live.members.length})`} icon={<UserGroupIcon className="text-accent" />}>
                            {campaign.description && <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-text">{campaign.description}</p>}
                            <MemberList members={live.members} currentUid={user.uid} canManage onRemove={(m) => void admin.removeMember(m)} characterNames={characterNames} />
                        </PlaySection>
                    </div>
                )}
            </div>

            <CampaignEditModal key={campaign.updatedAt} campaign={campaign} open={editing} onClose={() => setEditing(false)} onSave={admin.save} />
        </div>
    );
};
