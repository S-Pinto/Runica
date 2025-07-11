import React from 'react';
import { ICharacter } from '../types';
import { TrashIcon, EditIcon } from './icons';

interface CharacterCardProps {
  character: ICharacter;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSelect, onDelete }) => {
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <div onClick={onSelect} className="bg-zinc-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-amber-500/20 hover:scale-105 group relative cursor-pointer">
      <div className="p-5">
        <h3 className="text-xl font-bold font-cinzel text-amber-400 truncate">{character.name || 'Unnamed Adventurer'}</h3>
        <p className="text-zinc-400 capitalize text-sm">{character.race || 'Race'} {character.class || 'Class'} &bull; Level {character.level}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-zinc-300 border-t border-zinc-700 pt-4">
          <div className="flex items-center gap-1.5" title="Hit Points">
            <span className="font-bold text-red-400">HP</span>
            <span>{character.hp.current}/{character.hp.max}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Armor Class">
            <span className="font-bold text-sky-400">AC</span>
            <span>{character.armorClass}</span>
          </div>
        </div>
      </div>
      <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleEditClick}
          className="p-2 rounded-full bg-zinc-700 hover:bg-amber-500 text-zinc-300 hover:text-white transition-colors"
          aria-label={`Edit ${character.name}`}
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-full bg-zinc-700 hover:bg-red-600 text-zinc-300 hover:text-white transition-colors"
          aria-label={`Delete ${character.name}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};