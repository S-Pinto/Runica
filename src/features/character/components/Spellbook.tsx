import { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { calculateSpellSaveDC, calculateSpellAttackBonus } from '../rules/combat';
import { PlusCircleIcon, SearchIcon, SparklesIcon } from '../../../components/ui/icons';
import { SpellCard } from './SpellCard';
import { SpellForm } from './spellbook/SpellForm';

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




const SpellbookContent = () => {
  const { character: maybeCharacter, updateCharacter } = useCharacter();
  const character = maybeCharacter!;
  const [editingSpell, setEditingSpell] = useState<Spell | 'new' | null>(null);
  const [expandedSpells, setExpandedSpells] = useState<Record<string, boolean>>({});
  const [deletingSpellId, setDeletingSpellId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


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
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">CD tiro salvezza</span>
          <span className="text-2xl font-bold text-accent font-cinzel">{spellSaveDC}</span>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Bonus d'attacco</span>
          <span className="text-2xl font-bold text-accent font-cinzel">+{spellAttackBonus}</span>
        </div>
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Caratteristica</span>
          <span className="text-2xl font-bold text-foreground font-cinzel">{spellAbility}</span>
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={() => setEditingSpell('new')}
            disabled={editingSpell !== null}
            className="flex flex-col items-center justify-center gap-1 w-full h-full bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircleIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">Aggiungi incantesimo</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 bg-background/30 p-2 rounded-lg border border-border/30">
        <SearchIcon className="w-5 h-5 text-muted-foreground ml-2" />
        <input
          type="text"
          placeholder="Cerca incantesimi…"
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
            <p className="text-muted-foreground font-cinzel">Nessun incantesimo ancora.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Aggiungi il primo incantesimo per iniziare.</p>
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
                    <span className="text-sm font-cinzel text-muted-foreground/50">Trucchetti e rituali</span>
                  ) : (
                    <>
                      <span className="text-sm font-cinzel text-muted-foreground/50">Livello {level}</span>
                    </>
                  )}
                </h4>
                <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">{spells.length} conosciuti</span>
              </div>

              {spells.length === 0 && level > 0 && (
                <div className="p-4 rounded-lg border border-dashed border-border/30 bg-muted/10 text-center">
                  <span className="text-xs text-muted-foreground italic">Nessun incantesimo di questo livello.</span>
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

/** Renders SpellbookContent only once the character is loaded, so its hooks never run conditionally. */
export const Spellbook = () => {
    const { character } = useCharacter();
    return character ? <SpellbookContent /> : null;
};