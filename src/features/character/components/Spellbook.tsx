import React, { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { calculateSpellSaveDC, calculateSpellAttackBonus } from '../characterService';
import { PlusCircleIcon, SearchIcon, SparklesIcon } from '../../../components/ui/icons';
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

  const handleCheckboxChange = (field: 'ritual' | 'concentration' | 'prepared') => {
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
    <form onSubmit={handleSubmit} className="bg-card/80 p-4 rounded-lg border border-accent/30 space-y-4 mb-6 animate-in fade-in slide-in-from-top-2">
      <h3 className="font-cinzel text-lg text-accent">{'id' in initialData ? 'Edit Spell' : 'Add New Spell'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-8">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Name</label>
          <input type="text" placeholder="Spell Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
        </div>
        <div className="sm:col-span-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">School</label>
          <select value={formData.school} onChange={e => handleChange('school', e.target.value)} className={inputClass}>
            {SPELL_SCHOOLS.map(school => <option key={school} value={school}>{school}</option>)}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Level</label>
          <input type="number" placeholder="0" value={formData.level} onChange={e => handleChange('level', parseInt(e.target.value))} min="0" max="9" className={inputClass} />
        </div>


        <div className="sm:col-span-12 flex items-center justify-start gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.ritual ? 'bg-purple-500 border-purple-500 text-white' : 'bg-input border-border'}`}>
              {formData.ritual && <SparklesIcon className="w-3.5 h-3.5" />}
            </div>
            <input type="checkbox" checked={formData.ritual} onChange={() => handleCheckboxChange('ritual')} className="hidden" />
            <span className="group-hover:text-purple-400 transition-colors">Ritual</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.concentration ? 'bg-accent border-accent text-accent-foreground' : 'bg-input border-border'}`}>
              {formData.concentration && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
            </div>
            <input type="checkbox" checked={formData.concentration} onChange={() => handleCheckboxChange('concentration')} className="hidden" />
            <span className="group-hover:text-accent transition-colors">Concentration</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.prepared ? 'bg-blue-500 border-blue-500 text-white' : 'bg-input border-border'}`}>
              {formData.prepared && <div className="w-2.5 h-2.5 rounded-sm bg-current" />}
            </div>
            <input type="checkbox" checked={formData.prepared || false} onChange={() => handleCheckboxChange('prepared')} className="hidden" />
            <span className="group-hover:text-blue-400 transition-colors">Prepared</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Casting Time</label>
          <div className="relative">
            <input
              type="text"
              list="casting-time-options"
              placeholder="Select or type..."
              value={formData.castingTime}
              onChange={e => handleChange('castingTime', e.target.value)}
              className={inputClass}
            />
            <datalist id="casting-time-options">
              <option value="1 Action" />
              <option value="1 Bonus Action" />
              <option value="1 Reaction" />
              <option value="1 Minute" />
              <option value="10 Minutes" />
              <option value="1 Hour" />
              <option value="8 Hours" />
              <option value="24 Hours" />
            </datalist>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Range</label>
          <input type="text" placeholder="e.g. 60 feet" value={formData.range} onChange={e => handleChange('range', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Components</label>
          <input type="text" placeholder="e.g. V, S, M" value={formData.components} onChange={e => handleChange('components', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Duration</label>
          <input type="text" placeholder="e.g. Instantaneous" value={formData.duration} onChange={e => handleChange('duration', e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Description</label>
        <textarea placeholder="Spell description..." value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={`${inputClass} resize-y`}></textarea>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
        <button type="button" onClick={onCancel} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded transition text-sm">Cancel</button>
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition text-sm shadow-sm">Save Spell</button>
      </div>
    </form >
  )
};



export const Spellbook = () => {
  const { character, updateCharacter } = useCharacter();
  const [editingSpell, setEditingSpell] = useState<Spell | 'new' | null>(null);
  const [expandedSpells, setExpandedSpells] = useState<Record<string, boolean>>({});
  const [deletingSpellId, setDeletingSpellId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!character) return null;

  const spellSaveDC = calculateSpellSaveDC(character);
  const spellAttackBonus = calculateSpellAttackBonus(character);
  const spellAbility = character.spellcastingAbility ? character.spellcastingAbility.substring(0, 3).toUpperCase() : '???';

  const handleSaveSpell = (spellData: Spell | Omit<Spell, 'id'>) => {
    let updatedSpells: Spell[];
    if ('id' in spellData) {
      updatedSpells = character.spells.map(s => s.id === spellData.id ? spellData : s);
    } else {
      const newSpell: Spell = { ...spellData, id: `spell_${Date.now()}` };
      updatedSpells = [...character.spells, newSpell];

      // Auto-expand new spells or ensure the list updates nicely
    }
    updateCharacter({ spells: updatedSpells });
    setEditingSpell(null);
  };

  const handleDeleteSpell = (spellId: string) => {
    const updatedSpells = character.spells.filter(s => s.id !== spellId);
    updateCharacter({ spells: updatedSpells });
    setDeletingSpellId(null);
  };

  const handleTogglePrepared = (spellId: string) => {
    const updatedSpells = character.spells.map(s => s.id === spellId ? { ...s, prepared: !s.prepared } : s);
    updateCharacter({ spells: updatedSpells });
  };



  const toggleExpand = (spellId: string) => {
    setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }));
  };

  const filteredSpells = useMemo(() => {
    if (!searchTerm) return character.spells;
    const lowerSearch = searchTerm.toLowerCase();
    return character.spells.filter(s => s.name.toLowerCase().includes(lowerSearch));
  }, [character.spells, searchTerm]);

  const spellsByLevel = useMemo(() => {
    return filteredSpells.reduce((acc, spell) => {
      acc[spell.level] = [...(acc[spell.level] || []), spell];
      return acc;
    }, {} as Record<number, Spell[]>);
  }, [filteredSpells]);

  // Determine which levels to show: those with spells OR those with max slots > 0
  const activeLevels = useMemo(() => {
    const levels = new Set<number>();
    Object.keys(spellsByLevel).forEach(l => levels.add(Number(l)));
    if (character.spellSlots) {
      Object.entries(character.spellSlots).forEach(([lvl, data]) => {
        if (data.max > 0) levels.add(Number(lvl));
      });
    }
    return Array.from(levels).sort((a, b) => a - b);
  }, [spellsByLevel, character.spellSlots]);


  return (
    <div className="bg-card/80 p-6 rounded-xl border border-border flex flex-col h-full shadow-lg">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border/40">
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Save DC</span>
          <span className="text-2xl font-bold text-accent font-cinzel">{spellSaveDC}</span>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Attack Bonus</span>
          <span className="text-2xl font-bold text-accent font-cinzel">+{spellAttackBonus}</span>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Ability</span>
          <span className="text-2xl font-bold text-foreground font-cinzel">{spellAbility}</span>
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={() => setEditingSpell('new')}
            disabled={editingSpell !== null}
            className="flex flex-col items-center justify-center gap-1 w-full h-full bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircleIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">Add Spell</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 bg-background/30 p-2 rounded-lg border border-border/30">
        <SearchIcon className="w-5 h-5 text-muted-foreground ml-2" />
        <input
          type="text"
          placeholder="Search spells..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-muted-foreground/70"
        />
      </div>

      {editingSpell && (
        <SpellForm
          initialData={editingSpell === 'new' ? DEFAULT_SPELL : editingSpell}
          onSave={handleSaveSpell}
          onCancel={() => setEditingSpell(null)}
        />
      )}

      <div className="space-y-8 overflow-y-auto pr-2 -mr-2 flex-grow scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {activeLevels.length === 0 && !editingSpell && (
          <div className="text-center py-12 px-6 flex flex-col items-center">
            <SparklesIcon className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-cinzel">No spells recorded yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your first spell to verify your wizardry!</p>
          </div>
        )}

        {activeLevels.map(level => {
          const spells = spellsByLevel[level] || [];
          // Sort spells alphabetically
          spells.sort((a, b) => a.name.localeCompare(b.name));

          return (
            <div key={level} className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2 sticky top-0 bg-card/95 backdrop-blur-sm z-10 py-2">
                <h4 className="text-lg font-cinzel text-foreground flex items-center gap-3">
                  {level === 0 ? (
                    <span className="text-sm font-cinzel text-muted-foreground/50">Cantrips & Rituals</span>
                  ) : (
                    <>
                      <span className="text-sm font-cinzel text-muted-foreground/50">Level {level}</span>
                    </>
                  )}
                </h4>
                <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">{spells.length} known</span>
              </div>

              {spells.length === 0 && level > 0 && (
                <div className="p-4 rounded-lg border border-dashed border-border/30 bg-muted/10 text-center">
                  <span className="text-xs text-muted-foreground italic">No spells learned for this level.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {spells.map(spell =>
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
                      onTogglePrepared={() => handleTogglePrepared(spell.id)}
                    />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};