import React from 'react';
import { ICharacter, AbilityScores } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';

const getModifier = (score: number) => Math.floor((score - 10) / 2);
const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : String(mod));
const ABILITIES: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export const AbilitiesDisplay = () => {
    const { character } = useCharacter();

    if (!character) return null;

    const { proficiencyBonus, abilityScores, savingThrows, skills } = character;

    return (
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <h3 className="text-lg font-cinzel text-amber-400 mb-3 text-center">Abilities</h3>
            <div className="space-y-3">
                {ABILITIES.map(abilityKey => {
                    const abilityScore = abilityScores[abilityKey];
                    const abilityModifier = getModifier(abilityScore);
                    const savingThrow = savingThrows[abilityKey];
                    const savingThrowBonus = abilityModifier + (savingThrow.proficient ? proficiencyBonus : 0);
                    const relevantSkills = skills.filter(s => s.ability === abilityKey);

                    return (
                        <div key={abilityKey} className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-cinzel text-amber-400 capitalize">{abilityKey}</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-mono text-white font-bold">{abilityScore}</span>
                                    <span className="text-2xl font-mono text-amber-300 font-bold">({formatModifier(abilityModifier)})</span>
                                </div>
                            </div>
                            <div className="bg-zinc-800/60 p-2 rounded-md space-y-2">
                                {/* Saving Throw */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full border-2 ${savingThrow.proficient ? 'bg-amber-400 border-amber-200' : 'border-zinc-500'}`}></span>
                                        <span>Saving Throw</span>
                                    </div>
                                    <span className="font-mono font-bold text-base text-white">{formatModifier(savingThrowBonus)}</span>
                                </div>
                                <hr className="border-zinc-700" />
                                {/* Skills */}
                                {relevantSkills.map(skill => {
                                    const skillBonus = abilityModifier + (skill.proficient ? proficiencyBonus : 0) + (skill.expertise ? proficiencyBonus : 0);
                                    let proficiencyIndicatorClass = 'border-zinc-500';
                                    if (skill.expertise) {
                                        proficiencyIndicatorClass = 'bg-white border-white';
                                    } else if (skill.proficient) {
                                        proficiencyIndicatorClass = 'bg-amber-400 border-amber-200';
                                    }

                                    return (
                                        <div key={skill.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full border-2 ${proficiencyIndicatorClass}`}></span>
                                                <span>{skill.name}</span>
                                            </div>
                                            <span className="font-mono font-bold text-base text-white">{formatModifier(skillBonus)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
