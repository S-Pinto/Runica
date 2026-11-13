import { useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { fieldInputClass, fieldLabelClass } from '../../../../components/ui/field';
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
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="campaign-code" className={fieldLabelClass}>
                    Codice d'invito ({INVITE_CODE_LENGTH} caratteri)
                </label>
                <input
                    id="campaign-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="X7K9AB"
                    maxLength={INVITE_CODE_LENGTH}
                    autoCapitalize="characters"
                    autoComplete="off"
                    required
                    className={`${fieldInputClass} bg-background text-center font-mono text-xl font-bold uppercase tracking-widest placeholder:font-normal`}
                />
                <p className="mt-2 text-sm text-muted-foreground">Te lo dà il DM della campagna.</p>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Verifica…' : 'Unisciti alla campagna'}
            </Button>
        </form>
    );
};
