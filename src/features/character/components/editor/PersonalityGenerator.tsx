import { useState } from 'react';
import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import * as geminiService from '../../../../services/geminiService';
import { SparklesIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { StyledInput, StyledSection } from '../ui/StyledInputs';

export const PersonalityGenerator = ({ character }: { character: ICharacter }) => {
    const { setCharacter } = useCharacter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [personalityPrompt, setPersonalityPrompt] = useState('');

    const handleGeneratePersonality = async () => {
        setIsGenerating(true);
        try {
            const personalityFields = await geminiService.generatePersonality(character, personalityPrompt);
            setCharacter(prev => ({ ...prev!, ...personalityFields }));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <StyledSection icon={<SparklesIcon className="text-muted-foreground" />} title="Genera la personalità">
            <p className="mb-4 text-sm text-muted-foreground">
                L'IA propone tratti, ideali, legami e difetti per questo personaggio e sostituisce il testo già scritto in quei campi.
            </p>
            <div className="space-y-3">
                <StyledInput
                    label="Tema o spunto"
                    subLabel="Facoltativo"
                    name="aiPrompt"
                    placeholder="Es. «ladro orfano dal passato tragico»"
                    value={personalityPrompt}
                    onChange={(e) => setPersonalityPrompt(e.target.value)}
                />
                <Button variant="secondary" size="lg" onClick={handleGeneratePersonality} disabled={isGenerating} className="w-full rounded-xl">
                    <SparklesIcon className="h-4 w-4" />
                    {isGenerating ? 'Sto tessendo il destino…' : 'Genera con l\'IA'}
                </Button>
            </div>
        </StyledSection>
    );
};
