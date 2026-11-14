import { useMemo, useState } from 'react';
import type { DmActionType, IDmAction, ISharedCharacter } from '../../character/characterTypes';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import { playEmptyClass } from '../../character/components/play-view/PlaySection';
import * as campaignService from '../../../services/campaignService';
import { describeDataError } from '../../../lib/errors';
import { buildDmAction, pendingActionsFor, sortParty, type PartySort } from '../../character/rules/campaign';
import type { CampaignLive } from '../hooks/useCampaignLive';
import { DmActionBar } from './DmActionBar';
import { PartyMemberTile } from './PartyMemberTile';
import { PartyMemberDetail } from './PartyMemberDetail';

interface DmTableTabProps {
    campaignId: string;
    uid: string;
    live: CampaignLive;
    now: number;
}

const SORT_OPTIONS = [
    { value: 'name', label: 'Nome' },
    { value: 'hp', label: 'PF più bassi' },
] as const;

const heroes = (n: number) => (n === 1 ? '1 eroe' : `${n} eroi`);

const CONFIRM: Partial<Record<DmActionType, { title: string; message: string; confirmLabel: string }>> = {
    longRest: {
        title: 'Dichiarare un riposo lungo?',
        message: 'Ogni giocatore lo riceve sulla propria scheda (PF, slot, dadi vita e risorse ripristinati) e può annullarlo.',
        confirmLabel: 'Dichiara riposo lungo',
    },
    shortRest: {
        title: 'Dichiarare un riposo breve?',
        message: 'Ogni giocatore riceve l\'invito a riposare: sceglie lui quanti dadi vita spendere.',
        confirmLabel: 'Dichiara riposo breve',
    },
};

/** Scheda "Tavolo" della Live Board: azioni rapide, ordinamento e tessere del gruppo in tempo reale. */
export const DmTableTab = ({ campaignId, uid, live, now }: DmTableTabProps) => {
    const { shared, liveById, actions, members } = live;
    const [sort, setSort] = useState<PartySort>('name');
    const [detailId, setDetailId] = useState<string | null>(null);
    const ownerNames = useMemo(() => new Map(members.map((m) => [m.uid, m.displayName])), [members]);
    const party = useMemo(() => sortParty(shared, sort, liveById), [shared, sort, liveById]);
    const detail = shared.find((c) => c.id === detailId) ?? null;

    const send = async (type: DmActionType, targets: string[]) => {
        if (targets.length === 0) return;
        const names = targets.length === 1 ? shared.find((c) => c.id === targets[0])?.name || 'l\'eroe' : heroes(targets.length);
        const confirm = CONFIRM[type];
        if (confirm && !(await confirmDialog({ ...confirm, title: targets.length === 1 ? `${confirm.title.replace('?', '')} per ${names}?` : confirm.title }))) return;
        try {
            await campaignService.sendDmAction(campaignId, buildDmAction(type, targets, uid, Date.now()));
            toast.success(`Inviato a ${names}.`);
        } catch (error) {
            toast.error(describeDataError(error, 'Impossibile inviare l\'azione.'));
        }
    };

    const toggleInspiration = (character: ISharedCharacter) => {
        const inspired = liveById.get(character.id)?.heroicInspiration ?? character.heroicInspiration;
        void send(inspired ? 'revokeInspiration' : 'grantInspiration', [character.id]);
    };

    const cancel = async (action: IDmAction) => {
        try {
            await campaignService.deleteDmAction(campaignId, action.id);
        } catch (error) {
            toast.error(describeDataError(error, 'Impossibile ritirare l\'azione.'));
        }
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            <DmActionBar party={party} onAction={(type, targets) => void send(type, targets)} />

            {shared.length === 0 ? (
                <p className={playEmptyClass}>
                    Nessun eroe al tavolo. Condividi il link d'invito dalla scheda Gruppo: chi entra sceglie il proprio eroe e compare qui.
                </p>
            ) : (
                <>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground" role="status" aria-atomic="true">{heroes(shared.length)} al tavolo</p>
                        <SegmentedControl label="Ordina il gruppo" options={SORT_OPTIONS} value={sort} onChange={setSort} className="w-56 shrink-0" />
                    </div>
                    <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {party.map((c) => (
                            <li key={c.id} className="min-w-0">
                                <PartyMemberTile
                                    character={c}
                                    live={liveById.get(c.id)}
                                    ownerName={ownerNames.get(c.ownerUid)}
                                    isMine={c.ownerUid === uid}
                                    variant="full"
                                    pending={pendingActionsFor(c.id, actions, liveById.get(c.id), now)}
                                    now={now}
                                    onOpen={() => setDetailId(c.id)}
                                    onToggleInspiration={() => toggleInspiration(c)}
                                />
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <PartyMemberDetail
                character={detail}
                live={detail ? liveById.get(detail.id) : undefined}
                ownerName={detail ? ownerNames.get(detail.ownerUid) : undefined}
                pending={detail ? pendingActionsFor(detail.id, actions, liveById.get(detail.id), now) : []}
                now={now}
                onClose={() => setDetailId(null)}
                onAction={(type, targets) => void send(type, targets)}
                onCancelAction={(a) => void cancel(a)}
            />
        </div>
    );
};
