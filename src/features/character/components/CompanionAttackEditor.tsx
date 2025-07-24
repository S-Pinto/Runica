import React from 'react';
import { ICompanion, Attack } from '../characterTypes';
import { PlusIcon, TrashIcon } from '../../../components/ui/icons';

interface CompanionAttackEditorProps {
  companion: ICompanion;
  setCompanion: React.Dispatch<React.SetStateAction<ICompanion>>;
  readOnly?: boolean;
}

const createNewAttack = (): Attack => ({ id: `atk_${Date.now()}_${Math.random()}`, name: '', bonus: '', damage: '' });

export const CompanionAttackEditor: React.FC<CompanionAttackEditorProps> = ({ companion, setCompanion, readOnly = false }) => {
  if (readOnly) {
    return (
        <div className="space-y-2">
            <h4 className="text-md font-semibold text-zinc-400 mb-2">Attacks</h4>
            <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
                {companion.attacks.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center italic">No attacks defined.</p>
                ) : (
                    companion.attacks.map((attack, index) => (
                        <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-sm">
                            <p className="font-semibold">{attack.name}</p>
                            <p className="w-20 text-center font-mono">{attack.bonus}</p>
                            <p className="w-24 text-center font-mono">{attack.damage}</p>
                        </div>
                    ))
                )}
            </div>
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
    <div className="space-y-2">
      <h4 className="text-md font-semibold text-zinc-400 mb-2">Attacks</h4>
      <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
        {companion.attacks.map((attack, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
            <input
              type="text"
              placeholder="Attack Name"
              value={attack.name}
              onChange={(e) => handleAttackChange(index, 'name', e.target.value)}
              className="w-full bg-input border border-border rounded-md py-1 px-2 text-sm"
            />
            <input
              type="text"
              placeholder="Bonus"
              value={attack.bonus}
              onChange={(e) => handleAttackChange(index, 'bonus', e.target.value)}
              className="w-20 bg-input border border-border rounded-md py-1 px-2 text-sm text-center"
            />
            <input
              type="text"
              placeholder="Damage"
              value={attack.damage}
              onChange={(e) => handleAttackChange(index, 'damage', e.target.value)}
              className="w-24 bg-input border border-border rounded-md py-1 px-2 text-sm text-center"
            />
            <button onClick={() => deleteAttack(index)} className="p-1 text-muted-foreground hover:text-destructive">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={addAttack} className="w-full flex items-center justify-center gap-1 text-sm text-accent hover:text-primary transition-colors py-1 border border-dashed border-border rounded-md">
          <PlusIcon className="w-4 h-4" /> Add Attack
        </button>
      </div>
    </div>
  );
};