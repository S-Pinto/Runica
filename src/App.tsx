import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './components/layout/AppHeader';
import { SettingsModal } from './components/SettingsModal';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen text-text-main">
      <AppHeader onSettingsClick={() => setIsSettingsOpen(true)} />
      <main>
        <Outlet />
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
