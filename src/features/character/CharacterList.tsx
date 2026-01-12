import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
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
import { CharacterCard } from './components/CharacterCard';
import { UserPlusIcon } from '../../components/ui/icons';
import { useCharacter } from './CharacterProvider';
import { ICharacter } from './characterTypes'; // Assicurati che il percorso all'interfaccia ICharacter sia corretto
import { SortableCharacterCard } from './components/SortableCharacterCard';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';

export const CharacterList: React.FC = () => {
  const { characters, loading, deleteCharacter } = useCharacter();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orderedCharacters, setOrderedCharacters] = useState<ICharacter[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const isTouchDevice = useIsTouchDevice();
  const intersectingIds = useRef(new Map<string, number>());

  useEffect(() => {
    // Inizializza o aggiorna la lista ordinata quando i personaggi cambiano.
    // In un'applicazione reale, potresti voler caricare l'ordine da uno storage persistente (es. Firestore)
    // e salvarlo in handleDragEnd.
    setOrderedCharacters(characters);
  }, [characters]);

  useEffect(() => {
    // Attiviamo l'observer solo su dispositivi touch
    if (isTouchDevice) {
      const options = {
        root: null, // usa il viewport come root
        rootMargin: '0px',
        // Attiva il callback appena una piccola parte della card è visibile (1%).
        // Un valore basso come 0.01 assicura che anche le card in fondo alla pagina,
        // che potrebbero non raggiungere mai il 50% di visibilità, vengano considerate.
        threshold: 0.01,
      };

      const observer = new IntersectionObserver((entries) => {
        // Aggiorna la nostra mappa degli elementi che intersecano la viewport
        entries.forEach(entry => {
          const id = (entry.target as HTMLElement).dataset.characterId;
          if (!id) return;

          if (entry.isIntersecting) {
            intersectingIds.current.set(id, entry.boundingClientRect.top);
          } else {
            intersectingIds.current.delete(id);
          }
        });

        const visibleElements = Array.from(intersectingIds.current.entries());

        if (visibleElements.length === 0) {
          setActiveCardId(null);
          return;
        }

        // Ordina per posizione (il valore nella mappa) per trovare l'elemento più in alto
        visibleElements.sort(([, topA], [, topB]) => topA - topB);
        
        const topMostId = visibleElements[0][0];
        
        // Aggiorna lo stato solo se l'ID attivo è cambiato, per evitare re-render superflui
        setActiveCardId(currentActiveId => (currentActiveId !== topMostId ? topMostId : currentActiveId));
      }, options);

      const cards = document.querySelectorAll('.character-card-observable');
      cards.forEach(card => observer.observe(card));

      return () => {
        observer.disconnect();
        intersectingIds.current.clear();
      };
    }
  }, [orderedCharacters, isTouchDevice]); // Riavvia l'observer se la lista o il tipo di dispositivo cambia

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Su dispositivi touch, attiva il drag dopo una pressione di 250ms.
      // Su desktop, attiva il drag dopo aver mosso il mouse di 10px.
      // Questo previene che lo scroll venga confuso con il drag su mobile.
      activationConstraint: isTouchDevice
        ? {
            delay: 250,
            tolerance: 5,
          }
        : {
            distance: 10,
          },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelectCharacter = (id: string) => {
    if (id === 'new') {
      navigate('/character/new');
    } else {
      navigate(`/character/${id}`);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedCharacters((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // TODO: Salva il nuovo ordine `newOrder` nel tuo database (es. Firestore)
        return newOrder;
      });
    }
  };

  const handleEditCharacter = (id: string) => {
    // Naviga alla pagina di modifica del personaggio
    navigate(`/character/${id}/edit`);
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      await deleteCharacter(id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pt-12">
      <h2 className="text-3xl font-cinzel text-center text-foreground mb-8">Your Characters</h2>
      <div className="flex flex-col items-center">
        <button
            onClick={() => handleSelectCharacter('new')}
            className="mb-10 flex items-center gap-2 px-6 py-3 bg-accent-dark text-white font-bold rounded-lg shadow-md hover:bg-accent transition-all duration-300 transform hover:scale-105"
        >
            <UserPlusIcon className="w-5 h-5" />
            Create New Character
        </button>

        {orderedCharacters.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={orderedCharacters.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orderedCharacters.map(char => (
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
                />
              ))}
            </div>
            </SortableContext>
          </DndContext>
        ) : (
            <div className="text-center w-full max-w-2xl mt-8 py-16 px-6 bg-card/50 rounded-lg border border-border">
                <h2 className="text-2xl font-semibold text-foreground font-cinzel">Your adventure awaits!</h2>
                <p className="text-text-muted mt-2">
                  {currentUser 
                    ? "You have no characters synced to this account." 
                    : "You have no local characters."
                  }
                  <br/>
                  Click the button above to forge your first hero.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};