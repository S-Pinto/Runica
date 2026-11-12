import { ICharacter, AbilityScores } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { ABILITY_LABELS, skillLabel } from '../../../../lib/labels';
import { StyledSection } from '../ui/StyledInputs';
import { ABILITIES } from './constants';

interface AbilitiesPanelProps {
    character: ICharacter;
    proficiencyBonus: number;
}

type Skill = ICharacter['skills'][number];

const SkillRow = ({ skill, abilityModifier, proficiencyBonus }: { skill: Skill; abilityModifier: number; proficiencyBonus: number }) => {
    const { setCharacter } = useCharacter();

    const handleSkillProficiencyChange = (skillName: string) => {
        setCharacter(prev => {
            if (!prev) return prev;
            const newSkills = prev.skills.map(s => {
                if (s.name === skillName) {
                    const isNowProficient = !s.proficient;
                    const isNowExpertise = isNowProficient ? s.expertise : false;
                    return { ...s, proficient: isNowProficient, expertise: isNowExpertise };
                }
                return s;
            });
            return { ...prev, skills: newSkills };
        });
    };

    const handleSkillExpertiseChange = (skillName: string) => {
        setCharacter(prev => {
            if (!prev) return prev;
            const newSkills = prev.skills.map(s => {
                if (s.name === skillName) {
                    const isNowExpertise = !s.expertise;
                    const isNowProficient = isNowExpertise || s.proficient;
                    return { ...s, proficient: isNowProficient, expertise: isNowExpertise };
                }
                return s;
            });
            return { ...prev, skills: newSkills };
        });
    };

    const skillBonus = abilityModifier + (skill.proficient ? proficiencyBonus : 0) + (skill.expertise ? proficiencyBonus : 0);
    return (
        <div className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-3">
                <div className="flex gap-1">
                    {/* Proficient Checkbox */}
                    <label
                        className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-all ${skill.proficient ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary/50'}`}
                        title="Competenza"
                    >
                        <input type="checkbox" className="hidden" checked={skill.proficient} onChange={() => handleSkillProficiencyChange(skill.name)} />
                        {skill.proficient && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                    </label>
                    {/* Expertise Checkbox */}
                    <label
                        className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-all ${skill.expertise ? 'bg-accent border-accent' : 'border-muted-foreground/40 hover:border-accent/50'}`}
                        title="Maestria (competenza doppia)"
                    >
                        <input type="checkbox" className="hidden" checked={skill.expertise} onChange={() => handleSkillExpertiseChange(skill.name)} />
                        {skill.expertise && <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
                    </label>
                </div>
                <span className={`text-sm transition-colors ${skill.proficient ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{skillLabel(skill.name)}</span>
            </div>
            <span className={`font-mono font-bold text-sm ${skill.proficient ? 'text-accent' : 'text-muted-foreground/70'}`}>{formatModifier(skillBonus)}</span>
        </div>
    );
};

const AbilityCard = ({ character, abilityKey, proficiencyBonus }: { character: ICharacter; abilityKey: keyof AbilityScores; proficiencyBonus: number }) => {
    const { setCharacter } = useCharacter();

    const handleAbilityScoreChange = (ability: keyof AbilityScores, value: number) => {
        setCharacter(prev => ({ ...prev!, abilityScores: { ...prev!.abilityScores, [ability]: value } }));
    };

    const handleSavingThrowProficiencyChange = (ability: keyof AbilityScores) => {
        setCharacter(prev => {
            if (!prev) return prev;
            const newSavingThrows = { ...prev.savingThrows };
            newSavingThrows[ability] = { ...newSavingThrows[ability], proficient: !newSavingThrows[ability].proficient };
            return { ...prev, savingThrows: newSavingThrows };
        });
    };

    const abilityScore = character.abilityScores[abilityKey];
    const abilityModifier = getModifier(abilityScore);
    const savingThrow = character.savingThrows[abilityKey];
    const savingThrowBonus = abilityModifier + (savingThrow.proficient ? proficiencyBonus : 0);
    const relevantSkills = character.skills.filter(s => s.ability === abilityKey);

    return (
        <StyledSection
            className="!p-0 overflow-hidden flex flex-col h-full border-accent/20 hover:border-accent/40 transition-colors duration-300"
        >
            {/* Header Card */}
            <div className="bg-accent/10 p-4 border-b border-accent/20 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    {/* Icona opzionale o pattern qui */}
                    <span className="text-6xl font-cinzel font-bold">{abilityKey.charAt(0).toUpperCase()}</span>
                </div>

                <div className="z-10">
                    <h3 className="text-xl font-cinzel font-bold text-accent">{ABILITY_LABELS[abilityKey]}</h3>
                    <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Punteggio</div>
                </div>

                <div className="z-10 flex flex-col items-center bg-background/50 backdrop-blur-md rounded-xl border border-accent/30 p-2 shadow-sm min-w-[70px]">
                    <span className="text-2xl font-bold text-foreground">{formatModifier(abilityModifier)}</span>
                    <div className="w-8 h-[1px] bg-accent/50 my-1"></div>
                    <input
                        type="number"
                        value={abilityScore}
                        onChange={(e) => handleAbilityScoreChange(abilityKey, Number(e.target.value))}
                        className="w-12 text-center bg-transparent text-sm font-bold text-muted-foreground focus:outline-none focus:text-accent no-spinner"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 flex-grow bg-card/20">
                {/* Saving Throw */}
                <div className={`
                    flex items-center justify-between p-3 rounded-xl border transition-all duration-200
                    ${savingThrow.proficient
                        ? 'bg-accent/10 border-accent/30 shadow-sm'
                        : 'bg-background/30 border-border/40 hover:bg-background/50'}
                `}>
                    <label htmlFor={`saving-throw-${abilityKey}`} className="flex items-center gap-3 cursor-pointer select-none">
                        <div className={`
                            w-5 h-5 rounded-md flex items-center justify-center border transition-colors
                            ${savingThrow.proficient ? 'bg-accent border-accent text-accent-foreground' : 'border-muted-foreground/50 text-transparent'}
                        `}>
                            <input
                                type="checkbox"
                                id={`saving-throw-${abilityKey}`}
                                className="hidden"
                                checked={savingThrow.proficient}
                                onChange={() => handleSavingThrowProficiencyChange(abilityKey)}
                            />
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-wider ${savingThrow.proficient ? 'text-accent' : 'text-muted-foreground'}`}>Tiro salvezza</span>
                    </label>
                    <span className="font-mono font-bold text-lg">{formatModifier(savingThrowBonus)}</span>
                </div>

                {/* Skills Divider */}
                {relevantSkills.length > 0 && <div className="h-px bg-border/40 w-full my-2"></div>}

                {/* Skills List */}
                <div className="space-y-2">
                    {relevantSkills.map(skill => (
                        <SkillRow key={skill.name} skill={skill} abilityModifier={abilityModifier} proficiencyBonus={proficiencyBonus} />
                    ))}
                </div>
            </div>
        </StyledSection>
    );
};

export const AbilitiesPanel = ({ character, proficiencyBonus }: AbilitiesPanelProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ABILITIES.map(abilityKey => (
            <AbilityCard key={abilityKey} character={character} abilityKey={abilityKey} proficiencyBonus={proficiencyBonus} />
        ))}
    </div>
);
