import { useState, useMemo } from 'react';
import { Attack } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { TrashIcon, EditIcon, PlusCircleIcon, CheckIcon, XMarkIcon } from '../../../components/ui/icons';
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
  const [deletingAttackId, setDeletingAttackId] = useState<string | null>(null);


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
    setDeletingAttackId(null);
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
    <div className="bg-card/80 p-4 rounded-lg border border-border flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-accent">Attacchi e trucchetti</h3>
        <button
          onClick={() => setEditingAttack('new')}
          disabled={editingAttack !== null}
          className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground transition disabled:bg-muted disabled:cursor-not-allowed"
        >
          <PlusCircleIcon className="w-5 h-5" /> Aggiungi attacco
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto pr-2 -mr-2 flex-grow">
        {sortedAttacks.length === 0 && editingAttack !== 'new' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-muted-foreground text-sm py-4">Nessun attacco ancora.</p>
          </div>
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
                deletingAttackId === attack.id ? (
                  <>
                    <span className="text-xs text-destructive-foreground">Sicuro?</span>
                    <button onClick={() => handleDeleteAttack(attack.id)} className="text-destructive hover:text-destructive-foreground p-1"><CheckIcon className="w-4 h-4" /></button>
                    <button onClick={() => setDeletingAttackId(null)} className="text-muted-foreground hover:text-accent p-1"><XMarkIcon className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingAttack(attack); setDeletingAttackId(null); }} disabled={editingAttack !== null} className="text-muted-foreground hover:text-accent p-1 disabled:text-muted-foreground/50 disabled:cursor-not-allowed"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => { setDeletingAttackId(attack.id); setEditingAttack(null); }} disabled={editingAttack !== null} className="text-muted-foreground hover:text-destructive p-1 disabled:text-muted-foreground/50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button>
                  </>
                )
              }
            />
          )
        )}

        {editingAttack === 'new' && (
          <div className="mt-4">
            <AttackForm
              initialData={DEFAULT_ATTACK}
              character={character}
              onSave={handleSaveAttack}
              onCancel={() => setEditingAttack(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/** Renders AttackListContent only once the character is loaded, so its hooks never run conditionally. */
export const AttackList = () => {
    const { character } = useCharacter();
    return character ? <AttackListContent /> : null;
};