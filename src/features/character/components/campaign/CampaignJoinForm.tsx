import { useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { INVITE_CODE_LENGTH } from '../../rules/campaign';

interface CampaignJoinFormProps {
    onJoin: (code: string) => Promise<void>;
}

export const CampaignJoinForm = ({ onJoin }: CampaignJoinFormProps) => {
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || busy) return;
        setBusy(true);
        try {
            await onJoin(code);
            setCode('');
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="campaign-code" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Codice d'invito ({INVITE_CODE_LENGTH} caratteri)
                </label>
                <input
                    id="campaign-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Es. X7K9AB"
                    maxLength={INVITE_CODE_LENGTH}
                    autoCapitalize="characters"
                    autoComplete="off"
                    required
                    className="w-full rounded-xl border border-border bg-input/60 p-3 text-center font-mono text-lg font-bold uppercase tracking-widest text-accent outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Verifica…' : 'Unisciti alla campagna'}
            </Button>
        </form>
    );
};
