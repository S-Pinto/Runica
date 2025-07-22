import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICharacter } from './characterTypes';
import * as characterService from './characterService';
import { useAuth } from '../../providers/AuthProvider';
import { CharacterCard } from './components/CharacterCard';
import { UserPlusIcon } from '../../components/ui/icons';


export const CharacterList: React.FC = () => {
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = characterService.onCharactersSnapshot((chars) => {
      const migratedChars = chars.map(char => ({
        ...characterService.createNewCharacter(),
        ...char,
      }));
      setCharacters(migratedChars.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [currentUser]); // Rerun when user logs in/out

  const handleSelectCharacter = (id: string) => {
    if (id === 'new') {
      navigate('/character/new');
    } else {
      navigate(`/character/${id}`);
    }
  };

  const handleEditCharacter = (id: string) => {
    // Naviga alla pagina di modifica del personaggio
    navigate(`/character/${id}/edit`);
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      await characterService.deleteCharacter(id);
      // Real-time listener will update the list automatically
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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pt-12">
      <h2 className="text-3xl font-cinzel text-center text-zinc-300 mb-8">Your Characters</h2>
      <div className="flex flex-col items-center">
        <button
            onClick={() => handleSelectCharacter('new')}
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
        ) : (
            <div className="text-center w-full max-w-2xl mt-8 py-16 px-6 bg-zinc-800/50 rounded-lg">
                <h2 className="text-2xl font-semibold text-zinc-300 font-cinzel">Your adventure awaits!</h2>
                <p className="text-zinc-400 mt-2">
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