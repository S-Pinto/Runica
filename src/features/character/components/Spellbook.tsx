import React, { useState, useMemo } from 'react';
import { CustomResource, Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { TrashIcon, EditIcon, PlusCircleIcon } from '../../../components/ui/icons';
import { ICharacter } from '../characterTypes';

const DEFAULT_SPELL: Omit<Spell, 'id'> = {
  name: '',
  level: 0,
  school: 'Evocation',
  castingTime: '1 Action',
  range: '60 feet',
  components: 'V, S',
  duration: 'Instantaneous',
  description: '',
};

const SpellForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Spell | Omit<Spell, 'id'>;
  onSave: (data: Spell | Omit<Spell, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: keyof Omit<Spell, 'id'>, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };
  
  const SPELL_SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
  const inputClass = "w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="bg-card/80 p-4 rounded-lg border border-accent/30 space-y-4 mb-6">
        <h3 className="font-cinzel text-lg text-accent">{'id' in initialData ? 'Edit Spell' : 'Add New Spell'}</h3>
        <input type="text" placeholder="Spell Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="number" placeholder="Level" value={formData.level} onChange={e => handleChange('level', parseInt(e.target.value))} min="0" max="9" className={inputClass} />
            <select value={formData.school} onChange={e => handleChange('school', e.target.value)} className={inputClass}>
                {SPELL_SCHOOLS.map(school => <option key={school} value={school}>{school}</option>)}
            </select>
        </div>
        <textarea placeholder="Description" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={`${inputClass} resize-y`}></textarea>
        <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded transition">Cancel</button>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition">Save Spell</button>
        </div>
    </form>
  )
};

const SpellCard = ({ spell, onEdit, onDelete, onToggleExpand, isExpanded }: { spell: Spell; onEdit: () => void; onDelete: () => void; onToggleExpand: () => void; isExpanded: boolean; }) => (
    <div className="bg-card/50 rounded-lg">
        <div className="flex justify-between items-center cursor-pointer p-3" onClick={onToggleExpand}>
            <h4 className="font-bold text-accent">{spell.name}</h4>
             <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground capitalize">{spell.school}</span>
                 <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-muted-foreground hover:text-accent p-1"><EditIcon className="w-4 h-4"/></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive p-1"><TrashIcon className="w-4 h-4"/></button>
            </div>
        </div>
        {isExpanded && (
            <div className="mt-2 pt-3 border-t border-border/50 space-y-2 text-sm p-3 bg-muted/30">
                <p><strong className="text-muted-foreground">Casting Time:</strong> {spell.castingTime}</p>
                <p><strong className="text-muted-foreground">Range:</strong> {spell.range}</p>
                <p><strong className="text-muted-foreground">Components:</strong> {spell.components}</p>
                <p><strong className="text-muted-foreground">Duration:</strong> {spell.duration}</p>
                <p className="text-foreground mt-2 whitespace-pre-wrap">{spell.description}</p>
            </div>
        )}
    </div>
);


export const Spellbook = () => {
  const { character, updateCharacter } = useCharacter();
  const [editingSpell, setEditingSpell] = useState<Spell | 'new' | null>(null);
  const [expandedSpells, setExpandedSpells] = useState<Record<string, boolean>>({});

  if (!character) return null;

  const handleSaveSpell = (spellData: Spell | Omit<Spell, 'id'>) => {
    let updatedSpells: Spell[];
    if ('id' in spellData) {
      updatedSpells = character.spells.map(s => s.id === spellData.id ? spellData : s);
    } else {
      const newSpell: Spell = { ...spellData, id: `spell_${Date.now()}` };
      updatedSpells = [...character.spells, newSpell];
    }
    updateCharacter({ spells: updatedSpells });
    setEditingSpell(null);
  };

  const handleDeleteSpell = (spellId: string) => {
    if (window.confirm('Are you sure you want to delete this spell?')) {
      const updatedSpells = character.spells.filter(s => s.id !== spellId);
      updateCharacter({ spells: updatedSpells });
    }
  };
  
  const toggleExpand = (spellId: string) => {
    setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }));
  };

  const spellsByLevel = useMemo(() => {
    return character.spells.reduce((acc, spell) => {
      acc[spell.level] = [...(acc[spell.level] || []), spell];
      acc[spell.level].sort((a,b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<number, Spell[]>);
  }, [character.spells]);

  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-card/80 p-4 rounded-lg border border-border flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-accent">Spellbook</h3>
        <button onClick={() => setEditingSpell('new')} className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground transition">
            <PlusCircleIcon className="w-5 h-5" /> Add Spell
        </button>
      </div>

      {editingSpell && (
          <SpellForm
            initialData={editingSpell === 'new' ? DEFAULT_SPELL : editingSpell}
            onSave={handleSaveSpell}
            onCancel={() => setEditingSpell(null)}
          />
      )}

      <div className="space-y-6 overflow-y-auto pr-2 -mr-2">
          {character.spells.length === 0 && !editingSpell && (
              <p className="text-center text-muted-foreground text-sm py-8">This character knows no spells. Add one to get started!</p>
          )}
          {sortedLevels.map(level => (
              <div key={level}>
                  <h4 className="text-xl font-serif text-foreground border-b border-border pb-1 mb-3">{level === 0 ? 'Cantrips' : `Level ${level}`}</h4>
                  <div className="space-y-3">
                      {spellsByLevel[level].map(spell => (
                          <SpellCard 
                            key={spell.id}
                            spell={spell}
                            isExpanded={!!expandedSpells[spell.id]}
                            onToggleExpand={() => toggleExpand(spell.id)}
                            onEdit={() => setEditingSpell(spell)}
                            onDelete={() => handleDeleteSpell(spell.id)}
                          />
                      ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};