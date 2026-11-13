import { useState } from 'react';
import type { ICampaign, CampaignRole } from '../../character/characterTypes';
import { Button } from '../../../components/ui/Button';
import { ArrowPathIcon, CheckIcon, CopyIcon, TrashIcon } from '../../../components/ui/icons';
import { fieldInputClass, fieldLabelClass } from '../../../components/ui/field';
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
                className="space-y-4 surface p-4 sm:p-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    void run(async () => {
                        await onSave(name, description);
                        setEditing(false);
                    });
                }}
            >
                <div>
                    <label className={fieldLabelClass} htmlFor="edit-campaign-name">Nome</label>
                    <input id="edit-campaign-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required
                        className={`${fieldInputClass} bg-background`} />
                </div>
                <div>
                    <label className={fieldLabelClass} htmlFor="edit-campaign-desc">Descrizione</label>
                    <textarea id="edit-campaign-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3}
                        className={`${fieldInputClass} resize-none bg-background`} />
                </div>
                <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>Salva</Button>
                    <Button variant="ghost" onClick={() => setEditing(false)}>Annulla</Button>
                </div>
            </form>
        );
    }

    return (
        <header className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="break-words font-cinzel text-3xl font-bold text-foreground sm:text-4xl">{campaign.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Il tuo ruolo: {ROLE_LABELS[role]}</p>
                    {campaign.description && (
                        <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-text">{campaign.description}</p>
                    )}
                </div>
                <div className="flex shrink-0 gap-2">
                    {role === 'dm' ? (
                        <>
                            <Button variant="secondary" onClick={() => setEditing(true)}>Modifica</Button>
                            {/* Contorno a riposo: il rosso pieno è nella conferma. */}
                            <Button variant="destructive-outline" disabled={busy} onClick={() => void run(onDelete)}>
                                <TrashIcon className="h-4 w-4" /> Elimina
                            </Button>
                        </>
                    ) : (
                        <Button variant="secondary" disabled={busy} onClick={() => void run(onLeave)}>Abbandona</Button>
                    )}
                </div>
            </div>

            {role === 'dm' && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 surface p-4">
                    <div>
                        <p className="text-label uppercase text-muted-foreground">Codice d'invito</p>
                        <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground">{campaign.inviteCode}</p>
                    </div>
                    <div className="flex gap-2 sm:ml-auto">
                        <Button variant="secondary" onClick={copyCode}>
                            {copied ? <CheckIcon className="h-4 w-4 text-success" /> : <CopyIcon className="h-4 w-4" />} {copied ? 'Copiato' : 'Copia'}
                        </Button>
                        <Button variant="ghost" disabled={busy} onClick={() => void run(onRegenerateCode)}>
                            <ArrowPathIcon className="h-4 w-4" /> Nuovo codice
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
};
