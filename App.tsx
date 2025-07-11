
import React, { useState, useEffect } from 'react';
import { CharacterList } from './components/CharacterList';
import { CharacterSheet } from './components/CharacterSheet';
import { PlayView } from './components/PlayView';
import * as characterService from './services/characterService';
import * as authService from './services/authService';
import type { User } from 'firebase/auth';

type ViewState = 'list' | 'play' | 'edit';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);


  useEffect(() => {
    const unsubscribe = authService.onAuthSateChangedListener((user) => {
      setCurrentUser(user);
      if (user) {
        // User just logged in, check if they have local data to migrate
        characterService.migrateLocalDataToFirestore();
      }
      setAuthInitialized(true);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    setViewState(id === 'new' ? 'edit' : 'play');
  };

  const handleGoToEdit = () => {
    if (activeCharacterId) {
      setViewState('edit');
    }
  };

  const handleReturnToList = () => {
    setActiveCharacterId(null);
    setViewState('list');
  };

  const handleExitEdit = () => {
    if (activeCharacterId === 'new') {
      handleReturnToList(); // Cancel creation
    } else {
      setViewState('play'); // Return to play view
    }
  };
  
  const handleSaveComplete = (savedId: string) => {
    setActiveCharacterId(savedId);
    setViewState('play');
  }

  const handleDeleteCharacter = async (id: string) => {
    if (!id || id === 'new' || id === 'temp_new') return;
    await characterService.deleteCharacter(id);
    handleReturnToList();
  }
  
  if (!authInitialized) {
      return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-500"></div>
        </div>
    );
  }

  const renderContent = () => {
    switch (viewState) {
      case 'edit':
        return (
          <CharacterSheet
            characterId={activeCharacterId!}
            onSaveComplete={handleSaveComplete}
            onDelete={handleDeleteCharacter}
            onBack={handleExitEdit}
          />
        );
      case 'play':
        return (
          <PlayView
            characterId={activeCharacterId!}
            onGoToEdit={handleGoToEdit}
            onBack={handleReturnToList}
          />
        );
      case 'list':
      default:
        return (
          <CharacterList 
            onSelectCharacter={handleSelectCharacter} 
            currentUser={currentUser}
          />
        );
    }
  };

  return (
    <main className="min-h-screen">
      {renderContent()}
    </main>
  );
};

export default App;