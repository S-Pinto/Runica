import { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { SearchIcon, XCircleIcon } from '../../../components/ui/icons';
import { SpellCard } from './SpellCard';


export const PlayViewSpellList = () => {
  const { character } = useCharacter();
  const [expandedSpells, setExpandedSpells] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (spellId: string) => {
    setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }));
  };

  const spellsByLevel = useMemo(() => {
    if (!character) return {};
    const filteredSpells = character.spells.filter(spell =>
      spell.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filteredSpells.reduce((acc, spell) => {
      acc[spell.level] = [...(acc[spell.level] || []), spell];
      acc[spell.level].sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<number, Spell[]>);
  }, [character, searchTerm]);

  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

  if (!character) return null;

  return (
    <div className="bg-card/20 backdrop-blur-md p-6 rounded-2xl border border-border/40 flex flex-col h-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-cinzel text-accent drop-shadow-sm">Spellbook</h3>
      </div>
      <div className="mb-8 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search spells..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background/50 backdrop-blur-sm p-3 pl-12 pr-12 rounded-xl border border-border/50 text-base focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition-all shadow-inner"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <XCircleIcon className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        )}
      </div>

      <div className="space-y-10">
        {character.spells.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-muted-foreground text-sm py-8">This character knows no spells.</p>
          </div>
        ) : sortedLevels.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-muted-foreground text-sm py-8">No spells match your search.</p>
          </div>
        ) : (
          sortedLevels.map(level => (
            <div key={level}>
              <h4 className="text-xl font-serif text-foreground border-b border-border pb-1 mb-3">{level === 0 ? 'Cantrips' : `Level ${level}`}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {spellsByLevel[level].map(spell => (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    isExpanded={!!expandedSpells[spell.id]}
                    onToggleExpand={() => toggleExpand(spell.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
