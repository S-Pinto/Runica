import { ReactNode, useEffect, useState } from 'react';
import { AbilityScores, DefenseKind, ItemEffects } from '../../characterTypes';
import { Button } from '../../../../components/ui/Button';
import { PlusIcon, TrashIcon } from '../../../../components/ui/icons';
import { fieldNumericClass } from '../../../../components/ui/field';
import { ABILITY_LABELS } from '../../../../lib/labels';
import { ABILITY_KEYS } from '../../rules/attacks';
import { feetToMeters } from '../../rules/itemEffects';
import { DEFENSE_KIND_LABELS } from '../../utils/itemLabels';
import { DamageTypeSelect } from './DamageTypeSelect';
import { FormFieldsProps, inputClass, labelClass } from './formShared';

const SENSE_SUGGESTIONS = ['Scurovisione', 'Vista cieca', 'Percezione tellurica', 'Vista pura'];

/** Intero con segno scritto a mano ("+2", "-10"); vuoto = nessun bonus. Testo semplice: la tastiera numerica di iOS non ha il meno. */
const signedInt = (v: string) => {
  const n = parseInt(v.replace(/\s+/g, ''), 10);
  return Number.isFinite(n) && n !== 0 ? n : undefined;
};
const signedValue = (n: number | undefined) => (n ? (n > 0 ? `+${n}` : String(n)) : '');

/** Campo per un bonus con segno: tiene il testo mentre si scrive ("-", "+") e passa fuori solo il numero. */
const SignedInput = ({ value, onChange, className = '', ...rest }: { value: number | undefined; onChange: (n: number | undefined) => void; id?: string; placeholder?: string; className?: string; 'aria-label'?: string }) => {
  const [text, setText] = useState(signedValue(value));
  useEffect(() => {
    if (signedInt(text) !== value) setText(signedValue(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="text"
      autoComplete="off"
      {...rest}
      value={text}
      onChange={e => { setText(e.target.value); onChange(signedInt(e.target.value)); }}
      className={`${fieldNumericClass} ${className}`}
    />
  );
};

const RemoveButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button variant="ghost" size="icon-lg" aria-label={label} onClick={onClick} className="shrink-0 hover:text-destructive">
    <TrashIcon className="h-4 w-4" />
  </Button>
);

const AddButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <Button variant="ghost" size="sm" onClick={onClick} className="-ml-2 text-accent">
    <PlusIcon className="h-3.5 w-3.5" /> {children}
  </Button>
);

/**
 * Proprietà passive: difese ai tipi di danno, bonus a CA, velocità, iniziativa e tiri salvezza, sensi, lingue
 * e avvisi tattici. Valgono con l'oggetto equipaggiato (e in sintonia, se la richiede).
 */
export const ItemEffectsFields = ({ formData, onChange }: FormFieldsProps) => {
  const effects: ItemEffects = formData.effects || {};
  const set = (patch: Partial<ItemEffects>) => onChange('effects', { ...effects, ...patch });
  const defenses = effects.defenses || [];
  const saves = effects.saveBonuses || [];
  const senses = effects.senses || [];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="bonusAC" className={labelClass}>CA</label>
          <SignedInput id="bonusAC" placeholder="+1" value={formData.bonusAC} onChange={n => onChange('bonusAC', n)} />
        </div>
        <div>
          <label htmlFor="speedBonus" className={labelClass}>Velocità (ft)</label>
          <SignedInput id="speedBonus" placeholder="+10" value={effects.speedBonus} onChange={n => set({ speedBonus: n })} />
        </div>
        <div>
          <label htmlFor="initiativeBonus" className={labelClass}>Iniziativa</label>
          <SignedInput id="initiativeBonus" placeholder="+2" value={effects.initiativeBonus} onChange={n => set({ initiativeBonus: n })} />
        </div>
      </div>

      <div className="space-y-2">
        <p className={labelClass}>Difese ai danni</p>
        {defenses.map((d, idx) => (
          <div key={idx} className="flex gap-2">
            <select
              aria-label={`Difesa ${idx + 1}: tipo`}
              value={d.kind}
              onChange={e => set({ defenses: defenses.map((x, i) => (i === idx ? { ...x, kind: e.target.value as DefenseKind } : x)) })}
              className={`${inputClass} min-w-0 flex-1`}
            >
              {(Object.keys(DEFENSE_KIND_LABELS) as DefenseKind[]).map(k => <option key={k} value={k}>{DEFENSE_KIND_LABELS[k]}</option>)}
            </select>
            <DamageTypeSelect
              aria-label={`Difesa ${idx + 1}: danno`}
              value={d.damageType}
              onChange={damageType => set({ defenses: defenses.map((x, i) => (i === idx ? { ...x, damageType } : x)) })}
              className="min-w-0 flex-1"
            />
            <RemoveButton label={`Rimuovi difesa ${idx + 1}`} onClick={() => set({ defenses: defenses.filter((_, i) => i !== idx) })} />
          </div>
        ))}
        <AddButton onClick={() => set({ defenses: [...defenses, { kind: 'resistance', damageType: '' }] })}>Resistenza, immunità o vulnerabilità</AddButton>
      </div>

      <div className="space-y-2">
        <p className={labelClass}>Tiri salvezza</p>
        {saves.map((b, idx) => (
          <div key={idx} className="flex gap-2">
            <select
              aria-label={`Bonus al tiro salvezza ${idx + 1}: caratteristica`}
              value={b.ability}
              onChange={e => set({ saveBonuses: saves.map((x, i) => (i === idx ? { ...x, ability: e.target.value as keyof AbilityScores | 'all' } : x)) })}
              className={`${inputClass} min-w-0 flex-1`}
            >
              <option value="all">Tutti i tiri salvezza</option>
              {ABILITY_KEYS.map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
            </select>
            <SignedInput
              aria-label={`Bonus al tiro salvezza ${idx + 1}: valore`}
              placeholder="+1"
              value={b.value || undefined}
              onChange={n => set({ saveBonuses: saves.map((x, i) => (i === idx ? { ...x, value: n ?? 0 } : x)) })}
              className="w-24 shrink-0"
            />
            <RemoveButton label={`Rimuovi bonus al tiro salvezza ${idx + 1}`} onClick={() => set({ saveBonuses: saves.filter((_, i) => i !== idx) })} />
          </div>
        ))}
        <AddButton onClick={() => set({ saveBonuses: [...saves, { ability: 'all', value: 1 }] })}>Bonus ai tiri salvezza</AddButton>
      </div>

      <div className="space-y-2">
        <p className={labelClass}>Sensi</p>
        <datalist id="item-sense-suggestions">{SENSE_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
        {senses.map((s, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              list="item-sense-suggestions"
              aria-label={`Senso ${idx + 1}: nome`}
              placeholder="Scurovisione"
              value={s.name}
              onChange={e => set({ senses: senses.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) })}
              className={`${inputClass} min-w-0 flex-1`}
            />
            <div className="relative w-28 shrink-0">
              <input
                type="number"
                inputMode="decimal"
                aria-label={`Senso ${idx + 1}: distanza in metri`}
                placeholder="18"
                value={s.range ? feetToMeters(s.range) : ''}
                onChange={e => {
                  const meters = parseFloat(e.target.value);
                  const range = Number.isFinite(meters) && meters > 0 ? Math.round(meters / 0.3) : undefined;
                  set({ senses: senses.map((x, i) => (i === idx ? { ...x, range } : x)) });
                }}
                className={`${fieldNumericClass} pr-8`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
            </div>
            <RemoveButton label={`Rimuovi senso ${idx + 1}`} onClick={() => set({ senses: senses.filter((_, i) => i !== idx) })} />
          </div>
        ))}
        <AddButton onClick={() => set({ senses: [...senses, { name: '' }] })}>Senso</AddButton>
      </div>

      <div>
        <label htmlFor="item-languages" className={labelClass}>Lingue</label>
        <input
          id="item-languages"
          type="text"
          placeholder="Gigante, Primordiale"
          value={(effects.languages || []).join(',')}
          onChange={e => set({ languages: e.target.value ? e.target.value.split(',') : undefined })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="item-notes" className={labelClass}>Avvisi in combattimento</label>
        <textarea
          id="item-notes"
          rows={2}
          placeholder={'Uno per riga. Es. Maledetto: non puoi toglierlo'}
          value={(effects.notes || []).join('\n')}
          onChange={e => set({ notes: e.target.value ? e.target.value.split('\n') : undefined })}
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <p className="mt-1 text-xs text-muted-foreground">Gli avvisi compaiono appena l'oggetto è equipaggiato, anche senza sintonia.</p>
      </div>
    </>
  );
};
