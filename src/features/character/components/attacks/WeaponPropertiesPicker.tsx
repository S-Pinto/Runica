import { WEAPON_PROPERTIES } from '../../../../data/weaponProperties';
import { fieldChipClass, fieldLabelClass } from '../../../../components/ui/field';

/** Selezione multipla delle proprietà dell'arma: usata dal form attacco e dal form oggetto. */
export const WeaponPropertiesPicker = ({ selected, onToggle }: { selected: string[] | undefined; onToggle: (prop: string) => void }) => (
  <div>
    <p className={fieldLabelClass}>Proprietà dell'arma</p>
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Proprietà dell'arma">
      {Object.keys(WEAPON_PROPERTIES).map(prop => {
        const active = selected?.includes(prop);
        return (
          <button
            key={prop}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(prop)}
            className={fieldChipClass(active)}
            title={WEAPON_PROPERTIES[prop].description}
          >
            {WEAPON_PROPERTIES[prop].name}
          </button>
        );
      })}
    </div>
  </div>
);
