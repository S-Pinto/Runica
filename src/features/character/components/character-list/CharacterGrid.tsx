import { DndContext, closestCenter, DragOverlay, SensorDescriptor, SensorOptions, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { ICharacter } from '../../characterTypes';
import { PlusIcon } from '../../../../components/ui/icons';
import { SortableCharacterCard } from '../SortableCharacterCard';
import { CharacterCard } from '../CharacterCard';

interface CharacterGridProps {
  characters: ICharacter[];
  activeCharacter: ICharacter | null | undefined;
  sensors: SensorDescriptor<SensorOptions>[];
  showNewCard: boolean;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onDuplicate: (character: ICharacter) => void;
  onExport: (character: ICharacter) => void;
}

/** Griglia dei personaggi ordinabile con trascinamento. */
export const CharacterGrid = ({
  characters, activeCharacter, sensors, showNewCard, onDragStart, onDragEnd,
  onSelect, onEdit, onDelete, onDuplicate, onExport,
}: CharacterGridProps) => (
  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <SortableContext items={characters.map((c) => c.id)} strategy={rectSortingStrategy}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {characters.map((char) => (
          <SortableCharacterCard
            key={char.id}
            id={char.id}
            character={char}
            onSelect={() => onSelect(char.id)}
            onDelete={() => onDelete(char.id, char.name)}
            onEdit={() => onEdit(char.id)}
            onDuplicate={() => onDuplicate(char)}
            onExport={() => onExport(char)}
          />
        ))}
        {showNewCard && (
          <button
            type="button"
            onClick={() => onSelect('new')}
            className="flex min-h-[4.5rem] items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong/70 text-muted-foreground transition-colors duration-150 hover:border-accent/70 hover:bg-accent/5 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[16rem] sm:flex-col"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current sm:h-12 sm:w-12">
              <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span className="text-sm font-semibold">Nuovo eroe</span>
          </button>
        )}
      </div>
    </SortableContext>

    <DragOverlay adjustScale>
      {activeCharacter ? (
        <div className="pointer-events-none rounded-2xl shadow-floating ring-2 ring-accent">
          <CharacterCard character={activeCharacter} onSelect={() => {}} onDelete={() => {}} onEdit={() => {}} />
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
);
