import { useState } from 'react';
import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { useAuth } from '../../../../providers/AuthProvider';
import * as storageService from '../../../../services/storageService';
import { toast } from '../../../../components/ui/Dialogs';
import { PhotoIcon } from '../../../../components/ui/icons';
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

    return (
        <>
            <StyledSection title="Identità">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Portrait */}
                    <div className="relative group self-center sm:self-start">
                        <div className="h-32 w-32 rounded-2xl overflow-hidden bg-muted border-2 border-accent/40 shadow-inner group-hover:border-accent transition-colors">
                            {character.imageUrl ? (
                                <img src={character.imageUrl} alt="Ritratto del personaggio" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <PhotoIcon className="h-full w-full text-muted-foreground/30 p-6" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsUploaderOpen(true)}
                            disabled={isNewCharacter}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm text-xs font-semibold text-foreground hover:text-accent transition-colors disabled:opacity-0"
                            title="Carica o modifica il ritratto"
                        >
                            <PhotoIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Main Character Identity Fields */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StyledInput label="Nome del personaggio" className="text-lg font-bold" name="name" type="text" value={character.name} onChange={handleFieldChange} placeholder="Es. Eldrin" />
                            <StyledInput label="Giocatore" name="playerName" type="text" value={character.playerName || ''} onChange={handleFieldChange} placeholder="Il tuo nome" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StyledInput label="Razza" name="race" value={character.race} onChange={handleFieldChange} placeholder="Umano" />
                            <StyledInput label="Background" name="background" value={character.background} onChange={handleFieldChange} placeholder="Sapiente" />
                            <StyledInput label="Allineamento" name="alignment" value={character.alignment} onChange={handleFieldChange} placeholder="Legale Buono" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-border/30 items-end">
                            <div className="col-span-1 sm:col-span-2">
                                <StyledInput label="Classe e sottoclasse" name="class" value={character.class} onChange={handleFieldChange} placeholder="Mago (Evocazione)" />
                            </div>
                            <div className="col-span-1">
                                <StatInput
                                    label="Livello (1-20)"
                                    value={character.level || 1}
                                    onChange={(val) => {
                                        const lvl = Math.max(1, Math.min(20, Number(val) || 1));
                                        const newProf = Math.ceil(lvl / 4) + 1;
                                        setCharacter(prev => prev ? { ...prev, level: lvl, proficiencyBonus: newProf } : null);
                                    }}
                                    showModifier={false}
                                    className="w-full"
                                />
                            </div>
                            <CampaignSelect character={character} setCharacter={setCharacter} onOpenManager={() => setIsCampaignModalOpen(true)} />
                        </div>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border/30 pt-4 sm:grid-cols-3">
                    <StyledInput label="PE" name="experiencePoints" type="number" value={character.experiencePoints} onChange={handleFieldChange} placeholder="0" />
                    <div className="sm:col-span-2">
                        <StyledInput label="Lingue" name="languages" value={character.languages} onChange={handleFieldChange} placeholder="Comune, Elfico…" />
                    </div>
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
