import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CharacterCard } from './CharacterCard';
import { ICharacter } from '../characterTypes'; // Assicurati che il percorso sia corretto

interface SortableCharacterCardProps {
  id: string;
  character: ICharacter;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  activeCardId: string | null;
}

export const SortableCharacterCard: React.FC<SortableCharacterCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto', // Assicura che la card trascinata sia in primo piano
  };

  return (
    <CharacterCard
      ref={setNodeRef}
      style={style}
      {...props}
      {...attributes}
      {...listeners}
    />
  );
};