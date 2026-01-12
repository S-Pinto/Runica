import React, { useState, useMemo } from 'react';
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
      acc[spell.level].sort((a,b) => a.name.localeCompare(b.name));
      return acc;
    }, {} as Record<number, Spell[]>);
  }, [character, searchTerm]);

  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

  if (!character) return null;

  return (
    <div className="bg-card p-4 rounded-lg border border-border flex flex-col h-auto max-h-[calc(100vh-10rem)]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-cinzel text-accent">Spellbook</h3>
      </div>
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <input 
            type="text" 
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-input p-2 pl-10 pr-10 rounded-md border border-border text-sm focus:ring-ring focus:border-accent"
        />
        {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
                <XCircleIcon className="h-5 w-5 text-muted-foreground hover:text-destructive" />
            </button>
        )}
      </div>
      
      <div className="space-y-6 overflow-y-auto pr-2 -mr-2 flex-grow">
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
