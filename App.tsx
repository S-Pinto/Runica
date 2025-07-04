
import React, { useState } from 'react';
import { CharacterList } from './components/CharacterList';
import { CharacterSheet } from './components/CharacterSheet';
import { PlayView } from './components/PlayView';
import * as characterService from './services/characterService';

type ViewState = 'list' | 'play' | 'edit';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);

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
          <CharacterList onSelectCharacter={handleSelectCharacter} />
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
