import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import App from '../App'; // Il nostro layout principale

// Importa le tue pagine dalla cartella 'features'
import { CharacterProvider } from '../features/character/CharacterProvider';
import { CharacterList } from '../features/character/CharacterList';
import { CharacterSheet } from '../features/character/CharacterSheet';
import { PlayView } from '../features/character/PlayView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App.tsx è il layout che contiene l'Outlet
    children: [
      {
        index: true, // Pagina principale (es. CharacterList)
        element: <CharacterList />,
      },
      {
        path: 'character/new', // Rotta per creare un nuovo personaggio
        element: (
          <CharacterProvider>
            <CharacterSheet />
          </CharacterProvider>
        ),
      },
      {
        path: 'character/:characterId/edit', // Rotta per modificare un personaggio
        element: (
          <CharacterProvider>
            <CharacterSheet />
          </CharacterProvider>
        ),
      },
      {
        path: 'character/:characterId', // Rotta per la vista di gioco
        element: (
          <CharacterProvider>
            <PlayView />
          </CharacterProvider>
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
