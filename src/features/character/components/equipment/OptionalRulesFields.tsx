import { ICharacter, OptionalRules } from '../../characterTypes';
import { fieldCheckRowClass, fieldGroupClass, fieldGroupTitleClass } from '../../../../components/ui/field';
import { formatWeight, getEncumbrance, resolveOptionalRules } from '../../rules/encumbrance';
import { inputClass, labelClass } from './formShared';

/**
 * Regole opzionali dell'inventario, spente di default: peso e carico, consumo delle munizioni.
 * Spente, i campi relativi spariscono dai form e dalla vista di gioco (i dati già inseriti restano salvati).
 */
export const OptionalRulesFields = ({ character, onChange }: { character: ICharacter; onChange: (rules: OptionalRules) => void }) => {
  const rules = resolveOptionalRules(character);
  const encumbrance = getEncumbrance(character);
  const set = (patch: Partial<OptionalRules>) => onChange({ ...rules, ...patch });

  return (
    <div className={fieldGroupClass}>
      <h5 className={`${fieldGroupTitleClass} mb-2`}>Regole opzionali</h5>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={fieldCheckRowClass}>
            <input type="checkbox" className="check-rune" checked={rules.encumbrance} onChange={e => set({ encumbrance: e.target.checked })} />
            Peso e capacità di carico
          </label>
          {rules.encumbrance && (
            <div className="flex flex-wrap items-end gap-3 pl-7">
              <div>
                <label htmlFor="weight-unit" className={labelClass}>Unità</label>
                <select id="weight-unit" value={rules.weightUnit} onChange={e => set({ weightUnit: e.target.value as OptionalRules['weightUnit'] })} className={inputClass}>
                  <option value="kg">Chilogrammi (FOR × 7,5)</option>
                  <option value="lb">Libbre (FOR × 15)</option>
                </select>
              </div>
              <p className="pb-2.5 text-sm text-muted-foreground">
                <span className={`font-mono tabular-nums ${encumbrance.over ? 'text-destructive' : 'text-foreground'}`}>{formatWeight(encumbrance.carried, encumbrance.unit)}</span>
                {' '}su {formatWeight(encumbrance.capacity, encumbrance.unit)}
              </p>
            </div>
          )}
        </div>
        <label className={`${fieldCheckRowClass} self-start`}>
          <input type="checkbox" className="check-rune" checked={rules.ammunition} onChange={e => set({ ammunition: e.target.checked })} />
          Consumo automatico delle munizioni
        </label>
      </div>
    </div>
  );
};
