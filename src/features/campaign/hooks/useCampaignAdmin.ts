import { useNavigate } from 'react-router-dom';
import * as campaignService from '../../../services/campaignService';
import { describeDataError } from '../../../lib/errors';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import type { ICampaign, ICampaignMember, ICampaignSettings, ISharedCharacter } from '../../character/characterTypes';
import { getCampaignSettings, legacySharedIds } from '../../character/rules/campaign';

const guard = async (action: () => Promise<void>, failure: string) => {
    try {
        await action();
    } catch (error) {
        toast.error(describeDataError(error, failure));
    }
};

/** Azioni di gestione della campagna con le relative conferme: DM (modifica, codice, impostazioni, membri) e giocatore (abbandona). */
export const useCampaignAdmin = (campaign: ICampaign, uid: string, dmName: string, shared: ISharedCharacter[]) => {
    const navigate = useNavigate();

    const save = (name: string, description: string) =>
        guard(() => campaignService.updateCampaignDetails(campaign, name, description), 'Impossibile salvare le modifiche.');

    const regenerateCode = async () => {
        const ok = await confirmDialog({
            title: 'Generare un nuovo codice?',
            message: 'Il codice e il link attuali smetteranno di funzionare. Chi è già nella campagna non viene toccato.',
            confirmLabel: 'Genera',
        });
        if (ok) await guard(async () => { await campaignService.regenerateInviteCode(campaign, dmName); }, 'Impossibile generare il codice.');
    };

    const changeSettings = async (settings: ICampaignSettings) => {
        const before = getCampaignSettings(campaign);
        await guard(async () => {
            await campaignService.updateCampaignSettings(campaign.id, settings);
            // Passando a "narrativo" i riepiloghi v1 con i numeri non devono restare leggibili: i proprietari li ripubblicano in v2.
            if (settings.partyVitals === 'narrative' && before.partyVitals !== 'narrative') {
                const legacy = legacySharedIds(shared);
                if (legacy.length > 0) await campaignService.deleteSharedCharacters(campaign.id, legacy);
            }
        }, 'Impostazioni non salvate.');
    };

    const removeMember = async (member: ICampaignMember) => {
        const ok = await confirmDialog({
            title: `Rimuovere ${member.displayName}?`,
            message: 'Il giocatore esce dalla campagna e i suoi personaggi non saranno più visibili qui. Le sue schede non vengono toccate.',
            confirmLabel: 'Rimuovi',
            destructive: true,
        });
        if (ok) await guard(() => campaignService.removeMember(campaign.id, member.uid), 'Impossibile rimuovere il giocatore.');
    };

    const remove = async () => {
        const ok = await confirmDialog({
            title: `Eliminare "${campaign.name}"?`,
            message: 'La campagna, la bacheca e i riepiloghi condivisi spariranno per tutti i membri. Le schede dei giocatori restano al loro posto. Non si può annullare.',
            confirmLabel: 'Elimina campagna',
            destructive: true,
        });
        if (!ok) return;
        await guard(async () => {
            await campaignService.deleteCampaign(campaign);
            toast.success('Campagna eliminata.');
            navigate('/');
        }, 'Impossibile eliminare la campagna.');
    };

    const leave = async () => {
        const ok = await confirmDialog({
            title: 'Abbandonare la campagna?',
            message: 'I tuoi personaggi non saranno più visibili ai membri. Le schede restano tue.',
            confirmLabel: 'Abbandona',
            destructive: true,
        });
        if (!ok) return;
        await guard(async () => {
            await campaignService.leaveCampaign(campaign.id, uid);
            toast.success('Hai lasciato la campagna.');
            navigate('/');
        }, 'Impossibile lasciare la campagna.');
    };

    return { save, regenerateCode, changeSettings, removeMember, remove, leave };
};
