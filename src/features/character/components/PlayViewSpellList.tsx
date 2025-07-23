import React, { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';

const SpellCard = ({ spell, onToggleExpand, isExpanded }: { spell: Spell; onToggleExpand: () => void; isExpanded: boolean; }) => (
    <div className="bg-card/50 rounded-lg">
        <div className="flex justify-between items-center cursor-pointer p-3" onClick={onToggleExpand}>
            <div className="flex-1 min-w-0">
                 <h4 className="font-bold text-accent truncate" title={spell.name}>{spell.name}</h4>
                 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="truncate" title={spell.castingTime}>{spell.castingTime}</span>
                    <span className="opacity-50">|</span>
                    <span className="truncate" title={spell.range}>{spell.range}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground capitalize">{spell.school}</span>
            </div>
        </div>
        {isExpanded && (
            <div className="mt-2 pt-3 border-t border-border/50 space-y-2 text-sm p-3 bg-muted/30">
                <p><strong className="text-muted-foreground">Components:</strong> {spell.components}</p>
                <p><strong className="text-muted-foreground">Duration:</strong> {spell.duration}</p>
                <p className="text-foreground mt-2 whitespace-pre-wrap">{spell.description}</p>
            </div>
        )}
    </div>
);


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
      <div className="mb-4">
        <input 
            type="text" 
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-input p-2 rounded-md border border-border text-sm focus:ring-ring focus:border-accent"
        />
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
                    <div className="space-y-3">
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
