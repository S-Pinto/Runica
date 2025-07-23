import React, { useState, useMemo } from 'react';
import { Attack } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { TrashIcon, EditIcon, PlusCircleIcon } from '../../../components/ui/icons';

const DEFAULT_ATTACK: Omit<Attack, 'id'> = {
  name: '',
  bonus: '+0',
  damage: '1d4',
};

const AttackForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Attack | Omit<Attack, 'id'>;
  onSave: (data: Attack | Omit<Attack, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card/80 p-4 rounded-lg border border-accent/30 space-y-4 mb-4">
      <h3 className="font-cinzel text-lg text-accent">{'id' in initialData ? 'Edit Attack' : 'Add New Attack'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input type="text" placeholder="Attack Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className="w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent sm:col-span-1" />
        <input type="text" placeholder="e.g. +5" value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required className="w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent text-center" />
        <input type="text" placeholder="e.g. (2d6)+(1d4)+3" value={formData.damage} onChange={e => handleChange('damage', e.target.value)} required className="w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent text-center" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded transition">Cancel</button>
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition">Save Attack</button>
      </div>
    </form>
  );
};

export const AttackList = () => {
  const { character, updateCharacter } = useCharacter();
  const [editingAttack, setEditingAttack] = useState<Attack | 'new' | null>(null);

  if (!character) return null;

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
    if (window.confirm('Are you sure you want to delete this attack?')) {
      const updatedAttacks = character.attacks.filter(f => f.id !== attackId);
      updateCharacter({ attacks: updatedAttacks });
    }
  };

  const sortedAttacks = useMemo(() => {
    return [...(character.attacks || [])].sort((a,b) => a.name.localeCompare(b.name));
  }, [character.attacks]);

  return (
    <div className="bg-card/80 p-4 rounded-lg border border-border flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-accent">Attacks & Cantrips</h3>
        <button onClick={() => setEditingAttack('new')} className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground transition">
          <PlusCircleIcon className="w-5 h-5" /> Add Attack
        </button>
      </div>

      {editingAttack && (
        <AttackForm
          initialData={editingAttack === 'new' ? DEFAULT_ATTACK : editingAttack}
          onSave={handleSaveAttack}
          onCancel={() => setEditingAttack(null)}
        />
      )}

      <div className="space-y-2 overflow-y-auto pr-2 -mr-2 flex-grow">
        {sortedAttacks.length === 0 && !editingAttack && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-muted-foreground text-sm py-4">No attacks have been defined.</p>
          </div>
        )}
        {sortedAttacks.map(attack => (
          <div key={attack.id} className="bg-card/50 rounded-lg text-sm">
            <div className="grid grid-cols-6 items-center p-3">
              <span className="font-semibold text-accent col-span-3">{attack.name}</span>
              <span className="font-mono text-foreground col-span-1 text-center">{attack.bonus}</span>
              <span className="font-mono text-foreground col-span-1 text-center">{attack.damage}</span>
              <div className="flex items-center gap-2 justify-end col-span-1">
                <button onClick={() => setEditingAttack(attack)} className="text-muted-foreground hover:text-accent p-1"><EditIcon className="w-4 h-4"/></button>
                <button onClick={() => handleDeleteAttack(attack.id)} className="text-muted-foreground hover:text-destructive p-1"><TrashIcon className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};