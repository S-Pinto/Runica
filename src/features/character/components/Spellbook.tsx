import React, { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { PlusCircleIcon } from '../../../components/ui/icons';
import { SpellCard } from './SpellCard';

const DEFAULT_SPELL: Omit<Spell, 'id'> = {
  name: '',
  level: 0,
  school: 'Evocation',
  castingTime: '1 Action',
  range: '60 feet',
  components: 'V, S',
  duration: 'Instantaneous',
  description: '',
  ritual: false,
  concentration: false,
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

  const handleChange = (field: keyof Omit<Spell, 'id'>, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: 'ritual' | 'concentration') => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input type="text" placeholder="Spell Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={`${inputClass} sm:col-span-3`} />
        <input type="number" placeholder="Level" value={formData.level} onChange={e => handleChange('level', parseInt(e.target.value))} min="0" max="9" className={inputClass} />
        <select value={formData.school} onChange={e => handleChange('school', e.target.value)} className={inputClass}>
          {SPELL_SCHOOLS.map(school => <option key={school} value={school}>{school}</option>)}
        </select>
        <div className="flex items-center justify-around gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.ritual} onChange={() => handleCheckboxChange('ritual')} className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-input" />
            Ritual
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={formData.concentration} onChange={() => handleCheckboxChange('concentration')} className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-input" />
            Concentration
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" placeholder="Casting Time" value={formData.castingTime} onChange={e => handleChange('castingTime', e.target.value)} className={inputClass} />
        <input type="text" placeholder="Range" value={formData.range} onChange={e => handleChange('range', e.target.value)} className={inputClass} />
        <input type="text" placeholder="Components (V, S, M)" value={formData.components} onChange={e => handleChange('components', e.target.value)} className={inputClass} />
        <input type="text" placeholder="Duration" value={formData.duration} onChange={e => handleChange('duration', e.target.value)} className={inputClass} />
      </div>
      <textarea placeholder="Description" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={`${inputClass} resize-y`}></textarea>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded transition">Cancel</button>
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition">Save Spell</button>
      </div>
    </form>
  )
};

export const Spellbook = () => {
  const { character, updateCharacter } = useCharacter();
  const [editingSpell, setEditingSpell] = useState<Spell | 'new' | null>(null);
  const [expandedSpells, setExpandedSpells] = useState<Record<string, boolean>>({});
  const [deletingSpellId, setDeletingSpellId] = useState<string | null>(null);

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
    const updatedSpells = character.spells.filter(s => s.id !== spellId);
    updateCharacter({ spells: updatedSpells });
    setDeletingSpellId(null);
  };

  const toggleExpand = (spellId: string) => {
    setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }));
  };

  const spellsByLevel = useMemo(() => {
    return character.spells.reduce((acc, spell) => {
      acc[spell.level] = [...(acc[spell.level] || []), spell];
      acc[spell.level].sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<number, Spell[]>);
  }, [character.spells]);

  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-card/80 p-4 rounded-lg border border-border flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-accent">Spellbook</h3>
        <button
          onClick={() => setEditingSpell('new')}
          disabled={editingSpell !== null}
          className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground transition disabled:bg-muted disabled:cursor-not-allowed"
        >
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

      <div className="space-y-6 overflow-y-auto pr-2 -mr-2 flex-grow">
        {character.spells.length === 0 && !editingSpell && (
          <p className="text-center text-muted-foreground text-sm py-8">This character knows no spells. Add one to get started!</p>
        )}
        {sortedLevels.map(level => (
          <div key={level} className="space-y-4">
            <h4 className="text-xl font-serif text-foreground border-b border-border pb-1">{level === 0 ? 'Cantrips' : `Level ${level}`}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {spellsByLevel[level].map(spell =>
                editingSpell && typeof editingSpell === 'object' && editingSpell.id === spell.id ? (
                  <div key={spell.id} className="md:col-span-2 xl:col-span-3">
                    <SpellForm
                      initialData={editingSpell}
                      onSave={handleSaveSpell}
                      onCancel={() => setEditingSpell(null)}
                    />
                  </div>
                ) : (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    isExpanded={!!expandedSpells[spell.id]}
                    onToggleExpand={() => toggleExpand(spell.id)}
                    onEdit={() => { setEditingSpell(spell); setDeletingSpellId(null); }}
                    onDelete={() => { setDeletingSpellId(spell.id); setEditingSpell(null); }}
                    isDeleting={deletingSpellId === spell.id}
                    onConfirmDelete={() => handleDeleteSpell(spell.id)}
                    onCancelDelete={() => setDeletingSpellId(null)}
                    isEditingActive={editingSpell !== null}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};