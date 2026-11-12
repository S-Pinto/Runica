import { WEAPON_PROPERTIES } from '../../../../data/weaponProperties';
import { labelClass } from './attackFormShared';

/** Selezione multipla delle proprietà dell'arma. */
export const WeaponPropertiesPicker = ({ selected, onToggle }: { selected: string[] | undefined; onToggle: (prop: string) => void }) => {
  const formData = { properties: selected };
  const toggleProperty = onToggle;
  return (
      <div className="md:col-span-12 animate-in fade-in">
        <label className={labelClass}>Proprietà dell'arma</label>
        <div className="flex flex-wrap gap-2 p-3 bg-background/30 rounded-xl border border-border/30 min-h-[3rem]">
          {Object.keys(WEAPON_PROPERTIES).map(prop => {
            const isActive = formData.properties?.includes(prop);
            return (
              <button
                key={prop}
                type="button"
                onClick={() => toggleProperty(prop)}
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
  );
};
