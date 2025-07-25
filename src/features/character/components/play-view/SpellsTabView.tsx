import React from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { StatBox } from '../ui/StatBox';
import { ResourceTracker } from './ResourceTracker';
import { PlayViewSpellList } from '../PlayViewSpellList';

const SpellsTabView = () => {
    const { character, updateCharacter } = useCharacter();
    const spellcastingAbility = character.spellcastingAbility;
    const spellcastingModifier = spellcastingAbility ? getModifier(character.abilityScores[spellcastingAbility]) : 0;
    const spellSaveDC = spellcastingAbility ? 8 + character.proficiencyBonus + spellcastingModifier : '-';
    const spellAttackBonus = spellcastingAbility ? character.proficiencyBonus + spellcastingModifier : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="text-lg font-cinzel text-accent mb-3 text-center">Spellcasting</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <StatBox label="Save DC" value={spellSaveDC} />
                        <StatBox label="Attack Bonus" value={formatModifier(spellAttackBonus)} />
                        <div className="col-span-2 text-center">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Ability</p>
                            <p className="text-xl font-bold text-foreground capitalize">{spellcastingAbility || 'None'}</p>
                        </div>
                    </div>
                 </div>
                 <ResourceTracker title="Spell Slots" slots={character.spellSlots} onSlotChange={(newSlots) => updateCharacter({ spellSlots: newSlots })} />
                 {character.customResources && character.customResources.length > 0 && (
                     <ResourceTracker title="Other Resources" slots={character.customResources} onSlotChange={(newResources) => updateCharacter({ customResources: newResources })} isCustom />
                 )}
            </div>
            <div className="lg:col-span-2">
                <PlayViewSpellList />
            </div>
        </div>
    );
};

export default SpellsTabView;