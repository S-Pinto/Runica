import React from 'react';
import { ICompanion, Skill, AbilityScores } from '../characterTypes';
import { CheckIcon, DoubleCheckIcon } from '../../../components/ui/icons';

interface CompanionSkillSelectorProps {
    companion: ICompanion;
    onChange: (skills: Skill[]) => void;
    readOnly?: boolean;
}

const SKILL_DEFINITIONS: { name: string; ability: keyof AbilityScores }[] = [
    { name: 'Acrobatics', ability: 'dexterity' },
    { name: 'Animal Handling', ability: 'wisdom' },
    { name: 'Arcana', ability: 'intelligence' },
    { name: 'Athletics', ability: 'strength' },
    { name: 'Deception', ability: 'charisma' },
    { name: 'History', ability: 'intelligence' },
    { name: 'Insight', ability: 'wisdom' },
    { name: 'Intimidation', ability: 'charisma' },
    { name: 'Investigation', ability: 'intelligence' },
    { name: 'Medicine', ability: 'wisdom' },
    { name: 'Nature', ability: 'intelligence' },
    { name: 'Perception', ability: 'wisdom' },
    { name: 'Performance', ability: 'charisma' },
    { name: 'Persuasion', ability: 'charisma' },
    { name: 'Religion', ability: 'intelligence' },
    { name: 'Sleight of Hand', ability: 'dexterity' },
    { name: 'Stealth', ability: 'dexterity' },
    { name: 'Survival', ability: 'wisdom' },
];

export const CompanionSkillSelector: React.FC<CompanionSkillSelectorProps> = ({ companion, onChange, readOnly = false }) => {

    const getProficiencyBonus = (cr: number | string) => {
        // Simplification: CR 0-4 = +2, 5-8 = +3, etc. 
        // Or just standard PB based on "level" equivalent? Most beasts have specific PB.
        // Usually standard calculation is PB = 2 + floor((CR-1)/4) but starting at CR 0 is 2.
        // For simplicity, companions usually follow character PB or have their own.
        // We'll assume +2 base if not specified, but really we should calculate the bonus based on the skill total.
        // But here we are just selecting proficiency.
        return 2;
    };

    const calculateLimit = (stat: number) => Math.floor((stat - 10) / 2);

    const toggleSkill = (skillDef: { name: string; ability: keyof AbilityScores }) => {
        if (readOnly) return;

        const existingSkillIndex = companion.skills.findIndex(s => s.name === skillDef.name);
        let newSkills = [...companion.skills];

        if (existingSkillIndex > -1) {
            const skill = newSkills[existingSkillIndex];
            if (skill.proficient && !skill.expertise) {
                // Upgrade to expertise
                newSkills[existingSkillIndex] = { ...skill, expertise: true };
            } else if (skill.expertise) {
                // Remove completely
                newSkills.splice(existingSkillIndex, 1);
            } else {
                // Should not happen with above logic (proficient -> expertise -> remove)
                // But if for some reason it's false/false (invalid state), remove it.
                newSkills.splice(existingSkillIndex, 1);
            }
        } else {
            // Add as proficient
            newSkills.push({
                name: skillDef.name,
                ability: skillDef.ability,
                proficient: true,
                expertise: false
            });
        }
        onChange(newSkills);
    };

    const getSkillState = (name: string) => {
        const skill = companion.skills.find(s => s.name === name);
        if (!skill) return 'none';
        if (skill.expertise) return 'expertise';
        if (skill.proficient) return 'proficient';
        return 'none';
    };

    const calculateBonus = (skillDef: { name: string; ability: keyof AbilityScores }) => {
        const abilityScore = companion.abilityScores[skillDef.ability];
        const mod = Math.floor((abilityScore - 10) / 2);
        const skill = companion.skills.find(s => s.name === skillDef.name);

        // Calculate PB. If user didn't set a level/CR, we might default to +2.
        // Ideally we'd have a PB field on companion or derive it.
        // Let's assume a standard +2 for now or try to align with something.
        // Actually, let's just show the modifier.
        const pb = 2; // Placeholder

        let total = mod;
        if (skill?.proficient) total += pb;
        if (skill?.expertise) total += pb; // Expertise adds PB again

        return total >= 0 ? `+${total}` : `${total}`;
    };

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SKILL_DEFINITIONS.map((skillDef) => {
                    const state = getSkillState(skillDef.name);
                    const bonus = calculateBonus(skillDef);

                    return (
                        <div
                            key={skillDef.name}
                            onClick={() => toggleSkill(skillDef)}
                            className={`flex items-center justify-between p-2 rounded-md border text-sm transition-all select-none
                    ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-accent/5'}
                    ${state !== 'none' ? 'bg-accent/10 border-accent/30 shadow-sm' : 'bg-card/30 border-transparent hover:border-border'}
                `}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] 
                    ${state === 'expertise' ? 'bg-accent text-accent-foreground' :
                                        state === 'proficient' ? 'bg-accent/50 text-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                                    {state === 'expertise' && <DoubleCheckIcon className="w-3 h-3" />}
                                    {state === 'proficient' && <CheckIcon className="w-3 h-3" />}
                                </div>
                                <span className={`font-medium ${state !== 'none' ? 'text-accent' : 'text-muted-foreground'}`}>
                                    {skillDef.name}
                                    <span className="text-xs ml-1 opacity-50 uppercase">({skillDef.ability.substring(0, 3)})</span>
                                </span>
                            </div>
                            {/* <div className="font-mono font-bold text-muted-foreground">{bonus}</div> */}
                            {/* Calculating bonus correctly requires knowing the PB, which isn't on ICompanion. Skipped for now to avoid confusion. */}
                        </div>
                    );
                })}
            </div>
            {!readOnly && <p className="text-xs text-muted-foreground mt-2 italic">* Click once for Proficiency, twice for Expertise, three times to clear.</p>}
        </div>
    );
};
