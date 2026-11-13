import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../../../data/weaponProperties';
import type { ResolvedAction } from '../../../rules/attacks';
import { playLabelClass } from '../PlaySection';

/** Dettaglio espanso di un attacco: proprietà dell'arma, descrizione della maestria, munizioni e note. */
export const AttackDetails = ({ action }: { action: ResolvedAction }) => {
    const mastery = action.mastery ? WEAPON_MASTERIES[action.mastery] : undefined;
    const properties = action.properties;
    const note = action.source === 'item' ? action.notes : undefined;

    if (!mastery && properties.length === 0 && !action.ammo && !note) {
        return <p className="border-t border-foreground/10 pt-3 text-sm text-muted-foreground animate-fadeIn">Nessun dettaglio per questo attacco.</p>;
    }

    return (
        <dl className="space-y-3 border-t border-foreground/10 pt-3 animate-fadeIn">
            {note && (
                <div>
                    <dt className="text-sm font-semibold text-foreground">Oggetto</dt>
                    <dd className="mt-0.5 text-sm text-muted-foreground">{note}</dd>
                </div>
            )}
            {action.ammo && (
                <div>
                    <dt className="text-sm font-semibold text-foreground">Munizioni</dt>
                    <dd className="mt-0.5 text-sm text-muted-foreground">
                        {action.ammo.name}: <span className="font-mono text-foreground">{action.ammo.quantity}</span> rimaste. Ogni tiro per colpire ne consuma una.
                    </dd>
                </div>
            )}
            {properties.map(propKey => {
                const propData = WEAPON_PROPERTIES[propKey];
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
