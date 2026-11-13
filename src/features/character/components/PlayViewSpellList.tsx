import { useState, useMemo } from 'react';
import { Spell } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { SearchIcon, XMarkIcon, BookmarkIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { SegmentedControl, SegmentedOption } from '../../../components/ui/SegmentedControl';
import { fieldInputClass } from '../../../components/ui/field';
import { SpellCard } from './SpellCard';
import { PlaySection, playEmptyClass } from './play-view/PlaySection';

type CastingTimeFilter = 'all' | 'action' | 'bonus' | 'reaction';

const CASTING_FILTERS: SegmentedOption<CastingTimeFilter>[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'action', label: 'Azione' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'reaction', label: 'Reazione' },
];

export const PlayViewSpellList = () => {
  const { character, updateCharacter } = useCharacter();
  const [expandedSpells, setExpandedSpells] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [castingTimeFilter, setCastingTimeFilter] = useState<CastingTimeFilter>('all');
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

      // I trucchetti restano sempre visibili: non si preparano.
      const matchesPrepared = showPreparedOnly ? (spell.level === 0 || spell.prepared) : true;

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
    <PlaySection title="Libro degli incantesimi">
      <div className="space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Cerca incantesimi"
            placeholder="Cerca incantesimi"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${fieldInputClass} bg-background pl-10 pr-12 [&::-webkit-search-cancel-button]:hidden`}
          />
          {searchTerm && (
            <Button variant="ghost" size="icon" onClick={() => setSearchTerm('')} aria-label="Cancella la ricerca" className="absolute right-1 top-1/2 -translate-y-1/2">
              <XMarkIcon className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SegmentedControl label="Tempo di lancio" options={CASTING_FILTERS} value={castingTimeFilter} onChange={setCastingTimeFilter} className="sm:flex-1" />
          <Button
            variant="secondary"
            onClick={() => setShowPreparedOnly(!showPreparedOnly)}
            aria-pressed={showPreparedOnly}
            className={showPreparedOnly ? 'border-accent bg-accent/15 text-accent' : ''}
          >
            <BookmarkIcon className="h-4 w-4" /> Solo preparati
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {character.spells.length === 0 ? (
          <p className={playEmptyClass}>Questo personaggio non conosce incantesimi.</p>
        ) : sortedLevels.length === 0 ? (
          <p className={playEmptyClass}>Nessun incantesimo corrisponde alla ricerca.</p>
        ) : (
          sortedLevels.map(level => (
            <div key={level}>
              <h4 className="mb-3 flex items-baseline justify-between border-b border-border pb-2 font-cinzel text-base font-bold text-foreground">
                {level === 0 ? 'Trucchetti' : `Livello ${level}`}
                <span className="font-mono text-xs font-normal text-muted-foreground">{spellsByLevel[level].length}</span>
              </h4>
              <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
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
    </PlaySection>
  );
};
