import { Link } from 'react-router-dom';
import { useAuth } from '../../../../providers/AuthProvider';
import { useCampaigns } from '../../../../providers/CampaignProvider';
import { UserGroupIcon } from '../../../../components/ui/icons';

/** "Le tue campagne": scorciatoie alla Live Board (DM) o al Party Hub (giocatore) sopra la lista degli eroi. */
export const CampaignChips = () => {
    const { currentUser } = useAuth();
    const { campaigns } = useCampaigns();
    if (!currentUser || campaigns.length === 0) return null;

    return (
        <nav aria-label="Le tue campagne" className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="shrink-0 text-label uppercase text-muted-foreground">Le tue campagne</span>
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {campaigns.map((c) => {
                    const isDm = c.ownerUid === currentUser.uid;
                    return (
                        <li key={c.id} className="shrink-0">
                            <Link
                                to={`/campaigns/${c.id}`}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-card/80 px-3.5 text-sm font-medium text-text shadow-rest ring-1 ring-border/60 transition-[background-color,color,box-shadow] duration-150 hover:text-accent hover:ring-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <UserGroupIcon aria-hidden className="h-4 w-4 text-accent" />
                                <span className="max-w-[14rem] truncate">{c.name}</span>
                                {isDm && <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent">DM</span>}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
