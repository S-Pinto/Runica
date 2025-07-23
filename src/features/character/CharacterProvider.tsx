// src/features/character/CharacterProvider.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { ICharacter } from './characterTypes';
import * as characterService from './characterService';
import { useAuth } from '../../providers/AuthProvider';

interface ICharacterContext {
  character: ICharacter | null;
  setCharacter: React.Dispatch<React.SetStateAction<ICharacter | null>>;
  updateCharacter: (updatedFields: Partial<ICharacter>) => void;
  characters: ICharacter[];
  loading: boolean;
  deleteCharacter: (id: string) => Promise<void>;
  saveCharacter: (character: ICharacter) => Promise<ICharacter>;
}

const CharacterContext = createContext<ICharacterContext | undefined>(undefined);

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};

export const CharacterProvider = ({ children }: { children: ReactNode }) => {
  const [character, setCharacter] = useState<ICharacter | null>(null);
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const updateCharacter = useCallback((updatedFields: Partial<ICharacter>) => {
    setCharacter(prev => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

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
  }, [currentUser]);

  const deleteCharacter = useCallback(async (id: string) => {
    await characterService.deleteCharacter(id);
    // Manually update state for immediate feedback, the listener will sync later.
    setCharacters(prev => prev.filter(char => char.id !== id));
  }, []);

  const saveCharacter = useCallback(async (characterToSave: ICharacter): Promise<ICharacter> => {
    // Aggiornamento ottimistico: aggiorna l'interfaccia immediatamente
    // con i dati che stiamo per salvare. Questo fornisce un feedback istantaneo.
    setCharacters(prev => {
      const existingIndex = prev.findIndex(c => c.id === characterToSave.id);
      if (existingIndex > -1) {
        const newList = [...prev];
        newList[existingIndex] = characterToSave;
        return newList.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        return [...prev, characterToSave].sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    
    // Ora, esegui l'operazione di salvataggio effettiva. Il listener in tempo reale
    // si sincronizzerà con questo stato, ma l'interfaccia è già stata aggiornata.
    return await characterService.saveCharacter(characterToSave);
  }, []);

  const value = { 
    character, setCharacter, updateCharacter,
    characters, loading, deleteCharacter, saveCharacter
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};
