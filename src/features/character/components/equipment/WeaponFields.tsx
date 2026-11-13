import { WEAPON_MASTERIES } from '../../../../data/weaponProperties';
import { fieldCheckRowClass, fieldNumericClass } from '../../../../components/ui/field';
import { ABILITY_LABELS, ABILITY_SHORT, damageTypeLabel } from '../../../../lib/labels';
import { ABILITY_KEYS, NO_ABILITY, normalizeAbility } from '../../rules/attacks';
import { hasProperty } from '../../rules/equipment';
import { EquipmentItem } from '../../characterTypes';
import { AdditionalDamageEditor } from '../attacks/AdditionalDamageEditor';
import { WeaponPropertiesPicker } from '../attacks/WeaponPropertiesPicker';
import { DAMAGE_TYPES, FormFieldsProps, inputClass, labelClass } from './formShared';

interface WeaponFieldsProps extends FormFieldsProps {
  /** Oggetti selezionabili come munizione (solo con la regola opzionale attiva). */
  ammoCandidates?: EquipmentItem[];
}

/** Valore del select: chiave completa, `none` o vuoto (= automatica). Le abbreviazioni salvate in passato si convertono. */
const abilitySelectValue = (v: string | undefined) => (v === NO_ABILITY ? NO_ABILITY : normalizeAbility(v) ?? '');

/**
 * Statistiche dell'arma in un'unica sezione: caratteristica (automatica: Accurata → la migliore fra FOR e DES,
 * a distanza → DES), competenza, bonus magico, danni (anche a due mani), proprietà, maestria e munizioni.
 */
export const WeaponFields = ({ formData, onChange, ammoCandidates }: WeaponFieldsProps) => {
  const isVersatile = hasProperty(formData.properties, 'Versatile');
  const usesAmmo = hasProperty(formData.properties, 'Ammunition');
  const legacyType = formData.damageType && !DAMAGE_TYPES.includes(formData.damageType) ? formData.damageType : null;

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="sm:col-span-4">
          <label htmlFor="weapon-attack-ability" className={labelClass}>Caratteristica</label>
          <select id="weapon-attack-ability" value={abilitySelectValue(formData.attackAbility)} onChange={e => onChange('attackAbility', e.target.value || undefined)} className={inputClass}>
            <option value="">Automatica</option>
            {ABILITY_KEYS.map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
            <option value={NO_ABILITY}>Nessuna</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="attackBonus" className={labelClass}>Bonus magico</label>
          <input id="attackBonus" type="text" inputMode="numeric" placeholder="+1" value={formData.attackBonus || ''} onChange={e => onChange('attackBonus', e.target.value)} className={fieldNumericClass} />
        </div>
        <label className={`${fieldCheckRowClass} sm:col-span-5 sm:mt-[1.375rem] sm:min-h-[46px]`}>
          <input type="checkbox" className="check-rune" checked={formData.isProficient ?? true} onChange={e => onChange('isProficient', e.target.checked)} />
          Competente (aggiunge il bonus di competenza)
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Automatica: Forza in mischia, Destrezza a distanza, la migliore delle due con Accurata.</p>

      <div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className={isVersatile ? 'sm:col-span-3' : 'sm:col-span-4'}>
            <label htmlFor="weapon-damage" className={labelClass}>Danno</label>
            <input id="weapon-damage" type="text" placeholder="1d8" value={formData.damage || ''} onChange={e => onChange('damage', e.target.value)} className={fieldNumericClass} />
          </div>
          {isVersatile && (
            <div className="sm:col-span-3">
              <label htmlFor="weapon-versatile" className={labelClass}>A due mani</label>
              <input id="weapon-versatile" type="text" placeholder="1d10" value={formData.versatileDamage || ''} onChange={e => onChange('versatileDamage', e.target.value)} className={fieldNumericClass} />
            </div>
          )}
          <div className={isVersatile ? 'sm:col-span-3' : 'sm:col-span-4'}>
            <label htmlFor="weapon-damage-ability" className={labelClass}>Modificatore ai danni</label>
            <select id="weapon-damage-ability" value={abilitySelectValue(formData.damageAbility)} onChange={e => onChange('damageAbility', e.target.value || undefined)} className={inputClass}>
              <option value="">Come per colpire</option>
              {ABILITY_KEYS.map(a => <option key={a} value={a}>+ {ABILITY_SHORT[a]}</option>)}
              <option value={NO_ABILITY}>Nessuno</option>
            </select>
          </div>
          <div className={isVersatile ? 'sm:col-span-3' : 'sm:col-span-4'}>
            <label htmlFor="weapon-damage-type" className={labelClass}>Tipo di danno</label>
            <select id="weapon-damage-type" value={formData.damageType || ''} onChange={e => onChange('damageType', e.target.value)} className={inputClass}>
              <option value="">Tipo di danno</option>
              {legacyType && <option value={legacyType}>{legacyType}</option>}
              {DAMAGE_TYPES.map(type => <option key={type} value={type}>{damageTypeLabel(type)}</option>)}
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="sm:col-span-6">
          <label htmlFor="weapon-mastery" className={labelClass}>Maestria</label>
          <select id="weapon-mastery" value={formData.mastery || ''} onChange={e => onChange('mastery', e.target.value)} className={inputClass}>
            <option value="">Nessuna</option>
            {Object.entries(WEAPON_MASTERIES).map(([key, m]) => <option key={key} value={key}>{m.name}</option>)}
          </select>
        </div>
        {usesAmmo && ammoCandidates && (
          <div className="sm:col-span-6">
            <label htmlFor="weapon-ammo" className={labelClass}>Munizioni dall'inventario</label>
            <select id="weapon-ammo" value={formData.ammoItemId || ''} onChange={e => onChange('ammoItemId', e.target.value || undefined)} className={inputClass}>
              <option value="">Non tracciate</option>
              {ammoCandidates.map(i => <option key={i.id} value={i.id}>{i.name} (×{i.quantity})</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
