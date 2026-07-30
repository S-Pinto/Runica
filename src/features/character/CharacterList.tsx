import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  DragOverlay,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useAuth } from '../../providers/AuthProvider';
import { UserPlusIcon, MagnifyingGlassIcon, UserGroupIcon } from '../../components/ui/icons';
import { useCharacter } from './CharacterProvider';
import { ICharacter } from './characterTypes';
import { SortableCharacterCard } from './components/SortableCharacterCard';
import { CharacterCard } from './components/CharacterCard';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import { CampaignManagerModal } from './components/CampaignManagerModal';

export const CharacterList: React.FC = () => {
  const { characters, loading, deleteCharacter, saveCharacterOrder, duplicateCharacter } = useCharacter();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orderedCharacters, setOrderedCharacters] = useState<ICharacter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('all');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const isTouchDevice = useIsTouchDevice();

  useEffect(() => {
    setOrderedCharacters(characters);
  }, [characters]);

  // List of unique campaign names for filtering
  const campaignOptions = useMemo(() => {
    const names = new Set<string>();
    characters.forEach(c => {
      if (c.campaignName) names.add(c.campaignName);
    });
    return Array.from(names);
  }, [characters]);

  // Filtered characters based on search query and campaign filter
  const filteredCharacters = useMemo(() => {
    return orderedCharacters.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.race.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.class.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCampaign =
        selectedCampaignFilter === 'all' ||
        (selectedCampaignFilter === 'none' && !c.campaignName) ||
        c.campaignName === selectedCampaignFilter;

      return matchesSearch && matchesCampaign;
    });
  }, [orderedCharacters, searchQuery, selectedCampaignFilter]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 1000, tolerance: 15 },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(isTouchDevice ? touchSensor : pointerSensor, keyboardSensor);

  const handleSelectCharacter = (id: string) => {
    if (id === 'new') {
      navigate('/character/new');
    } else {
      navigate(`/character/${id}`);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setOrderedCharacters((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        const updatedOrder = newOrder.map((char, index) => ({ ...char, order: index }));
        saveCharacterOrder(updatedOrder);
        return updatedOrder;
      });
    }
  };

  const activeCharacter = activeId ? orderedCharacters.find(c => c.id === activeId) : null;

  const handleEditCharacter = (id: string) => {
    navigate(`/character/${id}/edit`);
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare ${name}? L'azione non può essere annullata.`)) {
      await deleteCharacter(id);
    }
  };

  const handleDuplicateCharacter = async (char: ICharacter) => {
    await duplicateCharacter(char);
  };

  const handleExportCharacter = (char: ICharacter) => {
    const dataStr = JSON.stringify(char, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${char.name || 'character'}-runica-sheet.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pt-8 space-y-8">
      {/* Header Bar & Dashboard Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h2 className="text-4xl font-cinzel font-bold text-accent drop-shadow-sm">I Tuoi Eroi</h2>
          <p className="text-muted-foreground text-sm mt-1">Gestisci i tuoi personaggi, avvia sessioni di gioco o organizza campagne.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCampaignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-accent/40 text-accent font-semibold text-sm rounded-xl hover:bg-accent/15 transition-all shadow-md"
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Gestisci Campagne</span>
          </button>
          <button
            onClick={() => handleSelectCharacter('new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground font-bold text-sm rounded-xl shadow-lg hover:bg-accent-light transition-all transform hover:scale-105"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Crea Nuovo Eroe</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {orderedCharacters.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cerca personaggio, classe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input/40 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Campaign Filter */}
          {campaignOptions.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Campagna:</label>
              <select
                value={selectedCampaignFilter}
                onChange={(e) => setSelectedCampaignFilter(e.target.value)}
                className="bg-input/40 border border-border text-foreground text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="all">Tutte le campagne</option>
                <option value="none">Senza campagna</option>
                {campaignOptions.map(camp => (
                  <option key={camp} value={camp}>{camp}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Character Cards Grid */}
      {filteredCharacters.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredCharacters.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCharacters.map(char => (
                <SortableCharacterCard
                  key={char.id}
                  id={char.id}
                  character={char}
                  activeCardId={activeCardId}
                  onSelect={() => handleSelectCharacter(char.id)}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleDeleteCharacter(char.id, char.name);
                  }}
                  onEdit={(e) => {
                    e.stopPropagation();
                    handleEditCharacter(char.id);
                  }}
                  onDuplicate={(e) => {
                    e.stopPropagation();
                    handleDuplicateCharacter(char);
                  }}
                  onExport={(e) => {
                    e.stopPropagation();
                    handleExportCharacter(char);
                  }}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay adjustScale={true}>
            {activeCharacter ? (
              <div className="w-full max-w-sm sm:max-w-xs pointer-events-none touch-none shadow-2xl ring-2 ring-accent rounded-lg overflow-hidden scale-105">
                <CharacterCard
                  character={activeCharacter}
                  onSelect={() => { }}
                  onDelete={() => { }}
                  onEdit={() => { }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="text-center w-full max-w-2xl mx-auto py-16 px-6 bg-card/40 backdrop-blur-md rounded-2xl border border-border space-y-4">
          <h3 className="text-2xl font-semibold text-foreground font-cinzel">Nessun eroe trovato</h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery || selectedCampaignFilter !== 'all'
              ? "Nessun personaggio corrisponde ai filtri di ricerca impostati."
              : currentUser
              ? "Non hai ancora schede salvate in questo account."
              : "Non hai schede locali salvate."}
          </p>
          <button
            onClick={() => handleSelectCharacter('new')}
            className="px-6 py-2.5 bg-accent text-accent-foreground font-bold rounded-xl shadow-md hover:bg-accent-light transition-all text-sm"
          >
            Crea il tuo primo personaggio
          </button>
        </div>
      )}

      {/* Campaign Manager Modal */}
      <CampaignManagerModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
      />
    </div>
  );
};