// Aggiorna il riepilogo condiviso dei personaggi nelle campagne dopo un salvataggio.
// Best effort: un errore qui non deve mai far fallire il salvataggio della scheda.
import type { ICharacter } from './characterTypes';
import * as campaignService from '../../services/campaignService';
import { planCampaignSync } from './rules/campaign';

export const syncCharacterWithCampaigns = async (
    uid: string,
    previousCampaignId: string | undefined,
    character: ICharacter,
    cloudCampaignIds: ReadonlySet<string>,
): Promise<void> => {
    const plan = planCampaignSync(previousCampaignId, character.campaignId, cloudCampaignIds);
    try {
        if (plan.unpublishFrom) {
            await campaignService.unpublishCharacter(plan.unpublishFrom, character.id, uid);
        }
        if (plan.publishTo) {
            await campaignService.publishCharacter(plan.publishTo, character, uid);
        }
    } catch (error) {
        console.warn('Sincronizzazione con la campagna non riuscita', error);
    }
};

/** Ritira un personaggio eliminato dalla campagna in cui era condiviso. */
export const unpublishDeletedCharacter = async (
    uid: string,
    character: Pick<ICharacter, 'id' | 'campaignId'>,
    cloudCampaignIds: ReadonlySet<string>,
): Promise<void> => {
    if (!character.campaignId || !cloudCampaignIds.has(character.campaignId)) return;
    try {
        await campaignService.unpublishCharacter(character.campaignId, character.id, uid);
    } catch (error) {
        console.warn('Ritiro dalla campagna non riuscito', error);
    }
};
