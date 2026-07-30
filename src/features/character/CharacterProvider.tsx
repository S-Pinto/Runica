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
  saveCharacterOrder: (characters: ICharacter[]) => Promise<void>;
  duplicateCharacter: (character: ICharacter) => Promise<ICharacter>;
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

  // Helper for sorting
  const sortCharacters = (chars: ICharacter[]) => {
    return chars.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.name.localeCompare(b.name);
    });
  };

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
      setCharacters(sortCharacters(migratedChars));
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [currentUser]);

  const deleteCharacter = useCallback(async (id: string) => {
    await characterService.deleteCharacter(id);
    setCharacters(prev => prev.filter(char => char.id !== id));
  }, []);

  const saveCharacterOrder = useCallback(async (orderedCharacters: ICharacter[]) => {
    // Optimistic update
    setCharacters(orderedCharacters);
    await characterService.saveCharacterOrder(orderedCharacters);
  }, []);

  const saveCharacter = useCallback(async (characterToSave: ICharacter): Promise<ICharacter> => {
    // Aggiornamento ottimistico: aggiorna l'interfaccia immediatamente
    // con i dati che stiamo per salvare. Questo fornisce un feedback istantaneo.
    setCharacters(prev => {
      const existingIndex = prev.findIndex(c => c.id === characterToSave.id);
      let newList;
      if (existingIndex > -1) {
        newList = [...prev];
        newList[existingIndex] = characterToSave;
      } else {
        newList = [...prev, characterToSave];
      }
      return sortCharacters(newList);
    });

    return await characterService.saveCharacter(characterToSave);
  }, []);

  const duplicateCharacter = useCallback(async (char: ICharacter): Promise<ICharacter> => {
    const cloned = await characterService.duplicateCharacter(char);
    setCharacters(prev => sortCharacters([...prev, cloned]));
    return cloned;
  }, []);

  const value = {
    character, setCharacter, updateCharacter,
    characters, loading, deleteCharacter, saveCharacter, saveCharacterOrder, duplicateCharacter
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};
