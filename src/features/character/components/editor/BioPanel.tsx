import { ICharacter } from '../../characterTypes';
import { StyledTextArea, StyledSection } from '../ui/StyledInputs';
import { useFieldChange } from '../../hooks/useFieldChange';
import { PersonalityGenerator } from './PersonalityGenerator';

export const BioPanel = ({ character }: { character: ICharacter }) => {
    const handleFieldChange = useFieldChange();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <StyledSection title="Personalità">
                    <div className="space-y-4">
                        <StyledTextArea label="Tratti caratteriali" name="personalityTraits" value={character.personalityTraits} onChange={handleFieldChange} />
                        <StyledTextArea label="Ideali" name="ideals" value={character.ideals} onChange={handleFieldChange} />
                        <StyledTextArea label="Legami" name="bonds" value={character.bonds} onChange={handleFieldChange} />
                        <StyledTextArea label="Difetti" name="flaws" value={character.flaws} onChange={handleFieldChange} />
                    </div>
                </StyledSection>
            </div>
            <div className="space-y-6">
                <PersonalityGenerator character={character} />

                <StyledSection title="Note di campagna">
                    <div className="space-y-4">
                        <StyledTextArea label="Note generali" name="notes" value={character.notes} onChange={handleFieldChange} placeholder="Eventi e diario della campagna…" className="min-h-[200px]" />
                        <StyledTextArea label="Note del DM" subLabel="Riservate" name="dmNotes" value={character.dmNotes} onChange={handleFieldChange} placeholder="Note private…" />
                    </div>
                </StyledSection>
            </div>
        </div>
    );
};
