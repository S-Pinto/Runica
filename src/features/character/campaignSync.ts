// Aggiorna le proiezioni dei personaggi nelle campagne (party in `sharedCharacters`, numeri in `liveStats`).
// Best effort: un errore qui non deve mai far fallire il salvataggio della scheda.
import type { ICharacter } from './characterTypes';
import * as campaignService from '../../services/campaignService';
import { buildLiveStats, buildSharedCharacter, planCampaignSync, projectionFingerprint } from './rules/campaign';

const fingerprintOf = (character: ICharacter, uid: string) =>
    projectionFingerprint(buildSharedCharacter(character, uid), buildLiveStats(character, uid));

/** Dopo un salvataggio dall'editor: ritira dalla campagna precedente e pubblica tutto (ritratto incluso). */
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
            campaignService.rememberPublished(plan.publishTo, character.id, fingerprintOf(character, uid));
            await campaignService.publishCharacter(plan.publishTo, character, uid);
        }
    } catch (error) {
        if (plan.publishTo) campaignService.forgetPublished(plan.publishTo, character.id);
        console.warn('Sincronizzazione con la campagna non riuscita', error);
    }
};

/**
 * Dopo un salvataggio automatico della vista di gioco: aggiorna PF, condizioni, slot e il resto
 * solo se le proiezioni sono cambiate dall'ultima pubblicazione (niente scritture inutili).
 * La prima pubblicazione della sessione è completa: riscrive il riepilogo per intero, ritratto incluso.
 */
export const publishLiveIfChanged = async (
    uid: string,
    character: ICharacter,
    cloudCampaignIds: ReadonlySet<string>,
): Promise<void> => {
    const campaignId = character.campaignId;
    if (!campaignId || !cloudCampaignIds.has(campaignId)) return;
    const fingerprint = fingerprintOf(character, uid);
    const previous = campaignService.getPublishedFingerprint(campaignId, character.id);
    if (previous === fingerprint) return;
    campaignService.rememberPublished(campaignId, character.id, fingerprint);
    try {
        if (previous === undefined) await campaignService.publishCharacter(campaignId, character, uid);
        else await campaignService.publishLiveProjection(campaignId, character, uid);
    } catch (error) {
        campaignService.forgetPublished(campaignId, character.id);
        console.warn('Aggiornamento dal vivo della campagna non riuscito', error);
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
