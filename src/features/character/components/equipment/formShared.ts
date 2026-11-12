import { EquipmentItem } from '../../characterTypes';

export type EquipmentFormData = Omit<EquipmentItem, 'id'> & { id?: string };

/** Props comuni delle sezioni del form oggetto: dati correnti e setter di un singolo campo. */
export interface FormFieldsProps {
  formData: EquipmentFormData;
  onChange: <K extends keyof EquipmentItem>(field: K, value: EquipmentItem[K] | undefined) => void;
}

export const DAMAGE_TYPES = [
  'Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic',
  'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'
];

export const inputClass = "w-full bg-input p-2.5 rounded-lg border border-border focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm font-medium transition-all";
export const labelClass = "block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider ml-1";
