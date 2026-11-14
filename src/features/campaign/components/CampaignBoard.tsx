import { useEffect, useMemo, useState } from 'react';
import type { CampaignRole, IBoardPost, ICampaign } from '../../character/characterTypes';
import * as campaignService from '../../../services/campaignService';
import type { CampaignUser } from '../../../services/campaignService';
import { describeDataError } from '../../../lib/errors';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import { Button } from '../../../components/ui/Button';
import { ChatBubbleIcon, PinIcon } from '../../../components/ui/icons';
import { fieldCheckRowClass, fieldControlOnTileClass } from '../../../components/ui/field';
import { PlaySection, playEmptyClass } from '../../character/components/play-view/PlaySection';
import { BOARD_POST_MAX, canDeletePost, canEditPost, canPostOnBoard, sortBoardPosts } from '../../character/rules/campaign';
import { BoardPostItem } from './BoardPostItem';

interface CampaignBoardProps {
    campaign: ICampaign;
    role: CampaignRole;
    user: CampaignUser;
    now: number;
}

/** Bacheca condivisa (DM e giocatori): avvisi fissati in alto, poi i messaggi più recenti. */
export const CampaignBoard = ({ campaign, role, user, now }: CampaignBoardProps) => {
    const [posts, setPosts] = useState<IBoardPost[] | null>(null);
    const [draft, setDraft] = useState('');
    const [pinned, setPinned] = useState(false);
    const [busy, setBusy] = useState(false);
    const canPost = canPostOnBoard(campaign, role);
    const isDm = role === 'dm';

    useEffect(() => {
        setPosts(null);
        return campaignService.onBoardSnapshot(campaign.id, setPosts, (error) => {
            setPosts([]);
            toast.error(describeDataError(error, 'Impossibile caricare la bacheca.'));
        });
    }, [campaign.id]);

    const sorted = useMemo(() => sortBoardPosts(posts ?? []), [posts]);

    const guard = async (action: () => Promise<void>, failure: string) => {
        try {
            await action();
        } catch (error) {
            toast.error(describeDataError(error, failure));
        }
    };

    const publish = async () => {
        if (!draft.trim() || busy) return;
        setBusy(true);
        await guard(async () => {
            await campaignService.createBoardPost(campaign.id, user, draft, isDm && pinned);
            setDraft('');
            setPinned(false);
        }, 'Messaggio non pubblicato.');
        setBusy(false);
    };

    const remove = async (post: IBoardPost) => {
        const ok = await confirmDialog({ title: 'Eliminare il messaggio?', message: 'Sparisce per tutto il gruppo.', confirmLabel: 'Elimina', destructive: true });
        if (ok) await guard(() => campaignService.deleteBoardPost(campaign.id, post.id), 'Impossibile eliminare il messaggio.');
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            {canPost ? (
                <PlaySection title={isDm ? 'Nuovo avviso' : 'Scrivi al gruppo'} icon={<ChatBubbleIcon className="text-accent" />}>
                    <form
                        className="space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void publish();
                        }}
                    >
                        <label htmlFor="board-draft" className="sr-only">Messaggio</label>
                        <textarea
                            id="board-draft"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            maxLength={BOARD_POST_MAX}
                            rows={3}
                            placeholder={isDm ? 'Prossima sessione venerdì alle 21. Portate i dadi vita!' : 'Un indizio, un appunto, una battuta…'}
                            className={`${fieldControlOnTileClass} resize-y leading-relaxed`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {isDm ? (
                                <label className={fieldCheckRowClass}>
                                    <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-5 w-5 rounded border-border-strong bg-background text-accent focus:ring-accent" />
                                    <PinIcon aria-hidden className="h-4 w-4 text-accent" /> Fissa in alto
                                </label>
                            ) : (
                                <span className="text-xs text-muted-foreground">{draft.length} / {BOARD_POST_MAX}</span>
                            )}
                            <Button type="submit" disabled={busy || !draft.trim()} className="ml-auto">Pubblica</Button>
                        </div>
                    </form>
                </PlaySection>
            ) : (
                <p className={playEmptyClass}>Il DM ha chiuso la bacheca ai giocatori: puoi leggere gli avvisi, ma non scrivere.</p>
            )}

            <PlaySection title="Bacheca" icon={<PinIcon className="text-accent" />} aside={posts && <span className="text-xs text-muted-foreground">{posts.length} messaggi</span>}>
                {posts === null ? (
                    <p className={playEmptyClass} role="status">Caricamento…</p>
                ) : sorted.length === 0 ? (
                    <p className={playEmptyClass}>Ancora niente in bacheca. {canPost ? 'Scrivi il primo messaggio.' : ''}</p>
                ) : (
                    <ul className="space-y-2" aria-live="polite">
                        {sorted.map((post) => (
                            <BoardPostItem
                                key={post.id}
                                post={post}
                                now={now}
                                isMine={post.authorUid === user.uid}
                                canEdit={canEditPost(post, user.uid)}
                                canDelete={canDeletePost(post, user.uid, role)}
                                canPin={isDm}
                                onEdit={(text) => guard(() => campaignService.editBoardPost(campaign.id, post.id, text), 'Modifica non salvata.')}
                                onTogglePin={() => void guard(() => campaignService.setBoardPostPinned(campaign.id, post.id, !post.pinned), 'Impossibile fissare il messaggio.')}
                                onDelete={() => void remove(post)}
                            />
                        ))}
                    </ul>
                )}
            </PlaySection>
        </div>
    );
};
