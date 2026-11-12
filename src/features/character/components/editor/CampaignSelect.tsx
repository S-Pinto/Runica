import React from 'react';
import { ICharacter } from '../../characterTypes';
import { useCampaigns } from '../../../../providers/CampaignProvider';
import { UserGroupIcon } from '../../../../components/ui/icons';

interface CampaignSelectProps {
    character: ICharacter;
    setCharacter: React.Dispatch<React.SetStateAction<ICharacter | null>>;
    onOpenManager: () => void;
}

export const CampaignSelect = ({ character, setCharacter, onOpenManager }: CampaignSelectProps) => {
    const { campaigns, localCampaigns } = useCampaigns();
    const options = [
        ...campaigns.map((c) => ({ id: c.id, name: c.name })),
        ...localCampaigns.map((c) => ({ id: c.id, name: `${c.name} (solo questo dispositivo)` })),
    ];
    // Una campagna non più accessibile (eliminata, uscita) resta visibile finché non la si cambia.
    const currentIsKnown = !character.campaignId || options.some((o) => o.id === character.campaignId);

    return (
        <div className="col-span-1">
            <label htmlFor="character-campaign" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                Campagna
            </label>
            <div className="flex gap-1.5">
                <select
                    id="character-campaign"
                    value={character.campaignId || ''}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId === 'NEW') {
                            onOpenManager();
                            return;
                        }
                        const selected = campaigns.find((c) => c.id === selectedId) ?? localCampaigns.find((c) => c.id === selectedId);
                        setCharacter((prev) => prev ? {
                            ...prev,
                            campaignId: selected ? selected.id : undefined,
                            campaignName: selected ? selected.name : undefined,
                        } : null);
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-2.5 py-2 text-xs font-semibold text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                >
                    <option value="">Nessuna campagna</option>
                    {!currentIsKnown && (
                        <option value={character.campaignId}>{character.campaignName || 'Campagna non disponibile'}</option>
                    )}
                    {options.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                    <option value="NEW">+ Gestisci campagne…</option>
                </select>
                <button
                    type="button"
                    onClick={onOpenManager}
                    className="flex flex-shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/20 p-2.5 font-bold text-accent transition-all hover:bg-accent/30"
                    title="Gestisci o unisciti a una campagna"
                    aria-label="Gestisci campagne"
                >
                    <UserGroupIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
