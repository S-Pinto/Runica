import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CharacterCard } from './CharacterCard';
import { ICharacter } from '../characterTypes';

interface SortableCharacterCardProps {
  id: string;
  character: ICharacter;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
  onExport?: (e: React.MouseEvent) => void;
}

export const SortableCharacterCard: React.FC<SortableCharacterCardProps> = ({ id, ...cardProps }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <CharacterCard
      ref={setNodeRef}
      style={style}
      {...cardProps}
      {...attributes}
      {...listeners}
      // dnd-kit's attributes set role="button" too; keep our label/tabIndex semantics.
      role="button"
    />
  );
};
