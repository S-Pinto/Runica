import { AbilityScores, ChargeResetType, ItemPower } from '../../characterTypes';
import { Button } from '../../../../components/ui/Button';
import { TrashIcon } from '../../../../components/ui/icons';
import { fieldCheckRowClass, fieldNumericClass } from '../../../../components/ui/field';
import { ABILITY_LABELS, ABILITY_SHORT } from '../../../../lib/labels';
import { ABILITY_KEYS } from '../../rules/attacks';
import { CHARGE_RESET_LABELS, POWER_ACTIVATION_LABELS } from '../../utils/itemLabels';
import { AdditionalDamageEditor } from '../attacks/AdditionalDamageEditor';
import { DamageTypeSelect } from './DamageTypeSelect';
import { inputClass, labelClass } from './formShared';

type AbilityKey = keyof AbilityScores;

interface ItemPowerEditorProps {
  power: ItemPower;
  index: number;
  /** L'oggetto ha cariche: il potere può spenderle invece di avere usi propri. */
  hasItemCharges: boolean;
  onChange: (patch: Partial<ItemPower>) => void;
  onRemove: () => void;
}

const intOrUndefined = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Un potere attivabile: nome, attivazione, tiro (attacco, tiro salvezza o nessuno), danni, usi o cariche. */
export const ItemPowerEditor = ({ power, index, hasItemCharges, onChange, onRemove }: ItemPowerEditorProps) => {
  const idp = `power-${index}`;
  const usageMode = power.uses ? 'uses' : power.chargeCost ? 'charges' : 'free';

  return (
    <div className="space-y-3 rounded-xl bg-input/40 p-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${idp}-name`} className={labelClass}>Nome del potere</label>
          <input id={`${idp}-name`} type="text" placeholder="Es. Giavellotto magnetico" value={power.name} onChange={e => onChange({ name: e.target.value })} className={inputClass} />
        </div>
        <Button variant="ghost" size="icon-lg" aria-label={`Rimuovi il potere ${power.name || index + 1}`} onClick={onRemove} className="shrink-0 hover:text-destructive">
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor={`${idp}-activation`} className={labelClass}>Attivazione</label>
          <select id={`${idp}-activation`} value={power.activation || ''} onChange={e => onChange({ activation: (e.target.value || undefined) as ItemPower['activation'] })} className={inputClass}>
            <option value="">—</option>
            {Object.entries(POWER_ACTIVATION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${idp}-roll`} className={labelClass}>Tiro</label>
          <select id={`${idp}-roll`} value={power.roll} onChange={e => {
            const roll = e.target.value as ItemPower['roll'];
            onChange({ roll, ...(roll === 'save' && !power.saveAbility ? { saveAbility: 'dexterity' as const } : {}) });
          }} className={inputClass}>
            <option value="attack">Per colpire</option>
            <option value="save">Tiro salvezza</option>
            <option value="none">Nessuno</option>
          </select>
        </div>
        {power.roll !== 'none' && (
          <div>
            <label htmlFor={`${idp}-ability`} className={labelClass}>Caratteristica</label>
            <select id={`${idp}-ability`} value={power.attackAbility || 'spell'} onChange={e => onChange({ attackAbility: e.target.value as ItemPower['attackAbility'] })} className={inputClass}>
              <option value="spell">Da incantatore</option>
              {ABILITY_KEYS.map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
              <option value="none">Nessuna</option>
            </select>
          </div>
        )}
        {power.roll === 'attack' && (
          <div>
            <label htmlFor={`${idp}-bonus`} className={labelClass}>Bonus fisso</label>
            <input id={`${idp}-bonus`} type="text" placeholder="+0" value={power.attackBonus ? String(power.attackBonus) : ''} onChange={e => onChange({ attackBonus: parseInt(e.target.value, 10) || undefined })} className={fieldNumericClass} />
          </div>
        )}
        {power.roll === 'save' && (
          <>
            <div>
              <label htmlFor={`${idp}-save`} className={labelClass}>Salvezza su</label>
              <select id={`${idp}-save`} value={power.saveAbility || 'dexterity'} onChange={e => onChange({ saveAbility: e.target.value as AbilityKey })} className={inputClass}>
                {ABILITY_KEYS.map(a => <option key={a} value={a}>{ABILITY_SHORT[a]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${idp}-dc`} className={labelClass}>CD fissa</label>
              <input id={`${idp}-dc`} type="number" inputMode="numeric" placeholder="auto" value={power.saveDC || ''} onChange={e => onChange({ saveDC: intOrUndefined(e.target.value) })} className={fieldNumericClass} />
            </div>
          </>
        )}
      </div>
      {power.roll !== 'none' && (
        <label className={fieldCheckRowClass}>
          <input type="checkbox" className="check-rune" checked={power.isProficient ?? true} onChange={e => onChange({ isProficient: e.target.checked })} />
          Aggiunge il bonus di competenza
        </label>
      )}

      <div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor={`${idp}-damage`} className={labelClass}>Danno</label>
            <input id={`${idp}-damage`} type="text" placeholder="1d8" value={power.damage || ''} onChange={e => onChange({ damage: e.target.value })} className={fieldNumericClass} />
          </div>
          <div>
            <label htmlFor={`${idp}-damage-ability`} className={labelClass}>Modificatore ai danni</label>
            <select id={`${idp}-damage-ability`} value={power.damageAbility || ''} onChange={e => onChange({ damageAbility: (e.target.value || undefined) as ItemPower['damageAbility'] })} className={inputClass}>
              <option value="">Come per colpire</option>
              {ABILITY_KEYS.map(a => <option key={a} value={a}>+ {ABILITY_SHORT[a]}</option>)}
              <option value="none">Nessuno</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${idp}-damage-type`} className={labelClass}>Tipo di danno</label>
            <DamageTypeSelect id={`${idp}-damage-type`} value={power.damageType} onChange={damageType => onChange({ damageType })} />
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">"Come per colpire": nessun modificatore con la caratteristica da incantatore.</p>
        <AdditionalDamageEditor extras={power.additionalDamage} onChange={additionalDamage => onChange({ additionalDamage })} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${idp}-usage`} className={labelClass}>Utilizzi</label>
          <select
            id={`${idp}-usage`}
            value={usageMode}
            onChange={e => {
              const mode = e.target.value;
              if (mode === 'uses') onChange({ uses: { current: 1, max: 1, recovery: 'longRest' }, chargeCost: undefined });
              else if (mode === 'charges') onChange({ uses: undefined, chargeCost: 1 });
              else onChange({ uses: undefined, chargeCost: undefined });
            }}
            className={inputClass}
          >
            <option value="free">Illimitati</option>
            <option value="uses">Usi propri</option>
            {(hasItemCharges || usageMode === 'charges') && <option value="charges">Cariche dell'oggetto</option>}
          </select>
        </div>
        {power.uses && (
          <>
            <div>
              <label htmlFor={`${idp}-uses`} className={labelClass}>Usi</label>
              <input id={`${idp}-uses`} type="number" inputMode="numeric" min="1" value={power.uses.max || ''} onChange={e => {
                const max = intOrUndefined(e.target.value) ?? 0;
                onChange({ uses: { ...power.uses!, max, current: Math.min(power.uses!.current, max) || max } });
              }} className={fieldNumericClass} />
            </div>
            <div>
              <label htmlFor={`${idp}-recovery`} className={labelClass}>Si ricaricano</label>
              <select id={`${idp}-recovery`} value={power.uses.recovery} onChange={e => onChange({ uses: { ...power.uses!, recovery: e.target.value as ChargeResetType } })} className={inputClass}>
                {(Object.keys(CHARGE_RESET_LABELS) as ChargeResetType[]).map(k => <option key={k} value={k}>{CHARGE_RESET_LABELS[k]}</option>)}
              </select>
            </div>
          </>
        )}
        {usageMode === 'charges' && (
          <div>
            <label htmlFor={`${idp}-cost`} className={labelClass}>Cariche per uso</label>
            <input id={`${idp}-cost`} type="number" inputMode="numeric" min="1" value={power.chargeCost || ''} onChange={e => onChange({ chargeCost: intOrUndefined(e.target.value) ?? 1 })} className={fieldNumericClass} />
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${idp}-description`} className={labelClass}>Effetto</label>
        <textarea id={`${idp}-description`} rows={2} value={power.description || ''} onChange={e => onChange({ description: e.target.value })} className={`${inputClass} resize-y leading-relaxed`} />
      </div>
    </div>
  );
};
