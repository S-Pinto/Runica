import { Button } from '../../../../components/ui/Button';
import { PhotoIcon, PlusIcon, TrashIcon, XMarkIcon } from '../../../../components/ui/icons';
import { FormFieldsProps, inputClass, labelClass, newId } from './formShared';

/** Note, proprietà nominate (titolo + descrizione) e immagine (URL, o caricata dal dispositivo). */
export const ItemLoreFields = ({ formData, onChange, onUploadImage }: FormFieldsProps & { onUploadImage: () => void }) => {
  const traits = formData.traits || [];
  const updateTrait = (idx: number, patch: Partial<(typeof traits)[number]>) =>
    onChange('traits', traits.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const imageIsData = formData.imageUrl?.startsWith('data:');

  return (
    <>
      <div>
        <label htmlFor="description" className={labelClass}>Descrizione e note</label>
        <textarea id="description" value={formData.description} onChange={e => onChange('description', e.target.value)} className={`${inputClass} resize-y leading-relaxed`} rows={3} />
      </div>

      <div className="space-y-2">
        <p className={labelClass}>Proprietà e storia</p>
        {traits.map((trait, idx) => (
          <div key={trait.id} className="space-y-2 rounded-xl bg-input/40 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                aria-label={`Proprietà ${idx + 1}: titolo`}
                placeholder="Es. Arma infuocata"
                value={trait.name}
                onChange={e => updateTrait(idx, { name: e.target.value })}
                className={`${inputClass} min-w-0 flex-1`}
              />
              <Button variant="ghost" size="icon-lg" aria-label={`Rimuovi la proprietà ${trait.name || idx + 1}`} onClick={() => onChange('traits', traits.filter((_, i) => i !== idx))} className="shrink-0 hover:text-destructive">
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              aria-label={`Proprietà ${idx + 1}: descrizione`}
              rows={2}
              placeholder="Cosa fa, quando si attiva, da dove viene…"
              value={trait.description}
              onChange={e => updateTrait(idx, { description: e.target.value })}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onChange('traits', [...traits, { id: newId('tr'), name: '', description: '' }])} className="-ml-2 text-accent">
          <PlusIcon className="h-3.5 w-3.5" /> Proprietà
        </Button>
      </div>

      <div>
        <label htmlFor="item-image-url" className={labelClass}>Immagine</label>
        <div className="flex items-center gap-2">
          {formData.imageUrl && <img src={formData.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />}
          <input
            id="item-image-url"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={imageIsData ? '' : formData.imageUrl || ''}
            disabled={imageIsData}
            onChange={e => onChange('imageUrl', e.target.value.trim() || undefined)}
            className={`${inputClass} min-w-0 flex-1`}
          />
          {formData.imageUrl && (
            <Button variant="ghost" size="icon-lg" aria-label="Togli l'immagine" onClick={() => onChange('imageUrl', undefined)} className="shrink-0">
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
          <Button variant="secondary" onClick={onUploadImage} className="shrink-0">
            <PhotoIcon className="h-4 w-4" /> Carica
          </Button>
        </div>
        {imageIsData && <p className="mt-1 text-xs text-muted-foreground">Immagine salvata nella scheda (modalità senza accesso).</p>}
      </div>
    </>
  );
};
