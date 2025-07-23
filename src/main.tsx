// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client'; // Assicurati che l'import sia corretto
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { router } from './routes/index';
import './lib/firebaseConfig'; // Importa per l'effetto di inizializzazione di Firebase
import './index.css';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
