import { useState } from 'react';
import type { ICampaign, CampaignRole } from '../../character/characterTypes';
import { Button } from '../../../components/ui/Button';
import { ArrowPathIcon, CheckIcon, CopyIcon, TrashIcon } from '../../../components/ui/icons';
import { ROLE_LABELS } from '../../character/rules/campaign';

interface CampaignHeaderProps {
    campaign: ICampaign;
    role: CampaignRole;
    onSave: (name: string, description: string) => Promise<void>;
    onRegenerateCode: () => Promise<void>;
    onDelete: () => Promise<void>;
    onLeave: () => Promise<void>;
}

/** Titolo, codice d'invito e azioni della campagna: gestione al DM, "abbandona" al giocatore. */
export const CampaignHeader = ({ campaign, role, onSave, onRegenerateCode, onDelete, onLeave }: CampaignHeaderProps) => {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(campaign.name);
    const [description, setDescription] = useState(campaign.description ?? '');
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        try {
            await action();
        } finally {
            setBusy(false);
        }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(campaign.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Appunti non disponibili: il codice resta visibile.
        }
    };

    if (editing) {
        return (
            <form
                className="space-y-3 rounded-2xl border border-border/70 bg-card p-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    void run(async () => {
                        await onSave(name, description);
                        setEditing(false);
                    });
                }}
            >
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="edit-campaign-name">Nome</label>
                <input id="edit-campaign-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required
                    className="w-full rounded-xl border border-border bg-input/60 p-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" />
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="edit-campaign-desc">Descrizione</label>
                <textarea id="edit-campaign-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-input/60 p-3 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" />
                <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>Salva</Button>
                    <Button variant="ghost" onClick={() => setEditing(false)}>Annulla</Button>
                </div>
            </form>
        );
    }

    return (
        <header className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">{ROLE_LABELS[role]}</p>
                    <h1 className="break-words font-cinzel text-3xl font-bold text-foreground sm:text-4xl">{campaign.name}</h1>
                    {campaign.description && (
                        <p className="mt-2 max-w-prose whitespace-pre-line text-sm text-muted-foreground">{campaign.description}</p>
                    )}
                </div>
                <div className="flex shrink-0 gap-2">
                    {role === 'dm' ? (
                        <>
                            <Button variant="secondary" onClick={() => setEditing(true)}>Modifica</Button>
                            <Button variant="destructive" disabled={busy} onClick={() => void run(onDelete)}>
                                <TrashIcon className="h-4 w-4" /> Elimina
                            </Button>
                        </>
                    ) : (
                        <Button variant="secondary" disabled={busy} onClick={() => void run(onLeave)}>Abbandona</Button>
                    )}
                </div>
            </div>

            {role === 'dm' && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Codice d'invito</p>
                        <p className="font-mono text-2xl font-bold tracking-widest text-accent">{campaign.inviteCode}</p>
                    </div>
                    <div className="flex gap-2 sm:ml-auto">
                        <Button variant="secondary" size="sm" onClick={copyCode}>
                            {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <CopyIcon className="h-4 w-4" />} {copied ? 'Copiato' : 'Copia'}
                        </Button>
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => void run(onRegenerateCode)}>
                            <ArrowPathIcon className="h-4 w-4" /> Nuovo codice
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
};
