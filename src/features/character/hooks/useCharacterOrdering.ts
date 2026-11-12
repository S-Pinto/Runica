import { useState, useEffect } from 'react';
import {
  KeyboardSensor,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ICharacter } from '../characterTypes';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { toast } from '../../../components/ui/Dialogs';
import { describeDataError } from '../../../lib/errors';

/** Ordine locale dei personaggi con trascinamento (dnd-kit) e salvataggio del nuovo ordine. */
export const useCharacterOrdering = (
  characters: ICharacter[],
  saveCharacterOrder: (characters: ICharacter[]) => Promise<void>,
) => {
  const [orderedCharacters, setOrderedCharacters] = useState<ICharacter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isTouchDevice = useIsTouchDevice();

  useEffect(() => {
    setOrderedCharacters(characters);
  }, [characters]);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      // Il salvataggio sta fuori dall'updater di setState (che React può eseguire due volte).
      const oldIndex = orderedCharacters.findIndex((item) => item.id === active.id);
      const newIndex = orderedCharacters.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const updatedOrder = arrayMove(orderedCharacters, oldIndex, newIndex)
        .map((char, index) => ({ ...char, order: index }));
      setOrderedCharacters(updatedOrder);
      saveCharacterOrder(updatedOrder).catch((error) => {
        console.error('Failed to save character order', error);
        setOrderedCharacters(characters);
        toast.error(describeDataError(error, 'Impossibile salvare il nuovo ordine.'));
      });
    }
  };

  const activeCharacter = activeId ? orderedCharacters.find(c => c.id === activeId) : null;

  return { orderedCharacters, activeCharacter, sensors, handleDragStart, handleDragEnd };
};
