import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { RuneDivider } from '../../../../components/ui/RuneDivider';
import { fieldGroupClass, fieldGroupTitleClass } from '../../../../components/ui/field';
import { StyledSection } from '../ui/StyledInputs';
import { StatInput } from '../StatInput';
import { Spellbook } from '../Spellbook';
import { CustomResourceEditor } from '../CustomResourceEditor';

export const SpellResourcesPanel = ({ character }: { character: ICharacter }) => {
    const { setCharacter, updateCharacter } = useCharacter();

    const handleSpellSlotChange = (level: number, value: number) => {
        setCharacter(prev => {
            if (!prev) return prev;
            const newSlots = { ...prev.spellSlots };
            newSlots[level] = { ...newSlots[level], max: value };
            return { ...prev, spellSlots: newSlots };
        });
    };

    return (
        <>
            <StyledSection title="Slot incantesimo e risorse">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    <div className={fieldGroupClass}>
                        <h4 className={`${fieldGroupTitleClass} mb-3`}>Slot massimi per livello</h4>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
                            {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
                                <StatInput key={level} label={`Livello ${level}`} value={character.spellSlots[level]?.max ?? 0} onChange={(val) => handleSpellSlotChange(level, Number(val))} />
                            ))}
                        </div>
                    </div>
                    <div className={fieldGroupClass}>
                        <CustomResourceEditor character={character} onUpdateCharacter={updateCharacter} />
                    </div>
                </div>
            </StyledSection>

            <RuneDivider />

            <Spellbook />
        </>
    );
};
