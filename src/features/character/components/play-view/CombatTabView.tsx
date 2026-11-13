import { useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { EquipmentItem } from '../../characterTypes';
import { buildCharacterActions, spendActionUse, type ResolvedAction } from '../../rules/attacks';
import { consumeAmmunition } from '../../rules/equipment';
import { toast } from '../../../../components/ui/Dialogs';
import { AttacksAndCantrips } from './combat/AttacksAndCantrips';
import { FeaturesList } from './combat/FeaturesList';
import { ActiveMagicItems } from './combat/ActiveMagicItems';

const CombatTabViewContent = () => {
    const { character: maybeCharacter, updateCharacter } = useCharacter();
    const character = maybeCharacter!;

    // Stesso motore della Stampa e dell'editor: armi equipaggiate, poteri degli oggetti, trucchetti e attacchi manuali.
    const attacks = useMemo(
        () => buildCharacterActions(character, { include: ['weapon', 'item', 'spell', 'custom'] })
            .sort((a, b) => a.name.localeCompare(b.name)),
        [character],
    );

    const features = useMemo(() => [...(character.featuresAndTraits || [])].sort((a, b) => a.name.localeCompare(b.name)), [character.featuresAndTraits]);

    const handleUpdateEquipment = (newEquipment: EquipmentItem[]) => {
        updateCharacter({ equipment: newEquipment });
    };

    const handleAttackRolled = (action: ResolvedAction) => {
        if (!action.ammo) return;
        const result = consumeAmmunition(character.equipment || [], action.ammo.itemId);
        if (!result) return;
        if (result.empty) {
            toast.info(`${action.ammo.name}: munizioni esaurite. Aggiorna la quantità nell'inventario.`);
            return;
        }
        updateCharacter({ equipment: result.equipment });
        if (result.remaining === 0) toast.info(`Hai usato l'ultima munizione (${action.ammo.name}).`);
    };

    const handleSpendUse = (action: ResolvedAction, delta: number) => {
        const patch = spendActionUse(character, action, delta);
        if (Object.keys(patch).length) updateCharacter(patch);
    };

    return (
        <div className="space-y-6">
            {/* Oggetti magici equipaggiati con cariche */}
            <ActiveMagicItems equipment={character.equipment || []} onUpdate={handleUpdateEquipment} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AttacksAndCantrips items={attacks} onAttackRolled={handleAttackRolled} onSpendUse={handleSpendUse} />
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
