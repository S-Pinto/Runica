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


/** Campi ed etichette dei form: le classi comuni di components/ui/field. */
export { fieldControlOnTileClass as inputClass, fieldLabelClass as labelClass } from '../../../../components/ui/field';

/** Id locale per righe nuove (poteri, proprietà). */
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
