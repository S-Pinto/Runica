import React from 'react';
import { ICharacter } from '../../characterTypes';
import { useCampaigns } from '../../../../providers/CampaignProvider';
import { UserGroupIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { fieldControlOnTileClass, fieldLabelClass } from '../../../../components/ui/field';

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
        <div>
            <label htmlFor="character-campaign" className={fieldLabelClass}>Campagna</label>
            <div className="flex gap-2">
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
                    className={`${fieldControlOnTileClass} min-w-0 flex-1`}
                >
                    <option value="">Nessuna campagna</option>
                    {!currentIsKnown && (
                        <option value={character.campaignId}>{character.campaignName || 'Campagna non disponibile'}</option>
                    )}
                    {options.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                    <option value="NEW">Gestisci campagne…</option>
                </select>
                <Button
                    variant="secondary"
                    size="icon-lg"
                    onClick={onOpenManager}
                    title="Gestisci o unisciti a una campagna"
                    aria-label="Gestisci campagne"
                    className="h-[46px] w-[46px]"
                >
                    <UserGroupIcon className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};
