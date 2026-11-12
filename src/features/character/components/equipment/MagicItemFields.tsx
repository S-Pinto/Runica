import { DAMAGE_TYPES, FormFieldsProps, inputClass, labelClass } from './formShared';

/** Potere dell'oggetto magico: capacità/incantesimo, tiro salvezza, effetto. */
export const MagicPowerFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="space-y-4 p-4 bg-accent/5 rounded-xl border border-accent/20 animate-in zoom-in-95 duration-300">
    <div className="flex items-center gap-2 mb-2">
      <div className="h-px bg-accent/30 flex-1" />
      <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">Potere dell'oggetto</h4>
      <div className="h-px bg-accent/30 flex-1" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-8 space-y-1">
        <label className={labelClass}>Capacità speciale o incantesimo</label>
        <input type="text" placeholder="Es. Palla di fuoco" value={formData.grantsSpellName || ''} onChange={e => onChange('grantsSpellName', e.target.value)} className={inputClass} />
      </div>
      <div className="md:col-span-4 space-y-1">
        <label className={labelClass}>Tiro salvezza su</label>
        <select value={formData.saveAbility || ''} onChange={e => onChange('saveAbility', e.target.value)} className={inputClass}>
          <option value="">Nessuno (tiro per colpire)</option>
          {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-7 space-y-1">
        <label className={labelClass}>Effetto o danni</label>
        <input type="text" placeholder="8d6" value={formData.damage || ''} onChange={e => onChange('damage', e.target.value)} className={`${inputClass} font-mono`} />
      </div>
      <div className="md:col-span-5 space-y-1">
        <label className={labelClass}>Tipo di effetto</label>
        <select value={formData.damageType || ''} onChange={e => onChange('damageType', e.target.value)} className={inputClass}>
          <option value="">-- Tipo --</option>
          {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
    </div>
  </div>
);

/** Contatore di cariche limitate (usi massimi/attuali e ricarica). */
export const UsesTrackingFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
    <h4 className="text-[10px] font-black text-accent/70 uppercase tracking-widest mb-2 flex items-center gap-2">
      <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
      Cariche
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-4 space-y-1">
        <label className={labelClass}>Cariche massime</label>
        <input type="number" value={formData.uses?.max || ''} onChange={e => {
          const max = parseInt(e.target.value) || 0;
          onChange('uses', { max, current: formData.uses?.current ?? max });
        }} className={`${inputClass} text-center font-mono`} />
      </div>
      <div className="md:col-span-4 space-y-1">
        <label className={labelClass}>Attuali</label>
        <input type="number" value={formData.uses?.current ?? ''} onChange={e => onChange('uses', { max: formData.uses?.max ?? 0, current: parseInt(e.target.value) || 0 })} className={`${inputClass} text-center font-mono`} />
      </div>
      <div className="md:col-span-4 space-y-1">
        <label className={labelClass}>Si ricarica con</label>
        <select value={formData.recovery || 'none'} onChange={e => onChange('recovery', e.target.value as FormFieldsProps['formData']['recovery'])} className={inputClass}>
          <option value="none">Non si ricarica</option>
          <option value="short">Riposo breve</option>
          <option value="long">Riposo lungo</option>
        </select>
      </div>
    </div>
  </div>
);
