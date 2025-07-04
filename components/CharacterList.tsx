import React, { useState, useEffect, useCallback } from 'react';
import { ICharacter } from '../types';
import * as characterService from '../services/characterService';
import { CharacterCard } from './CharacterCard';
import { UserPlusIcon } from './icons';

interface CharacterListProps {
  onSelectCharacter: (id: string) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({ onSelectCharacter }) => {
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCharacters = useCallback(async () => {
    setLoading(true);
    const chars = await characterService.getCharacters();
    setCharacters(chars.sort((a,b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const handleCreateCharacter = () => {
    onSelectCharacter('new');
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      await characterService.deleteCharacter(id);
      loadCharacters();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-5xl sm:text-6xl font-bold text-amber-400 font-cinzel tracking-wider">RUNICA</h1>
        <p className="text-zinc-400 mt-2">Your D&D Companion</p>
      </header>

      <div className="flex flex-col items-center">
        <button
            onClick={handleCreateCharacter}
            className="mb-10 flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-bold rounded-lg shadow-md hover:bg-amber-500 transition-all duration-300 transform hover:scale-105"
        >
            <UserPlusIcon className="w-5 h-5" />
            Create New Character
        </button>

        {characters.length > 0 ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map(char => (
                <CharacterCard 
                key={char.id} 
                character={char} 
                onSelect={() => onSelectCharacter(char.id)}
                onDelete={(e) => {
                    e.stopPropagation();
                    handleDeleteCharacter(char.id, char.name);
                }}
                />
            ))}
            </div>
        ) : (
            <div className="text-center w-full max-w-2xl mt-8 py-16 px-6 bg-zinc-800/50 rounded-lg">
                <h2 className="text-2xl font-semibold text-zinc-300 font-cinzel">Your adventure awaits!</h2>
                <p className="text-zinc-400 mt-2">You have no characters yet. Click the button above to forge your first hero.</p>
            </div>
        )}
      </div>
    </div>
  );
};