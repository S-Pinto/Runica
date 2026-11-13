import type { ICampaignMember } from '../../character/characterTypes';
import { Button } from '../../../components/ui/Button';
import { XMarkIcon } from '../../../components/ui/icons';
import { ROLE_LABELS } from '../../character/rules/campaign';

interface MemberListProps {
    members: ICampaignMember[];
    currentUid: string;
    canManage: boolean;
    onRemove: (member: ICampaignMember) => void;
}

export const MemberList = ({ members, currentUid, canManage, onRemove }: MemberListProps) => {
    // Il DM per primo, poi per data di ingresso.
    const sorted = [...members].sort((a, b) => (a.role === b.role ? a.joinedAt - b.joinedAt : a.role === 'dm' ? -1 : 1));

    return (
        <ul className="surface divide-y divide-foreground/10">
            {sorted.map((m) => (
                <li key={m.uid} className="flex min-h-14 items-center gap-3 px-4 py-2">
                    {m.photoURL ? (
                        <img src={m.photoURL} alt="" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                            {m.displayName.slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {m.displayName}{m.uid === currentUid && <span className="font-normal text-muted-foreground"> (tu)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{ROLE_LABELS[m.role]}</p>
                    </div>
                    {canManage && m.role !== 'dm' && (
                        <Button size="icon" variant="ghost" aria-label={`Rimuovi ${m.displayName}`} onClick={() => onRemove(m)}>
                            <XMarkIcon className="h-4 w-4" />
                        </Button>
                    )}
                </li>
            ))}
        </ul>
    );
};
