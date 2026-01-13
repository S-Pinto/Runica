import { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { SearchIcon, XCircleIcon } from '../../../components/ui/icons';
import { SpellCard } from './SpellCard';


export const PlayViewSpellList = () => {
  const { character, updateCharacter } = useCharacter();
  const [expandedSpells, setExpandedSpells] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [castingTimeFilter, setCastingTimeFilter] = useState<'all' | 'action' | 'bonus' | 'reaction'>('all');
  const [showPreparedOnly, setShowPreparedOnly] = useState(false);

  const toggleExpand = (spellId: string) => {
    setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }));
  };

  const handleTogglePrepared = (spellId: string) => {
    if (!character) return;
    const updatedSpells = character.spells.map(s =>
      s.id === spellId ? { ...s, prepared: !s.prepared } : s
    );
    updateCharacter({ spells: updatedSpells });
  };

  const spellsByLevel = useMemo(() => {
    if (!character) return {};

    const filteredSpells = character.spells.filter(spell => {
      const matchesSearch = spell.name.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (castingTimeFilter === 'action') {
        matchesFilter = spell.castingTime.toLowerCase().includes('1 action');
      } else if (castingTimeFilter === 'bonus') {
        matchesFilter = spell.castingTime.toLowerCase().includes('bonus');
      } else if (castingTimeFilter === 'reaction') {
        matchesFilter = spell.castingTime.toLowerCase().includes('reaction');
      }

      const matchesPrepared = showPreparedOnly ? (spell.level === 0 || spell.prepared) : true; // Always show cantrips or if prepared check is off

      return matchesSearch && matchesFilter && matchesPrepared;
    });

    return filteredSpells.reduce((acc, spell) => {
      acc[spell.level] = [...(acc[spell.level] || []), spell];
      acc[spell.level].sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<number, Spell[]>);
  }, [character, searchTerm, castingTimeFilter, showPreparedOnly]);

  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

  if (!character) return null;

  return (
    <div className="bg-card/20 backdrop-blur-md p-6 rounded-2xl border border-border/40 flex flex-col h-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-2xl font-cinzel text-accent drop-shadow-sm">Spellbook</h3>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setCastingTimeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${castingTimeFilter === 'all' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => setCastingTimeFilter('action')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${castingTimeFilter === 'action' ? 'bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/30' : 'text-muted-foreground hover:bg-background/50 hover:text-blue-400'}`}
            >
              Action
            </button>
            <button
              onClick={() => setCastingTimeFilter('bonus')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${castingTimeFilter === 'bonus' ? 'bg-orange-500/20 text-orange-400 shadow-sm border border-orange-500/30' : 'text-muted-foreground hover:bg-background/50 hover:text-orange-400'}`}
            >
              Bonus
            </button>
            <button
              onClick={() => setCastingTimeFilter('reaction')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${castingTimeFilter === 'reaction' ? 'bg-yellow-500/20 text-yellow-400 shadow-sm border border-yellow-500/30' : 'text-muted-foreground hover:bg-background/50 hover:text-yellow-400'}`}
            >
              Reaction
            </button>
          </div>

          <button
            onClick={() => setShowPreparedOnly(!showPreparedOnly)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-2 ${showPreparedOnly ? 'bg-accent text-accent-foreground border-accent' : 'bg-transparent border-border text-muted-foreground hover:border-accent hover:text-accent'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
            </svg>
            Prepared Only
          </button>
        </div>
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
            <p className="text-center text-muted-foreground text-sm py-8">No spells match your search or filters.</p>
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
                    onTogglePrepared={() => handleTogglePrepared(spell.id)}
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
