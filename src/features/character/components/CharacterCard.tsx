import React from 'react';
import { ICharacter } from '../characterTypes';
import { TrashIcon, EditIcon, PhotoIcon } from '../../../components/ui/icons';
import { calculateArmorClass } from '../characterService';

interface CharacterCardProps {
  character: ICharacter;
  onSelect: () => void; // Per la vista di gioco
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void; // Per la modifica
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSelect, onDelete, onEdit }) => {
  return (
    <div 
      onClick={onSelect} 
      className="bg-zinc-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 md:hover:shadow-amber-500/20 group relative cursor-pointer" 
      role="button" 
      tabIndex={0}
    >
      {/* 
        Contenitore immagine che si espande. 
        'max-h-32' crea la miniatura, 'group-hover:max-h-96' la espande.
        La transizione su 'max-height' crea l'effetto di animazione.
      */}
      <div className="relative w-full max-h-32 md:group-hover:max-h-96 transition-all duration-500 ease-in-out overflow-hidden">
        {character.imageUrl ? (
          <img src={character.imageUrl} alt={character.name} className="w-full h-auto" />
        ) : (
          <div className="w-full h-32 flex items-center justify-center text-zinc-600 bg-zinc-700/50">
            <PhotoIcon className="w-16 h-16" />
          </div>
        )}
      </div>

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
            <span>{calculateArmorClass(character)}</span>
          </div>
        </div>
      </div>
      <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={onEdit}
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