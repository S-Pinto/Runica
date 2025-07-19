
import React from 'react';
import { Outlet } from 'react-router-dom';

// App.tsx non ha più bisogno di conoscere l'utente o lo stato di caricamento,
// perché la logica di protezione delle rotte è gestita in `src/routes/index.tsx`.
// Diventa un semplice contenitore di layout.
const App: React.FC = () => {
  // Il loading spinner può essere gestito a livello di rotta con i "loader" di React Router
  // o rimanere qui se vuoi un caricamento globale. Per ora lo togliamo per semplicità.

  return (
    <main className="min-h-screen">
      {/* Outlet renderizzerà il componente figlio corretto in base all'URL */}
      {/* I componenti figli useranno `useAuth()` direttamente per accedere a currentUser */}
      <Outlet />
    </main>
  );
};

export default App;