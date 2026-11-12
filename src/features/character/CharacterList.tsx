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
import { UserPlusIcon, MagnifyingGlassIcon, UserGroupIcon, PlusIcon } from '../../components/ui/icons';
import { Button } from '../../components/ui/Button';
import { useCharacter } from './CharacterProvider';
import { ICharacter } from './characterTypes';
import { SortableCharacterCard } from './components/SortableCharacterCard';
import { CharacterCard } from './components/CharacterCard';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import { CampaignManagerModal } from './components/CampaignManagerModal';
import { confirmDialog } from '../../components/ui/Dialogs';

export const CharacterList: React.FC = () => {
  const { characters, loading, deleteCharacter, saveCharacterOrder, duplicateCharacter } = useCharacter();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orderedCharacters, setOrderedCharacters] = useState<ICharacter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
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
    if (await confirmDialog({ title: `Eliminare ${name}?`, message: "L'azione non può essere annullata.", confirmLabel: 'Elimina', destructive: true })) {
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
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8" aria-busy="true" aria-label="Caricamento personaggi">
        <div className="h-16 w-64 animate-pulse rounded-xl bg-muted/30" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              <div className="aspect-[4/3] animate-pulse bg-muted/30" />
              <div className="space-y-3 p-4">
                <div className="h-2 animate-pulse rounded bg-muted/40" />
                <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isFiltering = searchQuery !== '' || selectedCampaignFilter !== 'all';
  const filterChips: { value: string; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    ...campaignOptions.map((c) => ({ value: c, label: c })),
    { value: 'none', label: 'Senza campagna' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-foreground sm:text-4xl">I tuoi eroi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {characters.length === 1 ? '1 eroe' : `${characters.length} eroi`}
            {campaignOptions.length > 0 &&
              ` · ${campaignOptions.length} ${campaignOptions.length === 1 ? 'campagna' : 'campagne'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsCampaignModalOpen(true)} className="flex-1 sm:flex-none">
            <UserGroupIcon className="h-4 w-4" /> Campagne
          </Button>
          <Button onClick={() => handleSelectCharacter('new')} className="flex-1 sm:flex-none">
            <UserPlusIcon className="h-4 w-4" /> Nuovo eroe
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      {characters.length > 0 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:w-80">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Cerca personaggi"
              placeholder="Cerca per nome, classe o razza"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          {campaignOptions.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Filtra per campagna">
              {filterChips.map((chip) => {
                const active = selectedCampaignFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCampaignFilter(chip.value)}
                    className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-border text-muted-foreground hover:border-accent/50 hover:text-text'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {filteredCharacters.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredCharacters.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharacters.map((char) => (
                <SortableCharacterCard
                  key={char.id}
                  id={char.id}
                  character={char}
                  onSelect={() => handleSelectCharacter(char.id)}
                  onDelete={() => handleDeleteCharacter(char.id, char.name)}
                  onEdit={() => handleEditCharacter(char.id)}
                  onDuplicate={() => handleDuplicateCharacter(char)}
                  onExport={() => handleExportCharacter(char)}
                />
              ))}
              {!isFiltering && (
                <button
                  type="button"
                  onClick={() => handleSelectCharacter('new')}
                  className="group flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-accent/60 hover:bg-accent/5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-current transition-transform group-hover:scale-110">
                    <PlusIcon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold">Nuovo eroe</span>
                </button>
              )}
            </div>
          </SortableContext>

          <DragOverlay adjustScale>
            {activeCharacter ? (
              <div className="pointer-events-none rotate-2 scale-105 rounded-2xl shadow-2xl ring-2 ring-accent">
                <CharacterCard character={activeCharacter} onSelect={() => {}} onDelete={() => {}} onEdit={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : isFiltering ? (
        <div className="rounded-2xl border border-border/60 bg-card/50 px-6 py-14 text-center">
          <p className="font-semibold text-foreground">Nessun eroe corrisponde ai filtri</p>
          <p className="mt-1 text-sm text-muted-foreground">Prova un'altra ricerca o un'altra campagna.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-5"
            onClick={() => {
              setSearchQuery('');
              setSelectedCampaignFilter('all');
            }}
          >
            Azzera filtri
          </Button>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-16 text-center sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(var(--color-accent)/0.18),transparent_60%)]" />
          <div className="relative mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-16 w-16 rotate-45 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10">
              <span className="-rotate-45 font-norse text-3xl text-accent">R</span>
            </div>
            <h2 className="font-cinzel text-2xl font-bold text-foreground">La tua avventura inizia qui</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {currentUser
                ? 'Non hai ancora personaggi su questo account.'
                : 'Non hai personaggi salvati su questo dispositivo. Accedi per sincronizzarli tra i tuoi dispositivi.'}
            </p>
            <Button size="lg" className="mt-8" onClick={() => handleSelectCharacter('new')}>
              <UserPlusIcon className="h-4 w-4" /> Crea il tuo primo eroe
            </Button>
          </div>
        </div>
      )}

      <CampaignManagerModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} />
    </div>
  );
};
