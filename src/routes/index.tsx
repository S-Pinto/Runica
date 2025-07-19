import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from '../App'; // Il nostro layout principale
import AuthProvider, { useAuth } from '../providers/AuthProvider';

// Importa le tue pagine dalla cartella 'features'
import { CharacterList } from '../features/character/CharacterList';
import { CharacterSheet } from '../features/character/CharacterSheet';
import { PlayView } from '../features/character/PlayView';

// Un componente per le rotte protette
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    // Se non c'è utente, reindirizza alla home (o a una pagina di login)
    // Qui potresti mostrare un messaggio o un componente di login
    return <p>Please log in to see your characters.</p>;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App.tsx è il layout che contiene l'Outlet
    children: [
      {
        index: true, // Pagina principale (es. CharacterList)
        element: (
          <ProtectedRoute>
            <CharacterList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'character/new', // Rotta per creare un nuovo personaggio
        element: (
          <ProtectedRoute>
            <CharacterSheet characterId="new" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'character/:characterId/edit', // Rotta per modificare un personaggio
        element: (
          <ProtectedRoute>
            <CharacterSheet />
          </ProtectedRoute>
        ),
      },
      {
        path: 'character/:characterId', // Rotta per la vista di gioco
        element: (
          <ProtectedRoute>
            <PlayView />
          </ProtectedRoute>
        ),
      },
      // Aggiungi qui altre rotte, come una pagina 404
      {
        path: '*',
        element: <h1>404: Page Not Found</h1>,
      },
    ],
  },
]);

