import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../../../data/weaponProperties';
import { Button } from '../../../../../components/ui/Button';
import { ChevronRightIcon } from '../../../../../components/ui/icons';
import type { ResolvedAction } from '../../../rules/attacks';
import { playLabelClass } from '../PlaySection';

/** Dettaglio espanso di un attacco: effetto del potere, proprietà dell'arma, maestria, munizioni e collegamento alla Scheda Oggetto. */
export const AttackDetails = ({ action, onOpenItem }: { action: ResolvedAction; onOpenItem?: (itemId: string) => void }) => {
    const mastery = action.mastery ? WEAPON_MASTERIES[action.mastery] : undefined;
    const properties = action.properties;
    const note = action.source === 'item' ? action.notes : undefined;
    const fromItem = (action.source === 'item' || action.source === 'weapon') && !!onOpenItem;
    const empty = !mastery && properties.length === 0 && !action.ammo && !note && !action.description;

    return (
        <div className="space-y-3 border-t border-foreground/10 pt-3 animate-fadeIn">
            {empty && !fromItem && <p className="text-sm text-muted-foreground">Nessun dettaglio per questo attacco.</p>}
            {!empty && (
                <dl className="space-y-3">
                    {note && (
                        <div>
                            <dt className="text-sm font-semibold text-foreground">Oggetto</dt>
                            <dd className="mt-0.5 text-sm text-muted-foreground">{note}</dd>
                        </div>
                    )}
                    {action.description && (
                        <div>
                            <dt className="text-sm font-semibold text-foreground">Effetto</dt>
                            <dd className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-text">{action.description}</dd>
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
            )}
            {fromItem && (
                <Button variant="ghost" size="sm" className="-ml-2 h-10 text-accent" onClick={(e) => { e.stopPropagation(); onOpenItem!(action.sourceId); }}>
                    Scheda oggetto <ChevronRightIcon className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};
