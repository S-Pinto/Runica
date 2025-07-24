import React, { useState } from 'react';
import { useCharacter } from '../CharacterProvider';
import { ICompanion } from '../characterTypes';
import { PlusCircleIcon, SparklesIcon } from '../../../components/ui/icons';
import { CompanionCard } from './CompanionCard';
import { CompanionSheetModal } from './CompanionSheetModal';

interface CompanionTabProps {
  readOnly?: boolean;
}

export const CompanionTab: React.FC<CompanionTabProps> = ({ readOnly = false }) => {
  const { character, setCharacter } = useCharacter();
  const [selectedCompanion, setSelectedCompanion] = useState<ICompanion | null>(null);
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);

  const createNewCompanion = (): ICompanion => ({
    id: `comp_${Date.now()}`,
    name: 'New Companion',
    type: 'Familiar',
    hp: { max: 10, current: 10, temporary: 0 },
    armorClass: 10,
    speed: '30 ft.',
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    skills: [],
    attacks: [],
    spells: [],
    featuresAndTraits: [],
    equipment: [],
    notes: '',
  });

  const handleAddCompanion = () => {
    setSelectedCompanion(createNewCompanion());
    setIsModalReadOnly(false);
  };

  const handleEditCompanion = (companion: ICompanion) => {
    setSelectedCompanion(companion);
    setIsModalReadOnly(false);
  };

  const handleViewCompanion = (companion: ICompanion) => {
    setSelectedCompanion(companion);
    setIsModalReadOnly(true);
  };

  const handleDeleteCompanion = (companionId: string) => {
    if (window.confirm('Are you sure you want to delete this companion?')) {
      setCharacter(prev => {
        if (!prev) return null;
        return {
          ...prev,
          companions: prev.companions.filter(c => c.id !== companionId),
        };
      });
    }
  };

  const handleSaveCompanion = (companionToSave: ICompanion, closeModalAfterSave = true) => {
    setCharacter(prev => {
      if (!prev) return null;
      const existing = prev.companions.find(c => c.id === companionToSave.id);
      if (existing) {
        // Update existing
        return {
          ...prev,
          companions: prev.companions.map(c => c.id === companionToSave.id ? companionToSave : c),
        };
      } else {
        // Add new
        return {
          ...prev,
          companions: [...prev.companions, companionToSave],
        };
      }
    });
    if (closeModalAfterSave) {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setSelectedCompanion(null);
  };

  if (!character) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-cinzel text-accent">Companions & Summons</h2>
        {!readOnly && (
          <button onClick={handleAddCompanion} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg shadow-md hover:bg-primary/90 transition-colors">
            <PlusCircleIcon className="w-5 h-5" />
            Add Companion
          </button>
        )}
      </div>

      {character.companions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {character.companions.map(companion => (
            <CompanionCard 
              key={companion.id} 
              companion={companion} 
              onEdit={() => !readOnly && handleEditCompanion(companion)}
              onDelete={() => handleDeleteCompanion(companion.id)}
              onView={() => handleViewCompanion(companion)}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-muted/20 rounded-lg border-2 border-dashed border-border">
            <SparklesIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-2 text-lg font-medium text-zinc-300">No Companions Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your familiars, animal companions, and summons will appear here.</p>
            {!readOnly && (
              <div className="mt-6">
                  <button onClick={handleAddCompanion} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                      <PlusCircleIcon className="w-5 h-5" /> Add your first companion
                  </button>
              </div>
            )}
        </div>
      )}

      {selectedCompanion && (
        <CompanionSheetModal 
          companion={selectedCompanion} 
          onSave={handleSaveCompanion} 
          onClose={handleCloseModal} 
          readOnly={isModalReadOnly}
        />
      )}
    </div>
  );
};