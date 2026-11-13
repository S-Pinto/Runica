import { useState, useMemo } from 'react';
import { Attack } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { PlusIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { StyledSection } from './ui/StyledInputs';
import { RowActions } from './ui/InlineForm';
import { playEmptyClass } from './play-view/PlaySection';
import { AttackRow } from './AttackRow';
import { AttackForm } from './attacks/AttackForm';
import { buildCharacterActions } from '../rules/attacks';

const DEFAULT_ATTACK: Omit<Attack, 'id'> = {
  name: '',
  bonus: '+0',
  damage: '1d4',
};

const AttackListContent = () => {
  const { character: maybeCharacter, updateCharacter } = useCharacter();
  const character = maybeCharacter!;
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  const handleSaveAttack = (attackData: Attack | Omit<Attack, 'id'>) => {
    let updatedAttacks: Attack[];
    if ('id' in attackData) {
      updatedAttacks = character.attacks.map(f => f.id === attackData.id ? attackData : f);
    } else {
      const newAttack: Attack = { ...attackData, id: `attack_${Date.now()}` };
      updatedAttacks = [...character.attacks, newAttack];
    }
    updateCharacter({ attacks: updatedAttacks });
    setEditingId(null);
  };

  const handleDeleteAttack = (attackId: string) => {
    updateCharacter({ attacks: character.attacks.filter(f => f.id !== attackId) });
  };

  // Stesso motore della vista di gioco e della stampa. Armi, trucchetti e poteri degli oggetti
  // si modificano dalla loro fonte (inventario, incantesimi): qui sono in sola lettura.
  const actions = useMemo(
    () => buildCharacterActions(character, { include: ['weapon', 'item', 'spell', 'custom'] })
      .sort((a, b) => a.name.localeCompare(b.name)),
    [character],
  );

  return (
    <StyledSection
      title="Attacchi e trucchetti"
      action={
        <Button variant="secondary" onClick={() => setEditingId('new')} disabled={editingId !== null}>
          <PlusIcon className="h-4 w-4" /> Aggiungi
        </Button>
      }
    >
      <div className="space-y-3">
        {actions.length === 0 && editingId !== 'new' && (
          <p className={playEmptyClass}>Nessun attacco. Le armi equipaggiate nell'inventario e i trucchetti con danni compaiono qui da soli.</p>
        )}
        {actions.map(action => {
          const attack = action.editable ? character.attacks.find(a => a.id === action.sourceId) : undefined;
          if (attack && editingId === attack.id) {
            return (
              <AttackForm
                key={action.id}
                initialData={attack}
                character={character}
                onSave={handleSaveAttack}
                onCancel={() => setEditingId(null)}
              />
            );
          }
          return (
            <AttackRow
              key={action.id}
              action={action}
              actions={attack ? (
                <RowActions
                  name={attack.name}
                  disabled={editingId !== null}
                  onEdit={() => setEditingId(attack.id)}
                  onDelete={() => handleDeleteAttack(attack.id)}
                />
              ) : undefined}
            />
          );
        })}

        {editingId === 'new' && (
          <AttackForm
            initialData={DEFAULT_ATTACK}
            character={character}
            onSave={handleSaveAttack}
            onCancel={() => setEditingId(null)}
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
