import { useState } from 'react';
import type { IBoardPost } from '../../character/characterTypes';
import { Button } from '../../../components/ui/Button';
import { Menu } from '../../../components/ui/Menu';
import { EditIcon, EllipsisVerticalIcon, PinIcon, TrashIcon } from '../../../components/ui/icons';
import { fieldControlOnTileClass } from '../../../components/ui/field';
import { playInsetClass } from '../../character/components/play-view/PlaySection';
import { BOARD_POST_MAX, describeAgo } from '../../character/rules/campaign';

interface BoardPostItemProps {
    post: IBoardPost;
    now: number;
    isMine: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPin: boolean;
    onEdit: (text: string) => Promise<void>;
    onTogglePin: () => void;
    onDelete: () => void;
}

/** Un messaggio della bacheca: autore, quando, testo; modifica in linea per l'autore, fissa/elimina per il DM. */
export const BoardPostItem = ({ post, now, isMine, canEdit, canDelete, canPin, onEdit, onTogglePin, onDelete }: BoardPostItemProps) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(post.text);
    const [busy, setBusy] = useState(false);

    const items = [
        ...(canEdit ? [{ label: 'Modifica', icon: <EditIcon className="h-4 w-4" />, onSelect: () => { setDraft(post.text); setEditing(true); } }] : []),
        ...(canPin ? [{ label: post.pinned ? 'Togli dai fissati' : 'Fissa in alto', icon: <PinIcon className="h-4 w-4" />, onSelect: onTogglePin }] : []),
        ...(canDelete ? [{ label: 'Elimina', icon: <TrashIcon className="h-4 w-4" />, onSelect: onDelete, destructive: true }] : []),
    ];

    return (
        <li className={`${playInsetClass} p-3 sm:p-4 ${post.pinned ? 'ring-1 ring-accent/40' : ''}`}>
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        {post.pinned && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-accent">
                                <PinIcon aria-hidden className="h-3.5 w-3.5" /> Fissato
                            </span>
                        )}
                        <span className="font-semibold text-foreground">{post.authorName}{isMine && <span className="font-normal text-muted-foreground"> (tu)</span>}</span>
                        <span className="text-xs text-muted-foreground">
                            {describeAgo(post.createdAt, now)}{post.updatedAt - post.createdAt > 60_000 && ' · modificato'}
                        </span>
                    </p>
                </div>
                {items.length > 0 && !editing && (
                    <Menu
                        label="Azioni del messaggio"
                        trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
                        triggerClassName="-mr-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        items={items}
                    />
                )}
            </div>
            {editing ? (
                <form
                    className="mt-2 space-y-2"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!draft.trim()) return;
                        setBusy(true);
                        try {
                            await onEdit(draft);
                            setEditing(false);
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    <label htmlFor={`edit-${post.id}`} className="sr-only">Modifica il messaggio</label>
                    <textarea id={`edit-${post.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={BOARD_POST_MAX} rows={3}
                        className={`${fieldControlOnTileClass} resize-y leading-relaxed`} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Annulla</Button>
                        <Button type="submit" size="sm" disabled={busy || !draft.trim()}>Salva</Button>
                    </div>
                </form>
            ) : (
                <p className="mt-1.5 whitespace-pre-line break-words text-base leading-relaxed text-text">{post.text}</p>
            )}
        </li>
    );
};
