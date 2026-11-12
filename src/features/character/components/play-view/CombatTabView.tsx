import { useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Attack, EquipmentItem } from '../../characterTypes';
import { AttacksAndCantrips } from './combat/AttacksAndCantrips';
import { FeaturesList } from './combat/FeaturesList';
import { ActiveMagicItems } from './combat/ActiveMagicItems';

const CombatTabViewContent = () => {
    const { character: maybeCharacter, updateCharacter } = useCharacter();
    const character = maybeCharacter!;


    const attacks = useMemo(() => {
        const customAttacks = character.attacks || [];
        const equippedWeapons: Attack[] = (character.equipment || [])
            .filter(item => item.equipped && (item.itemType === 'weapon' || Boolean(item.damage)))
            .map(item => ({
                id: item.id,
                name: item.name,
                bonus: item.attackBonus || '+0',
                damage: item.damage || '1d6',
                damageType: item.damageType || 'Slashing',
                mastery: item.mastery || '',
                properties: item.properties || [],
                attackAbility: item.attackAbility || 'str',
                damageAbility: item.damageAbility || 'str',
                isProficient: item.isProficient ?? true,
            }));

        const all = [...customAttacks];
        equippedWeapons.forEach(wAtk => {
            if (!all.some(a => a.id === wAtk.id || a.name.toLowerCase() === wAtk.name.toLowerCase())) {
                all.push(wAtk);
            }
        });

        return all.sort((a, b) => a.name.localeCompare(b.name));
    }, [character.attacks, character.equipment]);

    const features = useMemo(() => [...(character.featuresAndTraits || [])].sort((a, b) => a.name.localeCompare(b.name)), [character.featuresAndTraits]);

    // Calculate Proficiency Bonus (Level 1-4 = +2, 5-8 = +3, etc.)
    const proficiencyBonus = Math.ceil((character.level || 1) / 4) + 1;

    const handleUpdateEquipment = (newEquipment: EquipmentItem[]) => {
        updateCharacter({ equipment: newEquipment });
    };

    return (
        <div className="space-y-6">
            {/* Active Magic Items Bar if any equipped magic item has charges */}
            <ActiveMagicItems equipment={character.equipment || []} onUpdate={handleUpdateEquipment} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AttacksAndCantrips items={attacks} abilityScores={character.abilityScores} proficiencyBonus={proficiencyBonus} />
                <FeaturesList items={features} />
            </div>
        </div>
    );
};

/** Renders CombatTabViewContent only once the character is loaded, so its hooks never run conditionally. */
const CombatTabView = () => {
    const { character } = useCharacter();
    return character ? <CombatTabViewContent /> : null;
};

export default CombatTabView;
