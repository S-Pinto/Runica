import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { buttonClass } from '../../../components/ui/Button';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import { CheckIcon, PlusIcon, UserGroupIcon } from '../../../components/ui/icons';
import { describeDataError } from '../../../lib/errors';
import { useAuth } from '../../../providers/AuthProvider';
import { useCampaigns } from '../../../providers/CampaignProvider';
import * as campaignService from '../../../services/campaignService';
import { useCharacter } from '../../character/CharacterProvider';
import type { ICampaign, ICharacter } from '../../character/characterTypes';
import { resolveCampaignName } from '../../character/rules/campaign';
import { initials } from '../../character/utils/characterDisplay';

interface CharacterPickerModalProps {
    open: boolean;
    onClose: () => void;
    campaign: ICampaign;
}

/**
 * "Con chi siedi al tavolo?": associa uno dei propri personaggi alla campagna (un personaggio sta in
 * una sola campagna alla volta) e lo segna come personaggio attivo del membro.
 */
export const CharacterPickerModal = ({ open, onClose, campaign }: CharacterPickerModalProps) => {
    const { currentUser } = useAuth();
    const { campaigns, campaignNames } = useCampaigns();
    const { characters, loading, saveCharacter } = useCharacter();
    const [busyId, setBusyId] = useState<string | null>(null);

    const choose = async (character: ICharacter) => {
        if (!currentUser || busyId) return;
        if (character.campaignId === campaign.id) {
            await campaignService.setActiveCharacter(campaign.id, currentUser.uid, character.id).catch(() => undefined);
            onClose();
            return;
        }
        const currentCampaign = character.campaignId ? resolveCampaignName(character, campaignNames) : undefined;
        if (character.campaignId) {
            const ok = await confirmDialog({
                title: `Spostare ${character.name || 'questo eroe'}?`,
                message: `È iscritto a «${currentCampaign || 'un\'altra campagna'}». Un personaggio può stare in una sola campagna: passerà a «${campaign.name}».`,
                confirmLabel: 'Sposta qui',
            });
            if (!ok) return;
        }
        setBusyId(character.id);
        try {
            // Il salvataggio ritira il riepilogo dalla campagna precedente e lo pubblica in questa.
            const saved = await saveCharacter({ ...character, campaignId: campaign.id, campaignName: campaign.name, lastUpdated: Date.now() });
            if (!campaigns.some((c) => c.id === campaign.id)) {
                // Appena entrati l'elenco in tempo reale può non avere ancora la campagna: pubblica direttamente.
                await campaignService.publishCharacter(campaign.id, saved, currentUser.uid).catch((error) => {
                    console.warn('Pubblicazione nella campagna non riuscita', error);
                });
            }
            await campaignService.setActiveCharacter(campaign.id, currentUser.uid, character.id).catch(() => undefined);
            toast.success(`${character.name || 'Il tuo eroe'} siede al tavolo di «${campaign.name}».`);
            onClose();
        } catch (error) {
            toast.error(describeDataError(error, 'Impossibile associare il personaggio.'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Con chi siedi al tavolo?"
            icon={<UserGroupIcon />}
            footer={
                <Link to={`/character/new?campaign=${encodeURIComponent(campaign.id)}`} className={buttonClass('secondary', 'md', 'w-full')}>
                    <PlusIcon className="h-4 w-4" /> Crea un nuovo eroe per questa campagna
                </Link>
            }
        >
            {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Caricamento dei tuoi eroi…</p>
            ) : characters.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Non hai ancora personaggi. Creane uno per sederti al tavolo.</p>
            ) : (
                <ul className="space-y-2" aria-label="I tuoi personaggi">
                    {characters.map((character) => {
                        const here = character.campaignId === campaign.id;
                        const elsewhere = !here && character.campaignId ? resolveCampaignName(character, campaignNames) : undefined;
                        return (
                            <li key={character.id}>
                                <button
                                    type="button"
                                    onClick={() => void choose(character)}
                                    disabled={!!busyId}
                                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl bg-background/50 p-2.5 text-left transition-colors duration-150 hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${here ? 'ring-1 ring-accent/60' : ''}`}
                                >
                                    {character.imageUrl ? (
                                        <img src={character.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                                    ) : (
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-input font-cinzel text-lg font-bold text-accent/70">
                                            {initials(character.name)}
                                        </span>
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-cinzel font-bold text-foreground">{character.name || 'Senza nome'}</span>
                                        <span className="block truncate text-sm text-muted-foreground">
                                            {[character.class, `Lv ${character.level || 1}`].filter(Boolean).join(' · ')}
                                            {elsewhere && ` · in «${elsewhere}»`}
                                        </span>
                                    </span>
                                    {here && <CheckIcon className="h-5 w-5 shrink-0 text-accent" aria-label="Già in questa campagna" />}
                                    {busyId === character.id && <span className="shrink-0 text-xs text-muted-foreground">Salvo…</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Modal>
    );
};
