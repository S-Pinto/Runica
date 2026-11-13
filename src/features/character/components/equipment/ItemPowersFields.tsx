import { ItemPower } from '../../characterTypes';
import { Button } from '../../../../components/ui/Button';
import { PlusIcon } from '../../../../components/ui/icons';
import { ChargesFields } from './AttunementFields';
import { ItemPowerEditor } from './ItemPowerEditor';
import { UsesTrackingFields } from './MagicItemFields';
import { FormFieldsProps, newId } from './formShared';

/** Cariche dell'oggetto e poteri attivabili: con l'oggetto equipaggiato ogni potere compare tra le azioni di Combattimento. */
export const ItemPowersFields = ({ formData, onChange }: FormFieldsProps) => {
  const powers = formData.powers || [];
  const update = (idx: number, patch: Partial<ItemPower>) =>
    onChange('powers', powers.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  return (
    <>
      <ChargesFields formData={formData} onChange={onChange} />
      {/* Usi del formato vecchio: le cariche nuove sono qui sopra. */}
      {!!formData.uses?.max && <UsesTrackingFields formData={formData} onChange={onChange} />}

      {powers.map((power, idx) => (
        <ItemPowerEditor
          key={power.id}
          power={power}
          index={idx}
          hasItemCharges={!!formData.charges?.max}
          onChange={patch => update(idx, patch)}
          onRemove={() => onChange('powers', powers.filter((_, i) => i !== idx))}
        />
      ))}
      <Button
        variant="secondary"
        onClick={() => onChange('powers', [...powers, { id: newId('pw'), name: '', roll: 'attack', attackAbility: 'spell' }])}
        className="w-full sm:w-auto"
      >
        <PlusIcon className="h-4 w-4" /> Aggiungi potere
      </Button>
      <p className="text-xs text-muted-foreground">Con l'oggetto equipaggiato, ogni potere compare tra le azioni di Combattimento, anche su armature ed elmi.</p>
    </>
  );
};
