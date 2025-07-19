import React, { useState, useMemo } from 'react';
import { ICharacter, Attack } from '../characterTypes';
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
  
  const inputClass = "w-full bg-zinc-800 p-2 rounded border border-zinc-600 focus:ring-amber-500 focus:border-amber-500";

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-700/80 p-4 rounded-lg border border-amber-500/30 space-y-4 mb-4">
      <h3 className="font-cinzel text-lg text-amber-400">{'id' in initialData ? 'Edit Attack' : 'Add New Attack'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input type="text" placeholder="Attack Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={`${inputClass} sm:col-span-1`} />
        <input type="text" placeholder="e.g. +5" value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required className={`${inputClass} text-center`} />
        <input type="text" placeholder="e.g. (2d6)+(1d4)+3" value={formData.damage} onChange={e => handleChange('damage', e.target.value)} required className={`${inputClass} text-center`} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-zinc-600 hover:bg-zinc-500 text-white font-bold py-2 px-4 rounded transition">Cancel</button>
        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded transition">Save Attack</button>
      </div>
    </form>
  );
};

export const AttackList = ({ character, onUpdateCharacter }: { character: ICharacter; onUpdateCharacter: (updatedCharacter: ICharacter) => void; }) => {
  const [editingAttack, setEditingAttack] = useState<Attack | 'new' | null>(null);

  const handleSaveAttack = (attackData: Attack | Omit<Attack, 'id'>) => {
    let updatedAttacks: Attack[];
    if ('id' in attackData) {
      updatedAttacks = character.attacks.map(f => f.id === attackData.id ? attackData : f);
    } else {
      const newAttack: Attack = { ...attackData, id: `attack_${Date.now()}` };
      updatedAttacks = [...character.attacks, newAttack];
    }
    onUpdateCharacter({ ...character, attacks: updatedAttacks });
    setEditingAttack(null);
  };

  const handleDeleteAttack = (attackId: string) => {
    if (window.confirm('Are you sure you want to delete this attack?')) {
      const updatedAttacks = character.attacks.filter(f => f.id !== attackId);
      onUpdateCharacter({ ...character, attacks: updatedAttacks });
    }
  };

  const sortedAttacks = useMemo(() => {
    return [...(character.attacks || [])].sort((a,b) => a.name.localeCompare(b.name));
  }, [character.attacks]);

  return (
    <div className="bg-zinc-800/80 p-4 rounded-lg border border-zinc-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-amber-400">Attacks & Cantrips</h3>
        <button onClick={() => setEditingAttack('new')} className="flex items-center gap-2 text-sm bg-amber-600 hover:bg-amber-500 px-3 py-2 rounded-md text-white transition">
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
            <p className="text-center text-zinc-500 text-sm py-4">No attacks have been defined.</p>
          </div>
        )}
        {sortedAttacks.map(attack => (
          <div key={attack.id} className="bg-zinc-700/50 rounded-lg text-sm">
            <div className="grid grid-cols-6 items-center p-3">
              <span className="font-semibold text-amber-300 col-span-3">{attack.name}</span>
              <span className="font-mono text-zinc-300 col-span-1 text-center">{attack.bonus}</span>
              <span className="font-mono text-zinc-300 col-span-1 text-center">{attack.damage}</span>
              <div className="flex items-center gap-2 justify-end col-span-1">
                <button onClick={() => setEditingAttack(attack)} className="text-zinc-400 hover:text-amber-400 p-1"><EditIcon className="w-4 h-4"/></button>
                <button onClick={() => handleDeleteAttack(attack.id)} className="text-zinc-500 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};