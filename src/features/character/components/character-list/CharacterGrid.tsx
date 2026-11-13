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
            className="group surface flex min-h-[4rem] items-center justify-center gap-3 rounded-2xl text-muted-foreground transition-[border-color,color,transform] duration-200 ease-soft hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[7rem] sm:self-start"
          >
            <span aria-hidden className="flex h-8 w-8 rotate-45 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent transition-colors duration-150 group-hover:bg-accent group-hover:text-accent-foreground">
              <PlusIcon className="-rotate-45 h-4 w-4" />
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
