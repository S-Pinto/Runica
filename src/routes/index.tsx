import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';

import App from '../App'; // Il nostro layout principale

// Importa le tue pagine dalla cartella 'features'
import { CharacterProvider } from '../features/character/CharacterProvider';
import { CharacterList } from '../features/character/CharacterList';
import { CharacterSheet } from '../features/character/CharacterSheet';
import { PlayView } from '../features/character/PlayView';
import { LoginPage } from '../features/auth/LoginPage';
import { ErrorBoundary, NotFound } from '../components/ErrorBoundary'; // Importa i tuoi componenti

const CharacterLayout = () => (
  <CharacterProvider>
    <Outlet />
  </CharacterProvider>
);

// Per maggiore chiarezza, raggruppiamo le rotte che necessitano del CharacterLayout.
// Questa è una "pathless route" (rotta senza percorso) che applica il layout a tutte le sue rotte figlie.
const characterRoutes = {
  element: <CharacterLayout />,
  children: [
    {
      index: true, // Pagina principale (es. /)
      element: <CharacterList />,
    },
    {
      path: 'character/new', // Rotta per creare un nuovo personaggio
      element: <CharacterSheet />,
    },
    {
      path: 'character/:characterId/edit', // Rotta per modificare un personaggio
      element: <CharacterSheet />,
    },
    {
      path: 'character/:characterId', // Rotta per la vista di gioco
      element: <PlayView />,
    },
  ],
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App.tsx è il layout che contiene l'Outlet
    errorElement: <ErrorBoundary />, // Aggiungi qui l'error boundary
    children: [
      characterRoutes,
      {
        path: 'login',
        element: <LoginPage />,
      },
      // Aggiungi qui altre rotte, come una pagina 404
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
