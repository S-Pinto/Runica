import { useState } from 'react';
import { PlusIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { fieldInputClass, fieldLabelClass } from '../../../../components/ui/field';

interface CampaignCreateFormProps {
    /** Se false la campagna resta solo su questo dispositivo. */
    isShared: boolean;
    onCreate: (name: string, description: string) => Promise<void>;
}

export const CampaignCreateForm = ({ isShared, onCreate }: CampaignCreateFormProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true);
        try {
            await onCreate(name, description);
            setName('');
            setDescription('');
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {!isShared && (
                <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-text">
                    Senza accesso la campagna resta su questo dispositivo. Accedi per condividerla con giocatori e DM.
                </p>
            )}
            <div>
                <label htmlFor="campaign-name" className={fieldLabelClass}>
                    Nome della campagna
                </label>
                <input
                    id="campaign-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Es. La Maledizione di Strahd"
                    maxLength={120}
                    required
                    className={`${fieldInputClass} bg-background`}
                />
            </div>
            <div>
                <label htmlFor="campaign-desc" className={fieldLabelClass}>
                    Descrizione o note del DM (facoltativo)
                </label>
                <textarea
                    id="campaign-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve introduzione o dettagli della campagna"
                    maxLength={2000}
                    rows={3}
                    className={`${fieldInputClass} resize-none bg-background`}
                />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
                <PlusIcon className="h-4 w-4" /> {busy ? 'Creazione…' : 'Crea campagna'}
            </Button>
        </form>
    );
};
