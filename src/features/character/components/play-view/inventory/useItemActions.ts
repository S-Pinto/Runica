import { useCharacter } from '../../../CharacterProvider';
import { getEquipWarning, MAX_ATTUNED_ITEMS, toggleAttunement, toggleEquippedItem } from '../../../rules/equipment';
import { spendActionUse, type ResolvedAction } from '../../../rules/attacks';
import { toast } from '../../../../../components/ui/Dialogs';

/** Azioni di gioco su un oggetto (equipaggia, sintonia, uso di un potere), condivise da Inventario, Combattimento e Scheda Oggetto. */
export const useItemActions = () => {
  const { character, updateCharacter } = useCharacter();
  const equipment = character?.equipment || [];

  const toggleEquip = (itemId: string) => {
    const next = toggleEquippedItem(equipment, itemId);
    if (!next) return;
    updateCharacter({ equipment: next });
    const warning = getEquipWarning(next, itemId);
    if (warning) toast.info(warning);
  };

  const toggleAttune = (itemId: string) => {
    const result = toggleAttunement(equipment, itemId);
    if (result.ok) updateCharacter({ equipment: result.equipment });
    else if (result.reason === 'limit') toast.info(`Puoi essere in sintonia con al massimo ${MAX_ATTUNED_ITEMS} oggetti magici.`);
  };

  const spendUse = (action: ResolvedAction, delta: number) => {
    if (!character) return;
    const patch = spendActionUse(character, action, delta);
    if (Object.keys(patch).length) updateCharacter(patch);
  };

  return { toggleEquip, toggleAttune, spendUse };
};
