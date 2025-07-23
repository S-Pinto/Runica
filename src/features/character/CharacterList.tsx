import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { CharacterCard } from './components/CharacterCard';
import { UserPlusIcon } from '../../components/ui/icons';
import { useCharacter } from './CharacterProvider';


export const CharacterList: React.FC = () => {
  const { characters, loading, deleteCharacter } = useCharacter();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
      await deleteCharacter(id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pt-12">
      <h2 className="text-3xl font-cinzel text-center text-foreground mb-8">Your Characters</h2>
      <div className="flex flex-col items-center">
        <button
            onClick={() => handleSelectCharacter('new')}
            className="mb-10 flex items-center gap-2 px-6 py-3 bg-accent-dark text-white font-bold rounded-lg shadow-md hover:bg-accent transition-all duration-300 transform hover:scale-105"
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
            <div className="text-center w-full max-w-2xl mt-8 py-16 px-6 bg-card/50 rounded-lg border border-border">
                <h2 className="text-2xl font-semibold text-foreground font-cinzel">Your adventure awaits!</h2>
                <p className="text-text-muted mt-2">
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