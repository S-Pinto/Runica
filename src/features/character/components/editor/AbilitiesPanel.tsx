import { ICharacter, AbilityScores } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { ABILITY_LABELS, skillLabel } from '../../../../lib/labels';
import { StyledSection } from '../ui/StyledInputs';
import { StarIcon } from '../../../../components/ui/icons';
import { StatInput } from '../StatInput';
import { playInsetClass } from '../play-view/PlaySection';
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

    const name = skillLabel(skill.name);
    const skillBonus = abilityModifier + (skill.proficient ? proficiencyBonus : 0) + (skill.expertise ? proficiencyBonus : 0);
    return (
        <li className="flex min-h-10 items-center gap-3">
            <div className="flex shrink-0 gap-2">
                <input
                    type="checkbox"
                    className="check-rune"
                    checked={skill.proficient}
                    onChange={() => handleSkillProficiencyChange(skill.name)}
                    aria-label={`${name}: competenza`}
                    title="Competenza"
                />
                <input
                    type="checkbox"
                    className="check-rune"
                    checked={skill.expertise}
                    onChange={() => handleSkillExpertiseChange(skill.name)}
                    aria-label={`${name}: maestria`}
                    title="Maestria (competenza doppia)"
                />
            </div>
            <span className={`min-w-0 flex-1 truncate text-sm ${skill.proficient ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{name}</span>
            <span className={`font-mono text-sm font-bold tabular-nums ${skill.proficient ? 'text-accent' : 'text-muted-foreground'}`}>{formatModifier(skillBonus)}</span>
        </li>
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
        <StyledSection icon={<StarIcon className="text-muted-foreground" />} title={ABILITY_LABELS[abilityKey]} className="flex h-full flex-col">
            {/* Il modificatore è il valore che si usa al tavolo: sta in cornice, il punteggio accanto si modifica. */}
            <div className="flex items-end gap-3">
                <div className={`${playInsetClass} flex h-[4.25rem] w-24 shrink-0 flex-col items-center justify-center`}>
                    <span className="font-mono text-numeric tabular-nums text-foreground">{formatModifier(abilityModifier)}</span>
                    <span className="mt-1 text-xs text-muted-foreground">Modificatore</span>
                </div>
                <StatInput
                    label="Punteggio"
                    value={abilityScore}
                    onChange={(val) => handleAbilityScoreChange(abilityKey, Number(val))}
                />
            </div>

            <label
                htmlFor={`saving-throw-${abilityKey}`}
                className={`mt-4 flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-2xl px-3 transition-colors duration-150 ${
                    savingThrow.proficient ? 'bg-accent/15' : 'bg-background/50 hover:bg-background/70'
                }`}
            >
                <input
                    type="checkbox"
                    id={`saving-throw-${abilityKey}`}
                    className="check-rune"
                    checked={savingThrow.proficient}
                    onChange={() => handleSavingThrowProficiencyChange(abilityKey)}
                />
                <span className={`flex-1 text-sm font-semibold ${savingThrow.proficient ? 'text-foreground' : 'text-muted-foreground'}`}>Tiro salvezza</span>
                <span className={`font-mono text-lg font-bold tabular-nums ${savingThrow.proficient ? 'text-accent' : 'text-foreground'}`}>{formatModifier(savingThrowBonus)}</span>
            </label>

            {relevantSkills.length > 0 && (
                <ul className="mt-3">
                    {relevantSkills.map(skill => (
                        <SkillRow key={skill.name} skill={skill} abilityModifier={abilityModifier} proficiencyBonus={proficiencyBonus} />
                    ))}
                </ul>
            )}
        </StyledSection>
    );
};

export const AbilitiesPanel = ({ character, proficiencyBonus }: AbilitiesPanelProps) => (
    <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
            Accanto a ogni abilità, la prima casella segna la competenza, la seconda la maestria (competenza doppia).
        </p>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ABILITIES.map(abilityKey => (
                <AbilityCard key={abilityKey} character={character} abilityKey={abilityKey} proficiencyBonus={proficiencyBonus} />
            ))}
        </div>
    </div>
);
