import type { ReactNode } from 'react';
import type { CampaignRole, ICampaign } from '../../character/characterTypes';
import { HeroHeader } from '../../character/components/play-view/HeroHeader';
import { Menu, type MenuItem } from '../../../components/ui/Menu';
import { buttonClass } from '../../../components/ui/Button';
import { EllipsisVerticalIcon } from '../../../components/ui/icons';
import { ROLE_LABELS } from '../../character/rules/campaign';

interface CampaignHeroProps {
    campaign: ICampaign;
    role: CampaignRole;
    isLive: boolean;
    /** Testo dopo il ruolo ("4 eroi") o controllo del posto al tavolo (giocatore). */
    detail?: ReactNode;
    onBack: () => void;
    /** Azione principale a vista (Invita / Apri la mia scheda). */
    primary?: ReactNode;
    menuItems: MenuItem[];
}

/** Stato del collegamento: "Dal vivo" (pallino success) o "Offline" (warning, calmo, senza pulsazione). */
const LiveBadge = ({ isLive }: { isLive: boolean }) => (
    <span
        role="status"
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isLive ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}
    >
        <span aria-hidden className={`h-2 w-2 rounded-full ${isLive ? 'bg-success' : 'bg-warning'}`} />
        {isLive ? 'Dal vivo' : 'Offline'}
    </span>
);

/** Intestazione della campagna al tavolo: `HeroHeader` condiviso con la vista di gioco, ruolo, stato e azioni. */
export const CampaignHero = ({ campaign, role, isLive, detail, onBack, primary, menuItems }: CampaignHeroProps) => (
    <HeroHeader
        name={campaign.name}
        onBack={onBack}
        backLabel="Torna ai tuoi eroi"
        badge={
            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="font-semibold text-text">{ROLE_LABELS[role]}</span>
                {/* Il punto separa solo quando sta sulla stessa riga (da `sm`); su telefono il dettaglio va a capo. */}
                {detail && <><span aria-hidden className="hidden sm:inline">·</span><span className="flex min-w-0 max-w-full">{detail}</span></>}
                <LiveBadge isLive={isLive} />
            </div>
        }
        actions={<>
            {primary}
            <Menu
                label="Altre azioni della campagna"
                trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
                triggerClassName={buttonClass('secondary', 'icon')}
                items={menuItems}
            />
        </>}
    />
);
