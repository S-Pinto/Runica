import type { ICampaign, ICampaignSettings, PartyVitalsMode } from '../../character/characterTypes';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { SettingsIcon } from '../../../components/ui/icons';
import { fieldCheckRowClass } from '../../../components/ui/field';
import { PlaySection, playInsetClass, playLabelClass } from '../../character/components/play-view/PlaySection';
import { getCampaignSettings } from '../../character/rules/campaign';

const VITALS_OPTIONS = [
    { value: 'numeric', label: 'Numerico' },
    { value: 'narrative', label: 'Narrativo' },
] as const;

interface CampaignSettingsPanelProps {
    campaign: ICampaign;
    onChange: (settings: ICampaignSettings) => void;
}

/** Impostazioni del tavolo (solo DM): cosa vedono i giocatori dei compagni e chi scrive in bacheca. */
export const CampaignSettingsPanel = ({ campaign, onChange }: CampaignSettingsPanelProps) => {
    const settings = getCampaignSettings(campaign);
    return (
        <PlaySection title="Impostazioni del tavolo" icon={<SettingsIcon className="text-accent" />}>
            <div className="space-y-3">
                <div className={`${playInsetClass} space-y-2 p-3 sm:p-4`}>
                    <p className={`${playLabelClass} font-semibold tracking-widest`} id="vitals-mode-label">I giocatori vedono dei compagni</p>
                    <SegmentedControl<PartyVitalsMode>
                        label="I giocatori vedono dei compagni"
                        options={VITALS_OPTIONS}
                        value={settings.partyVitals}
                        onChange={(partyVitals) => onChange({ ...settings, partyVitals })}
                    />
                    <p className="text-sm text-muted-foreground">
                        {settings.partyVitals === 'numeric'
                            ? 'PF, CA e passive dei compagni, come li vedi tu.'
                            : 'Solo Sano, Ferito, Critico o A terra: i numeri degli altri non arrivano nemmeno ai loro dispositivi.'}
                    </p>
                </div>
                <div className={`${playInsetClass} px-3 py-1 sm:px-4`}>
                    <label className={`${fieldCheckRowClass} min-h-12`}>
                        <input
                            type="checkbox"
                            checked={settings.playerPosts}
                            onChange={(e) => onChange({ ...settings, playerPosts: e.target.checked })}
                            className="h-5 w-5 rounded border-border-strong bg-background text-accent focus:ring-accent"
                        />
                        I giocatori possono scrivere in bacheca
                    </label>
                </div>
            </div>
        </PlaySection>
    );
};
