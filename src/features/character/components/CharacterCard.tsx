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
      className="bg-card rounded-lg shadow-lg overflow-hidden transition-all duration-300 md:hover:shadow-accent/20 group relative cursor-pointer" 
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
          <div className="w-full h-32 flex items-center justify-center text-muted-foreground bg-muted/50">
            <PhotoIcon className="w-16 h-16" />
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold font-cinzel text-accent truncate">{character.name || 'Unnamed Adventurer'}</h3>
        <p className="text-muted-foreground capitalize text-sm">{character.race || 'Race'} {character.class || 'Class'} &bull; Level {character.level}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-foreground border-t border-border pt-4">
          <div className="flex items-center gap-1.5" title="Hit Points">
            <span className="font-bold text-destructive">HP</span>
            <span>{character.hp.current}/{character.hp.max}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Armor Class">
            <span className="font-bold text-accent">AC</span>
            <span>{calculateArmorClass(character)}</span>
          </div>
        </div>
      </div>
      <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={onEdit}
          className="p-2 rounded-full bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground transition-colors"
          aria-label={`Edit ${character.name}`}
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-full bg-secondary hover:bg-destructive text-secondary-foreground hover:text-destructive-foreground transition-colors"
          aria-label={`Delete ${character.name}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};