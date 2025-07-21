
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './components/layout/Header';

// App.tsx non ha più bisogno di conoscere l'utente o lo stato di caricamento,
// perché la logica di protezione delle rotte è gestita in `src/routes/index.tsx`.
// Diventa un semplice contenitore di layout.
const App: React.FC = () => {
  // Il loading spinner può essere gestito a livello di rotta con i "loader" di React Router
  // o rimanere qui se vuoi un caricamento globale. Per ora lo togliamo per semplicità.

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-200">
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="text-center text-sm text-zinc-500 py-4">
        <p>&copy; {new Date().getFullYear()} RUNICA. All rights reserved.</p>
      </footer>
    </div>  
  );
};

export default App;