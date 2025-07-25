// src/providers/AuthProvider.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import * as authService from '../services/authService';
import * as characterService from '../features/character/characterService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

// Questo è un custom hook che useremo nei componenti per accedere allo stato dell'utente
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUserLogin = async (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        // RISOLUZIONE DEL BUG:
        // Attendiamo che il token di autenticazione sia pronto.
        // Questo assicura che tutti i servizi Firebase (incluso Storage)
        // siano a conoscenza dello stato di autenticazione prima di procedere.
        await user.getIdToken();
        await characterService.migrateLocalDataToFirestore();
      }
      setLoading(false);
    };

    const unsubscribe = authService.onAuthSateChangedListener(handleUserLogin);

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = { currentUser, loading };

  // Questo componente "avvolge" la tua app e le fornisce lo stato dell'utente
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
