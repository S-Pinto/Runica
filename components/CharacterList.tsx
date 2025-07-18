import React, { useState, useEffect, useCallback } from 'react';
import { ICharacter } from '../types';
import * as characterService from '../services/characterService';
import * as authService from '../services/authService';
import type { User } from 'firebase/auth';
import { CharacterCard } from './CharacterCard';
import { UserPlusIcon } from './icons';

interface CharacterListProps {
  onSelectCharacter: (id: string) => void;
  currentUser: User | null;
}

const AuthDisplay = ({ user }: { user: User | null }) => {
    if (user) {
        return (
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <img src={user.photoURL || undefined} alt="User" className="w-8 h-8 rounded-full" />
                    <span className="text-zinc-300 hidden sm:inline">{user.displayName || user.email}</span>
                </div>
                <button 
                    onClick={() => authService.signOutUser()}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-white transition-colors"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => authService.signInWithGoogle()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-md text-white font-bold transition-colors flex items-center gap-2"
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z"/><path d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z"/><path d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z"/><path d="M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z"/></svg>
            Sign in with Google
        </button>
    );
};


export const CharacterList: React.FC<CharacterListProps> = ({ onSelectCharacter, currentUser }) => {
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = characterService.onCharactersSnapshot((chars) => {
      setCharacters(chars.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [currentUser]); // Rerun when user logs in/out

  const handleCreateCharacter = () => {
    onSelectCharacter('new');
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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-400 font-cinzel tracking-wider">RUNICA</h1>
          <p className="text-zinc-400 mt-1">Your D&D Companion</p>
        </div>
        <AuthDisplay user={currentUser} />
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