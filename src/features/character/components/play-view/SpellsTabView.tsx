import React from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { StatBox } from '../ui/StatBox';
import { ResourceTracker } from './ResourceTracker';
import { PlayViewSpellList } from '../PlayViewSpellList';
import { SparklesIcon } from '../../../../components/ui/icons';

const SpellsTabView = () => {
    const { character, updateCharacter } = useCharacter();
    if (!character) return null;
    const spellcastingAbility = character.spellcastingAbility;
    const spellcastingModifier = spellcastingAbility ? getModifier(character.abilityScores[spellcastingAbility]) : 0;
    const spellSaveDC = spellcastingAbility ? 8 + character.proficiencyBonus + spellcastingModifier : '-';
    const spellAttackBonus = spellcastingAbility ? character.proficiencyBonus + spellcastingModifier : 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <SparklesIcon className="w-24 h-24 text-accent" />
                    </div>

                    <h3 className="text-xl font-cinzel text-accent mb-6 text-center flex items-center justify-center gap-2 relative z-10">
                        <SparklesIcon className="w-5 h-5 text-accent" />
                        Spellcasting
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                            <StatBox
                                label="Save DC"
                                value={spellSaveDC}
                                className="bg-background/40 border-border/40 hover:border-accent/30 transition-colors"
                            />
                            <StatBox
                                label="Attack Bonus"
                                value={formatModifier(spellAttackBonus)}
                                className="bg-background/40 border-border/40 hover:border-accent/30 transition-colors"
                            />
                        </div>

                        <div className="bg-background/40 rounded-xl p-3 border border-border/40 text-center relative overflow-hidden">
                            {spellcastingAbility ? (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Spellcasting Ability</p>
                                    <p className="text-2xl font-cinzel font-bold text-foreground capitalize">{spellcastingAbility}</p>
                                    <p className="text-sm font-mono text-accent font-bold mt-1">({formatModifier(spellcastingModifier)})</p>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-sm italic py-2">No spellcasting ability set</p>
                            )}
                        </div>
                    </div>
                </div>
                <ResourceTracker title="Spell Slots" slots={character.spellSlots} onSlotChange={(newSlots) => updateCharacter({ spellSlots: newSlots })} />
                {character.customResources && character.customResources.length > 0 && (
                    <ResourceTracker title="Other Resources" slots={character.customResources} onSlotChange={(newResources) => updateCharacter({ customResources: newResources })} isCustom />
                )}
            </div>
            <PlayViewSpellList />
        </div>
    );
};

export default SpellsTabView;