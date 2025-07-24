import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';

import App from '../App'; // Il nostro layout principale

// Importa le tue pagine dalla cartella 'features'
import { CharacterProvider } from '../features/character/CharacterProvider';
import { CharacterList } from '../features/character/CharacterList';
import { CharacterSheet } from '../features/character/CharacterSheet';
import { PlayView } from '../features/character/PlayView';
import { LoginPage } from '../features/auth/LoginPage';
import { AccountPage } from '../features/auth/AccountPage';
import { ErrorBoundary, NotFound } from '../components/ErrorBoundary'; // Importa i tuoi componenti

const CharacterLayout = () => (
  <CharacterProvider>
    <Outlet />
  </CharacterProvider>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App.tsx è il layout che contiene l'Outlet
    errorElement: <ErrorBoundary />, // Aggiungi qui l'error boundary
    children: [
      {
        element: <CharacterLayout />, // Questo layout avvolge tutte le rotte dei personaggi
        children: [
          {
            index: true, // Pagina principale (es. /)
            element: <CharacterList />,
          },
          {
            path: 'character/new',
            element: <CharacterSheet />,
          },
          {
            path: 'character/:characterId/edit',
            element: <CharacterSheet />,
          },
          {
            path: 'character/:characterId',
            element: <PlayView />,
          },
        ],
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'account',
        element: <AccountPage />,
      },
      // Aggiungi qui altre rotte, come una pagina 404
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
