import { Attack } from '../../../characterTypes';
import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../../../data/weaponProperties';
import { playLabelClass } from '../PlaySection';

/** Dettaglio espanso di un attacco: proprietà dell'arma e descrizione della maestria. */
export const AttackDetails = ({ attack }: { attack: Attack }) => {
    const mastery = attack.mastery ? WEAPON_MASTERIES[attack.mastery as keyof typeof WEAPON_MASTERIES] : undefined;
    const properties = attack.properties || [];

    if (!mastery && properties.length === 0) {
        return <p className="border-t border-foreground/10 pt-3 text-sm text-muted-foreground animate-fadeIn">Nessun dettaglio per questo attacco.</p>;
    }

    return (
        <dl className="space-y-3 border-t border-foreground/10 pt-3 animate-fadeIn">
            {properties.map(propKey => {
                const propData = WEAPON_PROPERTIES[propKey as keyof typeof WEAPON_PROPERTIES];
                return (
                    <div key={propKey}>
                        <dt className="text-sm font-semibold text-foreground">{propData?.name || propKey}</dt>
                        {propData?.description && <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{propData.description}</dd>}
                    </div>
                );
            })}

            {mastery && (
                <div>
                    <dt className={`${playLabelClass} text-accent`}>Maestria · {mastery.name}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-text">{mastery.description}</dd>
                </div>
            )}
        </dl>
    );
};
