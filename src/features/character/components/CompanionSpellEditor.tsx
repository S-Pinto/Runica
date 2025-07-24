import React from 'react';
import { ICompanion, Spell } from '../characterTypes';
import { PlusIcon, TrashIcon } from '../../../components/ui/icons';

interface CompanionSpellEditorProps {
  companion: ICompanion;
  setCompanion: React.Dispatch<React.SetStateAction<ICompanion>>;
  readOnly?: boolean;
}

const createNewSpell = (): Spell => ({
  id: `spell_${Date.now()}_${Math.random()}`,
  name: '',
  description: '',
  level: 0,
  school: '',
  castingTime: '',
  range: '',
  components: '',
  duration: '',
});

export const CompanionSpellEditor: React.FC<CompanionSpellEditorProps> = ({ companion, setCompanion, readOnly = false }) => {
  if (readOnly) {
    return (
        <div className="space-y-2">
            <h4 className="text-md font-semibold text-zinc-400 mb-2">Spells & Special Abilities</h4>
            <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
                {companion.spells.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center italic">No special abilities defined.</p>
                ) : (
                    companion.spells.map((spell, index) => (
                        <div key={index} className="text-sm border-b border-border/50 pb-2 last:border-b-0">
                            <p className="font-semibold">{spell.name}</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{spell.description}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
  }

  const handleSpellChange = (index: number, field: keyof Spell, value: string) => {
    const newSpells = [...companion.spells];
    newSpells[index] = { ...newSpells[index], [field]: value };
    setCompanion(prev => ({ ...prev, spells: newSpells }));
  };

  const addSpell = () => {
    setCompanion(prev => ({ ...prev, spells: [...prev.spells, createNewSpell()] }));
  };

  const deleteSpell = (index: number) => {
    setCompanion(prev => ({ ...prev, spells: prev.spells.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-2">
      <h4 className="text-md font-semibold text-zinc-400 mb-2">Spells & Special Abilities</h4>
      <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
        {companion.spells.map((spell, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto] gap-2 items-start">
            <div className="space-y-1">
                <input
                    type="text"
                    placeholder="Ability Name"
                    value={spell.name}
                    onChange={(e) => handleSpellChange(index, 'name', e.target.value)}
                    className="w-full bg-input border border-border rounded-md py-1 px-2 text-sm"
                />
                <textarea
                    placeholder="Description"
                    value={spell.description}
                    onChange={(e) => handleSpellChange(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full bg-input border border-border rounded-md py-1 px-2 text-xs resize-y"
                />
            </div>
            <button onClick={() => deleteSpell(index)} className="p-1 text-muted-foreground hover:text-destructive mt-1"><TrashIcon className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={addSpell} className="w-full flex items-center justify-center gap-1 text-sm text-accent hover:text-primary transition-colors py-1 border border-dashed border-border rounded-md">
          <PlusIcon className="w-4 h-4" /> Add Spell/Ability
        </button>
      </div>
    </div>
  );
};