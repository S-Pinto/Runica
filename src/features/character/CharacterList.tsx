import React, { useState, useMemo } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { UserPlusIcon, UserGroupIcon } from '../../components/ui/icons';
import { RuneDivider } from '../../components/ui/RuneDivider';
import { Button } from '../../components/ui/Button';
import { useCharacter } from './CharacterProvider';
import { useCampaigns } from '../../providers/CampaignProvider';
import { resolveCampaignName } from './rules/campaign';
import { CampaignManagerModal } from './components/CampaignManagerModal';
import { CharacterListSkeleton } from './components/character-list/CharacterListSkeleton';
import { CharacterListToolbar } from './components/character-list/CharacterListToolbar';
import { CharacterGrid } from './components/character-list/CharacterGrid';
import { CampaignChips } from './components/character-list/CampaignChips';
import { NoFilterResults, FirstHeroPrompt } from './components/character-list/CharacterListEmptyStates';
import { useCharacterOrdering } from './hooks/useCharacterOrdering';
import { useCharacterActions } from './hooks/useCharacterActions';

export const CharacterList: React.FC = () => {
  const { characters, loading, loadError, saveCharacterOrder } = useCharacter();
  const { currentUser } = useAuth();
  const { campaignNames } = useCampaigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('all');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const { orderedCharacters, activeCharacter, sensors, handleDragStart, handleDragEnd } = useCharacterOrdering(characters, saveCharacterOrder);
  const {
    handleSelectCharacter, handleEditCharacter, handleDeleteCharacter, handleDuplicateCharacter, handleExportCharacter,
  } = useCharacterActions();

  // Campagne dei personaggi, per id (il nome può cambiare), con il nome aggiornato se noto
  const campaignOptions = useMemo(() => {
    const options = new Map<string, string>();
    characters.forEach(c => {
      const key = c.campaignId || c.campaignName;
      const label = resolveCampaignName(c, campaignNames);
      if (key && label) options.set(key, label);
    });
    return Array.from(options, ([value, label]) => ({ value, label }));
  }, [characters, campaignNames]);

  // Filtered characters based on search query and campaign filter
  const filteredCharacters = useMemo(() => {
    return orderedCharacters.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.race.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.class.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCampaign =
        selectedCampaignFilter === 'all' ||
        (selectedCampaignFilter === 'none' && !c.campaignId && !c.campaignName) ||
        (c.campaignId || c.campaignName) === selectedCampaignFilter;

      return matchesSearch && matchesCampaign;
    });
  }, [orderedCharacters, searchQuery, selectedCampaignFilter]);

  if (loading) {
    return <CharacterListSkeleton />;
  }

  if (loadError && characters.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center" role="alert">
        <p className="mb-5 text-destructive">{loadError}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Riprova
        </Button>
      </div>
    );
  }

  const isFiltering = searchQuery !== '' || selectedCampaignFilter !== 'all';
  const hasCharacters = characters.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-foreground sm:text-4xl">I tuoi eroi</h1>
          {hasCharacters && (
            <p className="mt-1 text-sm text-muted-foreground">
              {characters.length === 1 ? '1 eroe' : `${characters.length} eroi`}
              {campaignOptions.length > 0 &&
                ` · ${campaignOptions.length} ${campaignOptions.length === 1 ? 'campagna' : 'campagne'}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsCampaignModalOpen(true)} className={hasCharacters ? 'flex-1 sm:flex-none' : ''}>
            <UserGroupIcon className="h-4 w-4" /> Campagne
          </Button>
          {/* Senza eroi l'azione primaria è l'invito al centro della pagina. */}
          {hasCharacters && (
            <Button onClick={() => handleSelectCharacter('new')} className="flex-1 sm:flex-none">
              <UserPlusIcon className="h-4 w-4" /> Nuovo eroe
            </Button>
          )}
        </div>
      </header>

      <CampaignChips />

      <RuneDivider glyph="notch" />

      {hasCharacters && (
        <CharacterListToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          campaignOptions={campaignOptions}
          selectedCampaignFilter={selectedCampaignFilter}
          onCampaignFilterChange={setSelectedCampaignFilter}
        />
      )}

      {filteredCharacters.length > 0 ? (
        <CharacterGrid
          characters={filteredCharacters}
          activeCharacter={activeCharacter}
          sensors={sensors}
          showNewCard={!isFiltering}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSelect={handleSelectCharacter}
          onEdit={handleEditCharacter}
          onDelete={handleDeleteCharacter}
          onDuplicate={handleDuplicateCharacter}
          onExport={handleExportCharacter}
        />
      ) : isFiltering ? (
        <NoFilterResults
          onReset={() => {
            setSearchQuery('');
            setSelectedCampaignFilter('all');
          }}
        />
      ) : (
        <FirstHeroPrompt isLoggedIn={!!currentUser} onCreate={() => handleSelectCharacter('new')} />
      )}

      <CampaignManagerModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} />
    </div>
  );
};
