import { Attack } from '../../characterTypes';
import { TrashIcon, PlusIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { fieldNumericClass } from '../../../../components/ui/field';
import { DamageTypeSelect } from '../equipment/DamageTypeSelect';

type AdditionalDamage = NonNullable<Attack['additionalDamage']>;

/** Elenco dei danni extra (formula + tipo) con aggiunta e rimozione: usato dal form attacco e dal form oggetto. */
export const AdditionalDamageEditor = ({ extras, onChange }: { extras: AdditionalDamage | undefined; onChange: (value: AdditionalDamage) => void }) => {
  const list = extras || [];
  const update = (idx: number, patch: Partial<AdditionalDamage[number]>) =>
    onChange(list.map((extra, i) => (i === idx ? { ...extra, ...patch } : extra)));

  return (
    <div className="mt-3 space-y-2">
      {list.map((extra, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            type="text"
            aria-label={`Danno extra ${idx + 1}: formula`}
            placeholder="Extra (1d6)"
            value={extra.formula}
            onChange={e => update(idx, { formula: e.target.value })}
            className={`${fieldNumericClass} min-w-0 flex-1`}
          />
          <DamageTypeSelect
            aria-label={`Danno extra ${idx + 1}: tipo`}
            value={extra.type}
            onChange={type => update(idx, { type })}
            className="min-w-0 flex-1"
          />
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={`Rimuovi danno extra ${idx + 1}`}
            onClick={() => onChange(list.filter((_, i) => i !== idx))}
            className="hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={() => onChange([...list, { formula: '', type: '' }])} className="-ml-2 text-accent">
        <PlusIcon className="h-3.5 w-3.5" /> Danno di un altro tipo
      </Button>
    </div>
  );
};
