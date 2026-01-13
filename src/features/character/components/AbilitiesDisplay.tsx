import { FC } from 'react';
import { AbilityScores } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { AnimatedBorderCard } from '../../../components/ui/AnimatedBorderCard';

const ABILITIES: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const getModifier = (score: number) => Math.floor((score - 10) / 2);
const formatModifier = (mod: number) => mod >= 0 ? `+${mod}` : mod;

export const AbilitiesDisplay: FC<{ readOnly?: boolean }> = () => {
    const { character } = useCharacter();
    if (!character) return null;

    const { proficiencyBonus, abilityScores, savingThrows, skills } = character;

    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50">
            <h3 className="text-2xl font-cinzel text-accent mb-8 text-center drop-shadow-sm">Ability Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ABILITIES.map(abilityKey => {
                    const abilityScore = (abilityScores as any)[abilityKey] || 10;
                    const abilityModifier = getModifier(abilityScore);
                    const savingThrow = (savingThrows as any)[abilityKey] || { proficient: false };
                    const savingThrowBonus = abilityModifier + (savingThrow.proficient ? proficiencyBonus : 0);
                    const relevantSkills = (skills || []).filter(s => s.ability === abilityKey);

                    return (
                        <AnimatedBorderCard key={abilityKey} className="group shadow-xl shadow-accent/5 p-6 rounded-2xl border border-border/50 space-y-4 hover:shadow-accent/10 transition-all duration-300 bg-background/40">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xl font-cinzel text-accent capitalize group-hover:text-accent-light transition-colors">{abilityKey}</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-mono text-foreground font-bold">{abilityScore}</span>
                                    <span className="text-2xl font-mono text-accent/80 font-bold">({formatModifier(abilityModifier)})</span>
                                </div>
                            </div>
                            <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl space-y-3 border border-border/30">
                                {/* Saving Throw */}
                                <div className="flex items-center justify-between text-sm text-foreground">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${savingThrow.proficient ? 'bg-accent border-accent shadow-[0_0_10px_rgba(var(--color-accent),0.6)]' : 'bg-transparent border-border/60'}`}></span>
                                        <span className="font-medium">Saving Throw</span>
                                    </div>
                                    <span className="font-mono font-bold text-lg text-accent-light">{formatModifier(savingThrowBonus)}</span>
                                </div>
                                <hr className="border-border/20" />
                                {/* Skills */}
                                <div className="space-y-2">
                                    {relevantSkills.map(skill => {
                                        const skillBonus = abilityModifier + (skill.proficient ? proficiencyBonus : 0) + (skill.expertise ? proficiencyBonus : 0);
                                        let proficiencyIndicatorClass = 'bg-transparent border-border/60';
                                        if (skill.expertise) {
                                            proficiencyIndicatorClass = 'bg-accent border-accent ring-2 ring-accent/30 ring-offset-2 ring-offset-muted/60 shadow-[0_0_10px_rgba(var(--color-accent),0.6)]';
                                        } else if (skill.proficient) {
                                            proficiencyIndicatorClass = 'bg-accent border-accent shadow-[0_0_10px_rgba(var(--color-accent),0.4)]';
                                        }

                                        return (
                                            <div key={skill.name} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3 text-foreground/90">
                                                    <span className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${proficiencyIndicatorClass}`}></span>
                                                    <span>{skill.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-lg text-foreground/80">{formatModifier(skillBonus)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </AnimatedBorderCard>
                    );
                })}
            </div>
        </div>
    );
};
