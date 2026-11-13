import { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { calculateSpellSaveDC, calculateSpellAttackBonus } from '../rules/combat';
import { PlusIcon, MagnifyingGlassIcon, BookmarkIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { fieldControlClass } from '../../../components/ui/field';
import { ABILITY_SHORT } from '../../../lib/labels';
import { formatModifier } from '../utils/characterUtils';
import { StyledSection } from './ui/StyledInputs';
import { StatBox } from './ui/StatBox';
import { playEmptyClass } from './play-view/PlaySection';
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
  const spellAbility = character.spellcastingAbility ? ABILITY_SHORT[character.spellcastingAbility] : '–';

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
    <StyledSection icon={<BookmarkIcon className="text-muted-foreground" />}
      title="Libro degli incantesimi"
      action={
        <Button variant="secondary" onClick={() => setEditingSpell('new')} disabled={editingSpell !== null}>
          <PlusIcon className="h-4 w-4" /> Aggiungi
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatBox label="CD tiro salvezza" value={spellSaveDC} />
        <StatBox label="Bonus d'attacco" value={formatModifier(spellAttackBonus)} />
        <StatBox label="Caratteristica" value={spellAbility} />
      </div>

      <div className="relative my-5">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          aria-label="Cerca incantesimi"
          placeholder="Cerca incantesimi"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${fieldControlClass} pl-10`}
        />
      </div>

      {editingSpell === 'new' && (
        <SpellForm
          initialData={DEFAULT_SPELL}
          onSave={handleSaveSpell}
          onCancel={() => setEditingSpell(null)}
        />
      )}

      <div className="space-y-6">
        {activeLevels.length === 0 && !editingSpell && (
          <p className={playEmptyClass}>
            {searchTerm ? 'Nessun incantesimo con questo nome.' : 'Nessun incantesimo. Aggiungi il primo per iniziare.'}
          </p>
        )}

        {activeLevels.map(level => {
          const spells = [...(spellsByLevel[level] || [])].sort((a, b) => a.name.localeCompare(b.name));

          return (
            <div key={level}>
              <h4 className="mb-3 flex items-center gap-2 text-label uppercase text-muted-foreground">
                {level === 0 ? 'Trucchetti' : `Livello ${level}`}
                <span className="font-mono tabular-nums">{spells.length}</span>
                <span aria-hidden className="h-px flex-1 bg-border" />
              </h4>

              {spells.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessun incantesimo di questo livello.</p>
              )}

              <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
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
    </StyledSection>
  );
};

/** Renders SpellbookContent only once the character is loaded, so its hooks never run conditionally. */
export const Spellbook = () => {
    const { character } = useCharacter();
    return character ? <SpellbookContent /> : null;
};