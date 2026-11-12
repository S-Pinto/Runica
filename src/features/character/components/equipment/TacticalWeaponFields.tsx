import { PlusCircleIcon, TrashIcon } from '../../../../components/ui/icons';
import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../../data/weaponProperties';
import { DAMAGE_TYPES, FormFieldsProps, inputClass, labelClass } from './formShared';

const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

/** Dettagli tattici di un'arma (specchio di AttackForm): caratteristica, maestria, danni, proprietà. */
export const TacticalWeaponFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="space-y-4 p-4 bg-accent/5 rounded-xl border border-accent/20 animate-in zoom-in-95 duration-300">
    <div className="flex items-center gap-2 mb-2">
      <div className="h-px bg-accent/30 flex-1" />
      <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">Statistiche dell'arma</h4>
      <div className="h-px bg-accent/30 flex-1" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-4 space-y-1">
        <label className={labelClass}>Caratteristica per colpire</label>
        <select value={formData.attackAbility || ''} onChange={e => onChange('attackAbility', e.target.value)} className={inputClass}>
          <option value="">Nessuna (valore fisso)</option>
          {ABILITY_KEYS.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
        </select>
      </div>
      <div className="md:col-span-4 flex items-center justify-center pt-5">
        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <input type="checkbox" checked={formData.isProficient || false} onChange={e => onChange('isProficient', e.target.checked)} className="accent-accent w-4 h-4" />
          Bonus di competenza
        </label>
      </div>
      <div className="md:col-span-4 space-y-1">
        <label className={labelClass}>Maestria</label>
        <select value={formData.mastery || ''} onChange={e => onChange('mastery', e.target.value)} className={inputClass}>
          <option value="">Nessuna</option>
          {Object.entries(WEAPON_MASTERIES).map(([key, m]) => <option key={key} value={key}>{m.name}</option>)}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-5 space-y-1">
        <label className={labelClass}>Danno base</label>
        <input type="text" placeholder="1d8" value={formData.damage || ''} onChange={e => onChange('damage', e.target.value)} className={`${inputClass} font-mono font-bold text-center`} />
      </div>
      <div className="md:col-span-3 space-y-1">
        <label className={labelClass}>Danno extra</label>
        <select value={formData.damageAbility || ''} onChange={e => onChange('damageAbility', e.target.value)} className={inputClass}>
          <option value="">Nessuna</option>
          {ABILITY_KEYS.map(a => <option key={a} value={a}>+{a.substring(0, 3).toUpperCase()}</option>)}
        </select>
      </div>
      <div className="md:col-span-4 space-y-1">
        <label className={labelClass}>Tipo</label>
        <select value={formData.damageType || ''} onChange={e => onChange('damageType', e.target.value)} className={inputClass}>
          <option value="">-- Tipo --</option>
          {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
    </div>

    <div className="space-y-2">
      <label className={labelClass}>Proprietà</label>
      <div className="flex flex-wrap gap-2 p-3 bg-background/30 rounded-xl border border-border/30 min-h-[3rem]">
        {Object.keys(WEAPON_PROPERTIES).map(prop => {
          const isActive = formData.properties?.includes(prop);
          return (
            <button
              key={prop}
              type="button"
              onClick={() => {
                const currentProps = formData.properties || [];
                const newProps = isActive
                  ? currentProps.filter(p => p !== prop)
                  : [...currentProps, prop];
                onChange('properties', newProps);
              }}
              className={`text-[10px] px-2.5 py-1 rounded-md border transition-all duration-200 font-semibold uppercase tracking-wide
                ${isActive
                  ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_-4px_rgb(var(--color-accent)/0.5)]'
                  : 'bg-background/50 text-muted-foreground border-border/50 hover:border-accent/50 hover:text-foreground'
                }`}
              title={WEAPON_PROPERTIES[prop].description}
            >
              {WEAPON_PROPERTIES[prop].name}
            </button>
          );
        })}
      </div>
    </div>

    <div className="space-y-2">
      {formData.additionalDamage?.map((extra, idx) => (
        <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2">
          <input type="text" placeholder="Extra (es. 1d6)" value={extra.formula} onChange={e => {
            const newExtras = [...(formData.additionalDamage || [])];
            newExtras[idx] = { ...newExtras[idx], formula: e.target.value };
            onChange('additionalDamage', newExtras);
          }} className={`${inputClass} flex-1 text-center font-mono`} />
          <select value={extra.type} onChange={e => {
            const newExtras = [...(formData.additionalDamage || [])];
            newExtras[idx] = { ...newExtras[idx], type: e.target.value };
            onChange('additionalDamage', newExtras);
          }} className={`${inputClass} flex-1`}>
            {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <button type="button" onClick={() => onChange('additionalDamage', formData.additionalDamage?.filter((_, i) => i !== idx))} className="p-2 text-muted-foreground hover:text-destructive"><TrashIcon className="w-4 h-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange('additionalDamage', [...(formData.additionalDamage || []), { formula: '', type: '' }])} className="text-[10px] font-black uppercase text-accent/70 hover:text-accent flex items-center gap-1 ml-1 tracking-widest">
        <PlusCircleIcon className="w-3.5 h-3.5" /> Aggiungi danno di altro tipo
      </button>
    </div>
  </div>
);
