import { useNavigate } from 'react-router-dom';
import { ICharacter } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { confirmDialog, toast } from '../../../components/ui/Dialogs';
import { describeDataError } from '../../../lib/errors';

/** Azioni sulla lista personaggi: apri, modifica, elimina, duplica, esporta in JSON. */
export const useCharacterActions = () => {
  const navigate = useNavigate();
  const { deleteCharacter, duplicateCharacter } = useCharacter();

  const handleSelectCharacter = (id: string) => {
    if (id === 'new') {
      navigate('/character/new');
    } else {
      navigate(`/character/${id}`);
    }
  };

  const handleEditCharacter = (id: string) => {
    navigate(`/character/${id}/edit`);
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (await confirmDialog({ title: `Eliminare ${name}?`, message: "L'azione non può essere annullata.", confirmLabel: 'Elimina', destructive: true })) {
      try {
        await deleteCharacter(id);
      } catch (error) {
        console.error('Failed to delete character', error);
        toast.error(describeDataError(error, 'Eliminazione non riuscita.'));
      }
    }
  };

  const handleDuplicateCharacter = async (char: ICharacter) => {
    try {
      await duplicateCharacter(char);
    } catch (error) {
      console.error('Failed to duplicate character', error);
      toast.error(describeDataError(error, 'Duplicazione non riuscita.'));
    }
  };

  const handleExportCharacter = (char: ICharacter) => {
    const dataStr = JSON.stringify(char, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${char.name || 'character'}-runica-sheet.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { handleSelectCharacter, handleEditCharacter, handleDeleteCharacter, handleDuplicateCharacter, handleExportCharacter };
};
