import React, { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { ICompanion } from '../../characterTypes';
import { PlusCircleIcon, SparklesIcon } from '../../../../components/ui/icons';
import { CompanionCard } from '../CompanionCard';
import { CompanionSheetModal } from '../CompanionSheetModal';
import { confirmDialog } from '../../../../components/ui/Dialogs';
import { Button } from '../../../../components/ui/Button';

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

  const handleDeleteCompanion = async (companionId: string) => {
    if (await confirmDialog({ title: 'Eliminare questo compagno?', confirmLabel: 'Elimina', destructive: true })) {
      setCharacter(prev => {
        if (!prev) return null;
        return {
          ...prev,
          companions: prev.companions.filter(c => c.id !== companionId),
        };
      });
    }
  };

  const handleDuplicateCompanion = (companionToDuplicate: ICompanion) => {
    // Deep copy the companion object. JSON stringify/parse is a simple way for plain data objects.
    const newCompanion: ICompanion = JSON.parse(JSON.stringify(companionToDuplicate));

    // Assign a new unique ID and a modified name
    newCompanion.id = `comp_${Date.now()}`;
    newCompanion.name = `${newCompanion.name} (Copy)`;

    setCharacter(prev => {
      if (!prev) return null;
      // Add the new companion to the list
      return { ...prev, companions: [...prev.companions, newCompanion] };
    });
  };

  const handleSaveCompanion = (companionToSave: ICompanion, closeModalAfterSave?: boolean) => {
    let isNewCompanion = false;
    setCharacter(prev => {
      if (!prev) return null;
      const existing = prev.companions.find(c => c.id === companionToSave.id);
      if (existing) {
        // Update existing
        isNewCompanion = false;
        return {
          ...prev,
          companions: prev.companions.map(c => c.id === companionToSave.id ? companionToSave : c),
        };
      } else {
        // Add new
        isNewCompanion = true;
        return {
          ...prev,
          companions: [...prev.companions, companionToSave],
        };
      }
    });

    // Decide se chiudere il modale.
    // Se il flag non viene passato (es. dal pulsante 'Save' principale),
    // chiudi solo quando si crea un nuovo compagno.
    // Altrimenti, rispetta il flag passato (es. per l'autosave dei PF).
    const shouldClose = closeModalAfterSave === undefined ? isNewCompanion : closeModalAfterSave;
 
    if (shouldClose) {
      handleCloseModal();
    } else if (closeModalAfterSave === undefined && !isNewCompanion) {
      // Se stiamo salvando un compagno esistente (non uno nuovo)
      // e l'azione proviene dal pulsante di salvataggio principale (closeModalAfterSave non è specificato),
      // torniamo alla modalità di sola lettura invece di chiudere.
      setIsModalReadOnly(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedCompanion(null);
  };

  if (!character) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
        <h2 className="font-cinzel text-headline text-foreground">Compagni ed evocazioni</h2>
        {!readOnly && (
          <Button onClick={handleAddCompanion}>
            <PlusCircleIcon className="h-5 w-5" />
            Aggiungi compagno
          </Button>
        )}
      </div>

      {character.companions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {character.companions.map(companion => (
            <CompanionCard 
              key={companion.id} 
              companion={companion} 
              onEdit={() => !readOnly && handleEditCompanion(companion)}
              onDuplicate={() => !readOnly && handleDuplicateCompanion(companion)}
              onDelete={() => handleDeleteCompanion(companion.id)}
              onView={() => handleViewCompanion(companion)}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : (
        <div className="tile px-6 py-12 text-center">
            <SparklesIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-cinzel text-title text-foreground">Nessun compagno</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {readOnly
                ? 'Famigli, compagni animali ed evocazioni si aggiungono da Modifica e compaiono qui.'
                : 'Famigli, compagni animali ed evocazioni compariranno qui.'}
            </p>
            {!readOnly && (
              <Button onClick={handleAddCompanion} className="mt-5">
                <PlusCircleIcon className="h-5 w-5" /> Aggiungi il primo compagno
              </Button>
            )}
        </div>
      )}

      {selectedCompanion && (
        <CompanionSheetModal 
          companion={selectedCompanion} 
          onSave={handleSaveCompanion} 
          onClose={handleCloseModal} 
          readOnly={isModalReadOnly}
          onSetReadOnly={setIsModalReadOnly}
        />
      )}
    </div>
  );
};