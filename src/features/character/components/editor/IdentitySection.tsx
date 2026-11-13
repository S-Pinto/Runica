import { useState } from 'react';
import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { useAuth } from '../../../../providers/AuthProvider';
import * as storageService from '../../../../services/storageService';
import { toast } from '../../../../components/ui/Dialogs';
import { PhotoIcon, UserCircleIcon } from '../../../../components/ui/icons';
import { StyledInput, StyledSection } from '../ui/StyledInputs';
import { StatInput } from '../StatInput';
import { ImageUploader } from '../ImageUploader';
import { CampaignManagerModal } from '../CampaignManagerModal';
import { CampaignSelect } from './CampaignSelect';
import { useFieldChange } from '../../hooks/useFieldChange';

interface IdentitySectionProps {
    character: ICharacter;
    isNewCharacter: boolean;
}

export const IdentitySection = ({ character, isNewCharacter }: IdentitySectionProps) => {
    const { setCharacter, updateCharacter } = useCharacter();
    const { currentUser } = useAuth();
    const handleFieldChange = useFieldChange();
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

    const handleCharacterImageUpload = async (dataUrl: string) => {
        if (!currentUser) return;
        try {
            const imageUrl = await storageService.uploadCharacterImageFromDataUrl(dataUrl, currentUser.uid, character.id);
            updateCharacter({ imageUrl });
        } catch (error) {
            console.error("Failed to upload character portrait:", error);
            toast.error('Caricamento immagine non riuscito. Riprova.');
        }
    };

    const initials = (character.name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

    return (
        <>
            <StyledSection icon={<UserCircleIcon className="text-muted-foreground" />} title="Identità">
                <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                    {/* Ritratto: tutta la cornice apre il caricamento. */}
                    <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">
                        <button
                            type="button"
                            onClick={() => setIsUploaderOpen(true)}
                            disabled={isNewCharacter}
                            aria-label={character.imageUrl ? 'Cambia ritratto' : 'Carica ritratto'}
                            className="group relative h-32 w-32 overflow-hidden rounded-2xl bg-input transition-shadow duration-150 enabled:hover:ring-2 enabled:hover:ring-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed"
                        >
                            {character.imageUrl ? (
                                <img src={character.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.03]" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center font-cinzel text-4xl font-bold text-accent/60">
                                    {initials || <PhotoIcon className="h-10 w-10 text-muted-foreground" />}
                                </span>
                            )}
                            {!isNewCharacter && (
                                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-background/85 py-1.5 text-xs font-semibold text-foreground transition-colors duration-150 group-hover:text-accent">
                                    <PhotoIcon className="h-3.5 w-3.5" /> {character.imageUrl ? 'Cambia' : 'Carica'}
                                </span>
                            )}
                        </button>
                        {isNewCharacter && <p className="max-w-32 text-center text-xs text-muted-foreground sm:text-left">Salva l'eroe per aggiungere il ritratto.</p>}
                    </div>

                    <div className="min-w-0 flex-1 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <StyledInput label="Nome del personaggio" name="name" type="text" value={character.name} onChange={handleFieldChange} placeholder="Es. Eldrin" />
                            <StyledInput label="Giocatore" name="playerName" type="text" value={character.playerName || ''} onChange={handleFieldChange} placeholder="Il tuo nome" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <StyledInput label="Razza" name="race" value={character.race} onChange={handleFieldChange} placeholder="Umano" />
                            <StyledInput label="Background" name="background" value={character.background} onChange={handleFieldChange} placeholder="Sapiente" />
                            <StyledInput label="Allineamento" name="alignment" value={character.alignment} onChange={handleFieldChange} placeholder="Legale Buono" />
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-12">
                    <StyledInput label="Classe e sottoclasse" name="class" value={character.class} onChange={handleFieldChange} placeholder="Mago (Evocazione)" className="lg:col-span-4" />
                    <StatInput
                        label="Livello (1-20)"
                        value={character.level || 1}
                        onChange={(val) => {
                            const lvl = Math.max(1, Math.min(20, Number(val) || 1));
                            const newProf = Math.ceil(lvl / 4) + 1;
                            setCharacter(prev => prev ? { ...prev, level: lvl, proficiencyBonus: newProf } : null);
                        }}
                        className="lg:col-span-2"
                    />
                    <StyledInput label="Punti esperienza" name="experiencePoints" type="number" value={character.experiencePoints} onChange={handleFieldChange} placeholder="0" className="lg:col-span-2" />
                    <div className="lg:col-span-4">
                        <CampaignSelect character={character} setCharacter={setCharacter} onOpenManager={() => setIsCampaignModalOpen(true)} />
                    </div>
                    <StyledInput label="Lingue" name="languages" value={character.languages} onChange={handleFieldChange} placeholder="Comune, Elfico…" className="sm:col-span-2 lg:col-span-12" />
                </div>
            </StyledSection>
            <ImageUploader
                isOpen={isUploaderOpen}
                onClose={() => setIsUploaderOpen(false)}
                onImageReady={handleCharacterImageUpload} />
            <CampaignManagerModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                selectedCampaignId={character.campaignId}
                onSelectCampaign={(camp) => {
                    setCharacter(prev => prev ? {
                        ...prev,
                        campaignId: camp ? camp.id : undefined,
                        campaignName: camp ? camp.name : undefined
                    } : null);
                }}
            />
        </>
    );
};
