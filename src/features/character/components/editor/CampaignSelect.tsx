import React from 'react';
import { ICharacter } from '../../characterTypes';
import * as campaignService from '../../../../services/campaignService';
import { UserGroupIcon } from '../../../../components/ui/icons';

interface CampaignSelectProps {
    character: ICharacter;
    setCharacter: React.Dispatch<React.SetStateAction<ICharacter | null>>;
    onOpenManager: () => void;
}

export const CampaignSelect = ({ character, setCharacter, onOpenManager }: CampaignSelectProps) => (
    <div className="col-span-1">
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/90 mb-1.5">
            Campagna
        </label>
        <div className="flex gap-1.5">
            <select
                value={character.campaignId || ''}
                onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId === 'NEW') {
                        onOpenManager();
                        return;
                    }
                    const campaigns = campaignService.getCampaigns();
                    const selectedCamp = campaigns.find(c => c.id === selectedId);
                    setCharacter(prev => prev ? {
                        ...prev,
                        campaignId: selectedCamp ? selectedCamp.id : undefined,
                        campaignName: selectedCamp ? selectedCamp.name : (selectedId ? e.target.value : undefined)
                    } : null);
                }}
                className="flex-1 min-w-0 bg-background/50 border border-border/70 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
            >
                <option value="">Nessuna campagna</option>
                {campaignService.getCampaigns().map(camp => (
                    <option key={camp.id} value={camp.id}>
                        {camp.name}
                    </option>
                ))}
                <option value="NEW">+ Gestisci campagne…</option>
            </select>
            <button
                type="button"
                onClick={onOpenManager}
                className="p-2.5 bg-accent/20 border border-accent/40 text-accent font-bold rounded-xl hover:bg-accent/30 transition-all flex items-center justify-center flex-shrink-0"
                title="Gestisci o unisciti a una campagna"
            >
                <UserGroupIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);
