// src/features/character/CharacterProvider.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { ICharacter } from './characterTypes';
import * as characterRepository from './characterRepository';
import { promptAndMigrateLocalCharacters } from './migrationActions';
import { useAuth } from '../../providers/AuthProvider';
import { describeDataError } from '../../lib/errors';

interface ICharacterContext {
  character: ICharacter | null;
  setCharacter: React.Dispatch<React.SetStateAction<ICharacter | null>>;
  updateCharacter: (updatedFields: Partial<ICharacter>) => void;
  characters: ICharacter[];
  loading: boolean;
  /** Messaggio d'errore se il caricamento dell'elenco è fallito, altrimenti null. */
  loadError: string | null;
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
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const uid = currentUser?.uid ?? null;

  useEffect(() => {
    // Al cambio utente (login/logout) i dati dell'account precedente non devono restare visibili.
    setLoading(true);
    setLoadError(null);
    setCharacters([]);
    setCharacter(null);

    let active = true;
    const unsubscribe = characterRepository.onCharactersSnapshot(
      (chars) => {
        if (!active) return;
        setCharacters(sortCharacters(chars));
        setLoadError(null);
        setLoading(false);
      },
      (error) => {
        if (!active) return;
        // Senza questo la lista resterebbe in caricamento all'infinito.
        setLoadError(describeDataError(error, 'Impossibile caricare i personaggi.'));
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);

  // Al login, propone di spostare sul cloud i personaggi salvati in locale.
  useEffect(() => {
    if (uid) {
      void promptAndMigrateLocalCharacters(uid);
    }
  }, [uid]);

  const deleteCharacter = useCallback(async (id: string) => {
    await characterRepository.deleteCharacter(id);
    setCharacters(prev => prev.filter(char => char.id !== id));
  }, []);

  const saveCharacterOrder = useCallback(async (orderedCharacters: ICharacter[]) => {
    // Aggiornamento ottimistico, con ripristino dell'ordine precedente se il salvataggio fallisce.
    let previous: ICharacter[] = [];
    setCharacters(prev => {
      previous = prev;
      return orderedCharacters;
    });
    try {
      await characterRepository.saveCharacterOrder(orderedCharacters);
    } catch (error) {
      setCharacters(previous);
      throw error;
    }
  }, []);

  const saveCharacter = useCallback(async (characterToSave: ICharacter): Promise<ICharacter> => {
    // Aggiornamento ottimistico: aggiorna l'interfaccia immediatamente
    // con i dati che stiamo per salvare. Questo fornisce un feedback istantaneo.
    let previous: ICharacter[] = [];
    setCharacters(prev => {
      previous = prev;
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

    try {
      return await characterRepository.saveCharacter(characterToSave);
    } catch (error) {
      setCharacters(previous);
      throw error;
    }
  }, []);

  const duplicateCharacter = useCallback(async (char: ICharacter): Promise<ICharacter> => {
    const cloned = await characterRepository.duplicateCharacter(char);
    setCharacters(prev => sortCharacters([...prev, cloned]));
    return cloned;
  }, []);

  const value = {
    character, setCharacter, updateCharacter,
    characters, loading, loadError, deleteCharacter, saveCharacter, saveCharacterOrder, duplicateCharacter
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};
