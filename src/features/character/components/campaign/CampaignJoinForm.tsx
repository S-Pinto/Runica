import { useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { fieldInputClass, fieldLabelClass } from '../../../../components/ui/field';
import { isValidInviteCode, normalizeInviteCode } from '../../rules/campaign';

interface CampaignJoinFormProps {
    onJoin: (code: string) => Promise<void>;
}

/** Accetta il codice in qualunque forma (`RUN-X7K9AB`, con spazi o trattini) o il link d'invito incollato. */
export const CampaignJoinForm = ({ onJoin }: CampaignJoinFormProps) => {
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const normalized = normalizeInviteCode(code);
    const showHint = code.trim().length > 0 && !isValidInviteCode(normalized);

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
                    Codice o link d'invito
                </label>
                <input
                    id="campaign-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="RUN-X7K9AB"
                    maxLength={300}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    required
                    aria-describedby="campaign-code-hint"
                    className={`${fieldInputClass} bg-background text-center font-mono text-xl font-bold tracking-widest placeholder:font-normal`}
                />
                <p id="campaign-code-hint" className={`mt-2 text-sm ${showHint ? 'text-warning' : 'text-muted-foreground'}`}>
                    {showHint ? 'Il codice ha 6 caratteri dopo "RUN-": controlla di averlo copiato tutto.' : 'Te lo dà il DM della campagna. Puoi incollare anche il link.'}
                </p>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Verifica…' : 'Unisciti alla campagna'}
            </Button>
        </form>
    );
};
