import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-background/20 rounded-xl p-4 border border-border/40">
                        <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-4">Slot incantesimo massimi</label>
                        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
                            {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
                                <StatInput key={level} label={`Lvl ${level}`} value={character.spellSlots[level]?.max ?? 0} onChange={(val) => handleSpellSlotChange(level, Number(val))} />
                            ))}
                        </div>
                    </div>
                    <div className="bg-background/20 rounded-xl p-4 border border-border/40">
                        <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-4">Risorse personalizzate</label>
                        <CustomResourceEditor character={character} onUpdateCharacter={updateCharacter} />
                    </div>
                </div>
            </StyledSection>

            <div className="pt-2">
                <Spellbook />
            </div>
        </>
    );
};
