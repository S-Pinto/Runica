import { ICharacter } from '../../characterTypes';
import { StyledTextArea, StyledSection } from '../ui/StyledInputs';
import { EditIcon, UserCircleIcon } from '../../../../components/ui/icons';
import { useFieldChange } from '../../hooks/useFieldChange';
import { PersonalityGenerator } from './PersonalityGenerator';
import { RuneDivider } from '../../../../components/ui/RuneDivider';
import { playGroupTitleClass } from '../play-view/PlaySection';

export const BioPanel = ({ character }: { character: ICharacter }) => {
    const handleFieldChange = useFieldChange();

    return (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
                <StyledSection icon={<UserCircleIcon className="text-muted-foreground" />} title="Personalità">
                    <div className="space-y-3">
                        <h4 className={playGroupTitleClass}>Tratti e ideali</h4>
                        <StyledTextArea label="Tratti caratteriali" name="personalityTraits" value={character.personalityTraits} onChange={handleFieldChange} />
                        <StyledTextArea label="Ideali" name="ideals" value={character.ideals} onChange={handleFieldChange} />
                    </div>
                    <RuneDivider glyph="notch" className="my-5" />
                    <div className="space-y-3">
                        <h4 className={playGroupTitleClass}>Legami e difetti</h4>
                        <StyledTextArea label="Legami" name="bonds" value={character.bonds} onChange={handleFieldChange} />
                        <StyledTextArea label="Difetti" name="flaws" value={character.flaws} onChange={handleFieldChange} />
                    </div>
                </StyledSection>
            </div>
            <div className="space-y-3 sm:space-y-4">
                <PersonalityGenerator character={character} />

                <StyledSection icon={<EditIcon className="text-muted-foreground" />} title="Note di campagna">
                    <div className="space-y-4">
                        <StyledTextArea label="Note generali" name="notes" value={character.notes} onChange={handleFieldChange} placeholder="Eventi e diario della campagna…" className="min-h-[200px]" />
                        <StyledTextArea label="Note del DM" subLabel="Riservate" name="dmNotes" value={character.dmNotes} onChange={handleFieldChange} placeholder="Note private…" />
                    </div>
                </StyledSection>
            </div>
        </div>
    );
};
