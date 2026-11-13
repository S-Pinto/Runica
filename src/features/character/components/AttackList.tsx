import { useState, useMemo } from 'react';
import { Attack } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { PlusIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { StyledSection } from './ui/StyledInputs';
import { RowActions } from './ui/InlineForm';
import { playEmptyClass } from './play-view/PlaySection';
import { AttackRow } from './AttackRow';

const DEFAULT_ATTACK: Omit<Attack, 'id'> = {
  name: '',
  bonus: '+0',
  damage: '1d4',
};

import { AttackForm } from './attacks/AttackForm';

const AttackListContent = () => {
  const { character: maybeCharacter, updateCharacter } = useCharacter();
  const character = maybeCharacter!;
  const [editingAttack, setEditingAttack] = useState<Attack | 'new' | null>(null);


  const handleSaveAttack = (attackData: Attack | Omit<Attack, 'id'>) => {
    let updatedAttacks: Attack[];
    if ('id' in attackData) {
      updatedAttacks = character.attacks.map(f => f.id === attackData.id ? attackData : f);
    } else {
      const newAttack: Attack = { ...attackData, id: `attack_${Date.now()}` };
      updatedAttacks = [...character.attacks, newAttack];
    }
    updateCharacter({ attacks: updatedAttacks });
    setEditingAttack(null);
  };

  const handleDeleteAttack = (attackId: string) => {
    const updatedAttacks = character.attacks.filter(f => f.id !== attackId);
    updateCharacter({ attacks: updatedAttacks });
  };

  const sortedAttacks = useMemo(() => {
    const custom = character.attacks || [];
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

    const all = [...custom];
    equippedWeapons.forEach(wAtk => {
      if (!all.some(a => a.id === wAtk.id || a.name.toLowerCase() === wAtk.name.toLowerCase())) {
        all.push(wAtk);
      }
    });
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }, [character.attacks, character.equipment]);

  return (
    <StyledSection
      title="Attacchi e trucchetti"
      action={
        <Button variant="secondary" onClick={() => setEditingAttack('new')} disabled={editingAttack !== null}>
          <PlusIcon className="h-4 w-4" /> Aggiungi
        </Button>
      }
    >
      <div className="space-y-3">
        {sortedAttacks.length === 0 && editingAttack !== 'new' && (
          <p className={playEmptyClass}>Nessun attacco. Le armi equipaggiate nell'inventario compaiono qui da sole.</p>
        )}
        {sortedAttacks.map(attack =>
          editingAttack && typeof editingAttack === 'object' && editingAttack.id === attack.id ? (
            <AttackForm
              key={attack.id}
              initialData={editingAttack}
              character={character}
              onSave={handleSaveAttack}
              onCancel={() => setEditingAttack(null)}
            />
          ) : (
            <AttackRow
              key={attack.id}
              attack={attack}
              abilityScores={character.abilityScores}
              proficiencyBonus={character.proficiencyBonus}
              actions={
                <RowActions
                  name={attack.name}
                  disabled={editingAttack !== null}
                  onEdit={() => setEditingAttack(attack)}
                  onDelete={() => handleDeleteAttack(attack.id)}
                />
              }
            />
          )
        )}

        {editingAttack === 'new' && (
          <AttackForm
            initialData={DEFAULT_ATTACK}
            character={character}
            onSave={handleSaveAttack}
            onCancel={() => setEditingAttack(null)}
          />
        )}
      </div>
    </StyledSection>
  );
};

/** Renders AttackListContent only once the character is loaded, so its hooks never run conditionally. */
export const AttackList = () => {
    const { character } = useCharacter();
    return character ? <AttackListContent /> : null;
};