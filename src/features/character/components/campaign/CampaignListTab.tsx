import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ICampaign, ILocalCampaign } from '../../characterTypes';
import { CheckIcon, CopyIcon, ShareIcon, TrashIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { getRole, ROLE_LABELS } from '../../rules/campaign';

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

const cardClass = (selected: boolean) =>
    `flex flex-col gap-2 rounded-xl border p-4 transition-all ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-background/30 hover:border-accent/40'
    }`;

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
                size="sm"
                variant={selectedCampaignId === choice.id ? 'primary' : 'secondary'}
                className="w-full"
                onClick={() => {
                    onSelectCampaign(selectedCampaignId === choice.id ? null : choice);
                    onClose();
                }}
            >
                {selectedCampaignId === choice.id ? 'Associata (tocca per rimuovere)' : 'Associa al personaggio'}
            </Button>
        );

    if (loading) {
        return <p className="py-8 text-center text-sm text-muted-foreground">Caricamento campagne…</p>;
    }

    const isEmpty = campaigns.length === 0 && localCampaigns.length === 0;

    return (
        <div className="space-y-5">
            {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}

            {isEmpty && (
                <div className="space-y-3 py-8 text-center text-muted-foreground">
                    <p>Nessuna campagna al momento.</p>
                    <Button variant="secondary" onClick={onCreate}>Crea la prima campagna</Button>
                </div>
            )}

            {campaigns.length > 0 && (
                <ul className="space-y-3">
                    {campaigns.map((camp) => {
                        const role = getRole(camp, uid);
                        return (
                            <li key={camp.id} className={cardClass(selectedCampaignId === camp.id)}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="truncate font-cinzel text-lg font-bold text-accent">{camp.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {role ? ROLE_LABELS[role] : ''} · {camp.memberUids.length} {camp.memberUids.length === 1 ? 'membro' : 'membri'}
                                        </p>
                                        {camp.description && (
                                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{camp.description}</p>
                                        )}
                                    </div>
                                    {role === 'dm' && (
                                        <button
                                            type="button"
                                            onClick={() => copyCode(camp.inviteCode)}
                                            className="flex shrink-0 items-center gap-1 rounded border border-accent/30 bg-muted/60 px-2.5 py-1 text-xs text-accent transition-all hover:bg-accent/20"
                                            title="Copia il codice d'invito"
                                        >
                                            {copied === camp.inviteCode ? <CheckIcon className="h-3.5 w-3.5 text-success" /> : <CopyIcon className="h-3.5 w-3.5" />}
                                            <span className="font-mono">{camp.inviteCode}</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        to={`/campaign/${camp.id}`}
                                        onClick={onClose}
                                        className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-text transition-colors hover:border-accent/60 hover:text-accent"
                                    >
                                        Apri campagna
                                    </Link>
                                </div>
                                {selectButton({ id: camp.id, name: camp.name })}
                            </li>
                        );
                    })}
                </ul>
            )}

            {localCampaigns.length > 0 && (
                <section aria-label="Campagne solo su questo dispositivo" className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Solo su questo dispositivo</h5>
                    <ul className="space-y-3">
                        {localCampaigns.map((camp) => (
                            <li key={camp.id} className={cardClass(selectedCampaignId === camp.id)}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="truncate font-cinzel text-lg font-bold text-text">{camp.name}</h4>
                                        {camp.description && (
                                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{camp.description}</p>
                                        )}
                                    </div>
                                    <Button size="sm" variant="ghost" aria-label={`Elimina ${camp.name}`} onClick={() => onDeleteLocal(camp)}>
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                                {uid ? (
                                    <Button size="sm" variant="secondary" disabled={sharingId === camp.id} onClick={() => share(camp)}>
                                        <ShareIcon className="h-4 w-4" /> {sharingId === camp.id ? 'Condivisione…' : 'Condividi con altri giocatori'}
                                    </Button>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Accedi per condividerla.</p>
                                )}
                                {selectButton({ id: camp.id, name: camp.name })}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};
