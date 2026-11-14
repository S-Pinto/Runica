import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ICampaign, ILocalCampaign } from '../../characterTypes';
import { CheckIcon, CopyIcon, ShareIcon, TrashIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { formatInviteCode, getRole, ROLE_LABELS } from '../../rules/campaign';

export interface CampaignChoice {
    id: string;
    name: string;
}

interface CampaignListTabProps {
    uid: string | null;
    campaigns: ICampaign[];
    localCampaigns: ILocalCampaign[];
    loading: boolean;
    loadError: string | null;
    selectedCampaignId?: string;
    onSelectCampaign?: (campaign: CampaignChoice | null) => void;
    onShareLocal: (campaign: ILocalCampaign) => Promise<void>;
    onDeleteLocal: (campaign: ILocalCampaign) => void;
    onCreate: () => void;
    onClose: () => void;
}

/** Nome della campagna, con il segno "Associata" se è quella del personaggio. */
const CampaignTitle = ({ name, selected }: { name: string; selected: boolean }) => (
    <div className="flex min-w-0 items-center gap-2">
        <h4 className="truncate font-cinzel text-title font-bold text-foreground">{name}</h4>
        {selected && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                <CheckIcon className="h-3 w-3" /> Associata
            </span>
        )}
    </div>
);

export const CampaignListTab = ({
    uid, campaigns, localCampaigns, loading, loadError, selectedCampaignId,
    onSelectCampaign, onShareLocal, onDeleteLocal, onCreate, onClose,
}: CampaignListTabProps) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [sharingId, setSharingId] = useState<string | null>(null);

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(code);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // Appunti non disponibili: il codice resta visibile a schermo.
        }
    };

    const share = async (campaign: ILocalCampaign) => {
        setSharingId(campaign.id);
        try {
            await onShareLocal(campaign);
        } finally {
            setSharingId(null);
        }
    };

    const selectButton = (choice: CampaignChoice) =>
        onSelectCampaign && (
            <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                    onSelectCampaign(selectedCampaignId === choice.id ? null : choice);
                    onClose();
                }}
            >
                {selectedCampaignId === choice.id ? 'Rimuovi dal personaggio' : 'Associa al personaggio'}
            </Button>
        );

    if (loading) {
        return (
            <div className="space-y-4" aria-busy="true" aria-label="Caricamento campagne">
                {[0, 1].map((i) => (
                    <div key={i} className="space-y-3">
                        <div className="h-5 w-1/2 animate-pulse rounded bg-muted/50" />
                        <div className="h-10 animate-pulse rounded-xl bg-muted/40" />
                    </div>
                ))}
            </div>
        );
    }

    const isEmpty = campaigns.length === 0 && localCampaigns.length === 0;

    return (
        <div className="space-y-6">
            {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}

            {isEmpty && (
                <div className="py-8 text-center">
                    <p className="font-semibold text-foreground">Nessuna campagna</p>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                        Una campagna riunisce i personaggi del gruppo. Creane una{uid ? ' o unisciti con il codice del DM' : ''}.
                    </p>
                    <Button className="mt-5" onClick={onCreate}>Crea una campagna</Button>
                </div>
            )}

            {campaigns.length > 0 && (
                <ul className="divide-y divide-border">
                    {campaigns.map((camp) => {
                        const role = getRole(camp, uid);
                        const members = `${camp.memberUids.length} ${camp.memberUids.length === 1 ? 'membro' : 'membri'}`;
                        return (
                            <li key={camp.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <CampaignTitle name={camp.name} selected={selectedCampaignId === camp.id} />
                                        <p className="text-sm text-muted-foreground">
                                            {role ? `${ROLE_LABELS[role]} · ${members}` : members}
                                        </p>
                                        {camp.description && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{camp.description}</p>
                                        )}
                                    </div>
                                    {role === 'dm' && (
                                        <button
                                            type="button"
                                            onClick={() => copyCode(formatInviteCode(camp.inviteCode))}
                                            aria-label={`Copia il codice d'invito ${formatInviteCode(camp.inviteCode)}`}
                                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border-strong/60 px-2.5 font-mono text-xs font-bold tracking-widest text-foreground transition-colors duration-150 hover:border-accent/70 hover:text-accent"
                                        >
                                            {copied === formatInviteCode(camp.inviteCode) ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : <CopyIcon className="h-3.5 w-3.5" />}
                                            {formatInviteCode(camp.inviteCode)}
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Link
                                        to={`/campaigns/${camp.id}`}
                                        onClick={onClose}
                                        className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong/60 bg-card px-4 text-sm font-semibold text-text transition-colors duration-150 hover:border-accent/70 hover:text-accent"
                                    >
                                        Apri campagna
                                    </Link>
                                    {selectButton({ id: camp.id, name: camp.name })}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {localCampaigns.length > 0 && (
                <section aria-label="Campagne solo su questo dispositivo">
                    <h5 className="mb-3 text-label uppercase text-muted-foreground">Solo su questo dispositivo</h5>
                    <ul className="divide-y divide-border">
                        {localCampaigns.map((camp) => (
                            <li key={camp.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <CampaignTitle name={camp.name} selected={selectedCampaignId === camp.id} />
                                        {camp.description && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{camp.description}</p>
                                        )}
                                    </div>
                                    <Button size="icon" variant="ghost" aria-label={`Elimina ${camp.name}`} onClick={() => onDeleteLocal(camp)}>
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    {uid ? (
                                        <Button variant="secondary" className="flex-1" disabled={sharingId === camp.id} onClick={() => share(camp)}>
                                            <ShareIcon className="h-4 w-4" /> {sharingId === camp.id ? 'Condivisione…' : 'Condividi con il gruppo'}
                                        </Button>
                                    ) : (
                                        <p className="flex-1 self-center text-sm text-muted-foreground">Accedi per condividerla.</p>
                                    )}
                                    {selectButton({ id: camp.id, name: camp.name })}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};
