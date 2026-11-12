import { Attack } from '../../../characterTypes';
import { SwordIcon } from '../../../../../components/ui/icons';
import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../../../data/weaponProperties';

/** Dettaglio espanso di un attacco: proprietà dell'arma e descrizione della maestria. */
export const AttackDetails = ({ attack }: { attack: Attack }) => {
    const hasMastery = attack.mastery && WEAPON_MASTERIES[attack.mastery as keyof typeof WEAPON_MASTERIES];

    return (
        <div className="pb-2 space-y-3">
            <div className="h-px bg-border/20 w-full my-2" />

            {/* Weapon Properties Detailed View */}
            {(attack.properties && attack.properties.length > 0) && (
                <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Proprietà</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {attack.properties.map(propKey => {
                            const propData = WEAPON_PROPERTIES[propKey as keyof typeof WEAPON_PROPERTIES];
                            return (
                                <div key={propKey} className="bg-muted/30 border border-border/30 rounded px-2.5 py-1.5 flex flex-col gap-0.5">
                                    <span className="font-bold text-xs text-foreground">{propData?.name || propKey}</span>
                                    {propData?.description && <span className="text-[10px] text-muted-foreground leading-tight">{propData.description}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mastery Description */}
            {hasMastery && (
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                            <SwordIcon className="w-3 h-3" />
                            Maestria: {hasMastery.name}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{hasMastery.description}</p>
                </div>
            )}
        </div>
    );
};
