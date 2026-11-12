// src/providers/AuthProvider.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import * as authService from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  /** True quando lo stato di login è noto (utente o assenza di utente). */
  authReady: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  authReady: false,
  signInWithGoogle: () => Promise.reject('Auth provider not initialized'),
  logout: () => Promise.reject('Auth provider not initialized'),
});

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
      if (user) {
        // Attendiamo che il token sia pronto, così tutti i servizi Firebase (incluso
        // Storage) conoscono lo stato di autenticazione prima di procedere.
        // Offline il refresh del token può fallire: l'utente resta comunque loggato
        // (le sessioni sono persistite) e i dati arrivano dalla cache locale.
        try {
          await user.getIdToken();
        } catch (error) {
          console.warn('Impossibile ottenere il token di autenticazione (offline?).', error);
        }
      }
      if (cancelled) return;
      setCurrentUser(user);
      setLoading(false);
    };

    let cancelled = false;
    const unsubscribe = authService.onAuthStateChangedListener((user) => {
      void handleUserLogin(user);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loading,
    // Il provider non renderizza i figli finché l'auth non è risolta: dentro l'app è sempre true.
    authReady: !loading,
    signInWithGoogle: authService.signInWithGoogle,
    logout: authService.signOutUser,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Questo componente "avvolge" la tua app e le fornisce lo stato dell'utente
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
