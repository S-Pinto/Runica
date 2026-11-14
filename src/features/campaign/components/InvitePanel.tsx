import { useState } from 'react';
import type { ICampaign } from '../../character/characterTypes';
import { Button } from '../../../components/ui/Button';
import { ArrowPathIcon, CheckIcon, CopyIcon, ShareIcon, UserPlusIcon } from '../../../components/ui/icons';
import { PlaySection, playInsetClass } from '../../character/components/play-view/PlaySection';
import { buildInviteLink, formatInviteCode } from '../../character/rules/campaign';

interface InvitePanelProps {
    campaign: ICampaign;
    onRegenerateCode: () => Promise<void>;
}

/** Codice d'invito `RUN-XXXXXX` con condivisione del link, copia e rigenerazione (solo DM). */
export const InvitePanel = ({ campaign, onRegenerateCode }: InvitePanelProps) => {
    const [copied, setCopied] = useState<'code' | 'link' | null>(null);
    const [busy, setBusy] = useState(false);
    const displayCode = formatInviteCode(campaign.inviteCode);
    const inviteLink = buildInviteLink(window.location.origin, campaign.inviteCode);

    const copy = async (text: string, what: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(what);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // Appunti non disponibili: il codice resta visibile.
        }
    };

    const shareLink = async () => {
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: campaign.name, text: `Unisciti a «${campaign.name}» su Runica · codice ${displayCode}`, url: inviteLink });
                return;
            } catch (error) {
                if ((error as { name?: string })?.name === 'AbortError') return;
            }
        }
        await copy(inviteLink, 'link');
    };

    return (
        <PlaySection id="invite" title="Invita al tavolo" icon={<UserPlusIcon className="text-accent" />}>
            <div className={`${playInsetClass} flex flex-col gap-3 p-3 sm:p-4`}>
                <div className="min-w-0">
                    <p className="text-label uppercase text-muted-foreground">Codice d'invito</p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground sm:text-3xl">{displayCode}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Button onClick={() => void shareLink()} className="col-span-2 sm:col-span-1">
                        {copied === 'link' ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />} {copied === 'link' ? 'Link copiato' : 'Condividi link'}
                    </Button>
                    <Button variant="secondary" onClick={() => void copy(displayCode, 'code')}>
                        {copied === 'code' ? <CheckIcon className="h-4 w-4 text-success" /> : <CopyIcon className="h-4 w-4" />} {copied === 'code' ? 'Copiato' : 'Copia'}
                    </Button>
                    <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={async () => {
                            setBusy(true);
                            try {
                                await onRegenerateCode();
                            } finally {
                                setBusy(false);
                            }
                        }}
                    >
                        <ArrowPathIcon className="h-4 w-4" /> Nuovo codice
                    </Button>
                </div>
            </div>
        </PlaySection>
    );
};
