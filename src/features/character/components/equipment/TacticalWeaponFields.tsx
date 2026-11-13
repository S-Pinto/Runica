import { WEAPON_MASTERIES } from '../../../../data/weaponProperties';
import { fieldCheckRowClass, fieldGroupClass, fieldGroupTitleClass, fieldNumericClass } from '../../../../components/ui/field';
import { ABILITY_LABELS, ABILITY_SHORT } from '../../../../lib/labels';
import { AbilityScores } from '../../characterTypes';
import { AdditionalDamageEditor } from '../attacks/AdditionalDamageEditor';
import { WeaponPropertiesPicker } from '../attacks/WeaponPropertiesPicker';
import { DAMAGE_TYPES, FormFieldsProps, inputClass, labelClass } from './formShared';

const ABILITY_KEYS: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

/** Dettagli tattici di un'arma (specchio di AttackForm): caratteristica, maestria, danni, proprietà. */
export const TacticalWeaponFields = ({ formData, onChange }: FormFieldsProps) => (
  <div className={`${fieldGroupClass} space-y-4`}>
    <h5 className={fieldGroupTitleClass}>Statistiche dell'arma</h5>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
      <div className="sm:col-span-4">
        <label htmlFor="weapon-attack-ability" className={labelClass}>Caratteristica per colpire</label>
        <select id="weapon-attack-ability" value={formData.attackAbility || ''} onChange={e => onChange('attackAbility', e.target.value)} className={inputClass}>
          <option value="">Nessuna (valore fisso)</option>
          {ABILITY_KEYS.map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
        </select>
      </div>
      <div className="sm:col-span-4">
        <label htmlFor="weapon-mastery" className={labelClass}>Maestria</label>
        <select id="weapon-mastery" value={formData.mastery || ''} onChange={e => onChange('mastery', e.target.value)} className={inputClass}>
          <option value="">Nessuna</option>
          {Object.entries(WEAPON_MASTERIES).map(([key, m]) => <option key={key} value={key}>{m.name}</option>)}
        </select>
      </div>
      <label className={`${fieldCheckRowClass} sm:col-span-4 sm:mt-[1.375rem] sm:min-h-[46px]`}>
        <input type="checkbox" className="check-rune" checked={formData.isProficient || false} onChange={e => onChange('isProficient', e.target.checked)} />
        Bonus di competenza
      </label>
    </div>

    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="sm:col-span-4">
          <label htmlFor="weapon-damage" className={labelClass}>Danno base</label>
          <input id="weapon-damage" type="text" placeholder="1d8" value={formData.damage || ''} onChange={e => onChange('damage', e.target.value)} className={fieldNumericClass} />
        </div>
        <div className="sm:col-span-4">
          <label htmlFor="weapon-damage-ability" className={labelClass}>Modificatore ai danni</label>
          <select id="weapon-damage-ability" value={formData.damageAbility || ''} onChange={e => onChange('damageAbility', e.target.value)} className={inputClass}>
            <option value="">Nessuno</option>
            {ABILITY_KEYS.map(a => <option key={a} value={a}>+ {ABILITY_SHORT[a]}</option>)}
          </select>
        </div>
        <div className="sm:col-span-4">
          <label htmlFor="weapon-damage-type" className={labelClass}>Tipo di danno</label>
          <select id="weapon-damage-type" value={formData.damageType || ''} onChange={e => onChange('damageType', e.target.value)} className={inputClass}>
            <option value="">Tipo di danno</option>
            {DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>
      <AdditionalDamageEditor extras={formData.additionalDamage} onChange={value => onChange('additionalDamage', value)} />
    </div>

    <WeaponPropertiesPicker
      selected={formData.properties}
      onToggle={(prop) => {
        const current = formData.properties || [];
        onChange('properties', current.includes(prop) ? current.filter(p => p !== prop) : [...current, prop]);
      }}
    />
  </div>
);
