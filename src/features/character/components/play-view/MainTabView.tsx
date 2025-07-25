import React, { useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import * as characterService from '../../characterService';
import { StatBox } from '../ui/StatBox';
import { HPTracker } from './HPTracker';
import { DeathSavesTracker } from './DeathSavesTracker';
import { HitDiceTracker } from './HitDiceTracker';

const MainTabView = () => {
    const { character } = useCharacter();
    
    const passivePerception = useMemo(() => {
        const wisdomMod = getModifier(character.abilityScores.wisdom);
        const perceptionSkill = character.skills.find(s => s.name === 'Perception');
        let bonus = 0;
        if (perceptionSkill) {
            if (perceptionSkill.expertise) bonus = character.proficiencyBonus * 2;
            else if (perceptionSkill.proficient) bonus = character.proficiencyBonus;
        }
        return 10 + wisdomMod + bonus;
    }, [character]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <StatBox 
                    label="Armor Class" 
                    value={useMemo(() => characterService.calculateArmorClass(character), [character])} 
                />
                <StatBox label="Initiative" value={formatModifier(character.initiative)} />
                <StatBox label="Speed" value={`${character.speed}ft`} subValue={`≈ ${Math.round(character.speed * 0.3)}m`} />
                <StatBox label="Proficiency" value={formatModifier(character.proficiencyBonus)} />
                <StatBox label="Passive Perception" value={passivePerception} className="col-span-2 sm:col-span-1" />
            </div>
            <HPTracker />
            <DeathSavesTracker />
            <HitDiceTracker />
            <div className="bg-card p-4 rounded-lg border border-border">
                <h3 className="text-lg font-cinzel text-accent mb-3">Languages</h3>
                <p className="text-foreground whitespace-pre-wrap">{character.languages || 'None'}</p>
            </div>
        </div>
    );
};

export default MainTabView;
