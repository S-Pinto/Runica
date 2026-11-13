import React from 'react';
import { ICompanion, Attack } from '../characterTypes';
import { PlusIcon, TrashIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { fieldControlClass, fieldNumericClass } from '../../../components/ui/field';

const DAMAGE_TYPES = [
  'Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic',
  'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'
];

interface CompanionAttackEditorProps {
  companion: ICompanion;
  setCompanion: React.Dispatch<React.SetStateAction<ICompanion>>;
  readOnly?: boolean;
}

const createNewAttack = (): Attack => ({ id: `atk_${Date.now()}_${Math.random()}`, name: '', bonus: '', damage: '' });

export const CompanionAttackEditor: React.FC<CompanionAttackEditorProps> = ({ companion, setCompanion, readOnly = false }) => {
  if (readOnly) {
    return (
      <div>
        <h4 className="mb-2 text-label uppercase text-muted-foreground">Attacchi</h4>
        {companion.attacks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun attacco.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-background/40">
            {companion.attacks.map((attack, index) => (
              <li key={index} className="flex items-baseline gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">{attack.name}</span>
                <span className="font-mono text-base font-bold tabular-nums text-foreground">{attack.bonus}</span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">{attack.damage} {attack.damageType}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const handleAttackChange = (index: number, field: keyof Attack, value: string) => {
    const newAttacks = [...companion.attacks];
    newAttacks[index] = { ...newAttacks[index], [field]: value };
    setCompanion(prev => ({ ...prev, attacks: newAttacks }));
  };

  const addAttack = () => {
    setCompanion(prev => ({ ...prev, attacks: [...prev.attacks, createNewAttack()] }));
  };

  const deleteAttack = (index: number) => {
    setCompanion(prev => ({ ...prev, attacks: prev.attacks.filter((_, i) => i !== index) }));
  };

  return (
    <div>
      <h4 className="mb-2 text-label uppercase text-muted-foreground">Attacchi</h4>
      <div className="space-y-3">
        {companion.attacks.map((attack, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-border bg-background/40 p-2 sm:grid-cols-[1fr_5rem_6rem_9rem_auto] sm:border-0 sm:bg-transparent sm:p-0">
            <input
              type="text"
              aria-label={`Attacco ${index + 1}: nome`}
              placeholder="Nome dell'attacco"
              value={attack.name}
              onChange={(e) => handleAttackChange(index, 'name', e.target.value)}
              className={`${fieldControlClass} col-span-2 sm:col-span-1`}
            />
            <Button variant="ghost" size="icon-lg" aria-label={`Elimina attacco ${index + 1}`} onClick={() => deleteAttack(index)} className="hover:text-destructive sm:order-last">
              <TrashIcon className="h-4 w-4" />
            </Button>
            <input
              type="text"
              aria-label={`Attacco ${index + 1}: bonus`}
              placeholder="Bonus"
              value={attack.bonus}
              onChange={(e) => handleAttackChange(index, 'bonus', e.target.value)}
              className={fieldNumericClass}
            />
            <input
              type="text"
              aria-label={`Attacco ${index + 1}: danni`}
              placeholder="Danni"
              value={attack.damage}
              onChange={(e) => handleAttackChange(index, 'damage', e.target.value)}
              className={fieldNumericClass}
            />
            <select
              aria-label={`Attacco ${index + 1}: tipo di danno`}
              value={attack.damageType || ''}
              onChange={(e) => handleAttackChange(index, 'damageType', e.target.value)}
              className={`${fieldControlClass} col-span-3 sm:col-span-1`}
            >
              <option value="">Tipo</option>
              {DAMAGE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        ))}
        <Button variant="secondary" onClick={addAttack} className="w-full">
          <PlusIcon className="h-4 w-4" /> Aggiungi attacco
        </Button>
      </div>
    </div>
  );
};
