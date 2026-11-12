import { useState } from 'react';
import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import * as geminiService from '../../../../services/geminiService';
import { SparklesIcon } from '../../../../components/ui/icons';
import { StyledInput, StyledSection } from '../ui/StyledInputs';

export const PersonalityGenerator = ({ character }: { character: ICharacter }) => {
    const { setCharacter } = useCharacter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [personalityPrompt, setPersonalityPrompt] = useState('');

    const handleGeneratePersonality = async () => {
        setIsGenerating(true);
        const personalityFields = await geminiService.generatePersonality(character, personalityPrompt);
        setCharacter(prev => ({ ...prev!, ...personalityFields }));
        setIsGenerating(false);
    };

    return (
        <StyledSection title="Generatore IA" className="border-accent/30 bg-accent/5">
            <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-3">Genera la personalità</h3>
            <div className="space-y-3">
                <StyledInput
                    label="Tema o spunto"
                    name="aiPrompt"
                    placeholder="Es. «ladro orfano dal passato tragico», «paladino nobile»"
                    value={personalityPrompt}
                    onChange={(e) => setPersonalityPrompt(e.target.value)}
                />
                <button
                    onClick={handleGeneratePersonality}
                    disabled={isGenerating}
                    className="flex w-full justify-center items-center gap-2 text-sm font-bold uppercase tracking-wider bg-accent/90 hover:bg-accent text-accent-foreground px-4 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                    <SparklesIcon className="w-4 h-4" />
                    {isGenerating ? 'Sto tessendo il destino…' : 'Genera con l\'IA'}
                </button>
            </div>
        </StyledSection>
    );
};
