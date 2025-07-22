// src/features/character/CharacterProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ICharacter } from './characterTypes';

interface ICharacterContext {
  character: ICharacter | null;
  setCharacter: React.Dispatch<React.SetStateAction<ICharacter | null>>;
  updateCharacter: (updatedFields: Partial<ICharacter>) => void;
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

  const updateCharacter = (updatedFields: Partial<ICharacter>) => {
    setCharacter(prev => (prev ? { ...prev, ...updatedFields } : null));
  };

  const value = { character, setCharacter, updateCharacter };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};
