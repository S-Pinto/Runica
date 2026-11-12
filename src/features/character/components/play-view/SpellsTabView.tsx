import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { ResourceTracker } from './ResourceTracker';
import { PlayViewSpellList } from '../PlayViewSpellList';
import { SparklesIcon } from '../../../../components/ui/icons';
import { abilityLabel } from '../../../../lib/labels';

const SpellsTabView = () => {
    const { character, updateCharacter } = useCharacter();
    if (!character) return null;

    const ability = character.spellcastingAbility;
    const mod = ability ? getModifier(character.abilityScores[ability]) : 0;
    const saveDC = ability ? 8 + character.proficiencyBonus + mod : '–';
    const attackBonus = ability ? formatModifier(character.proficiencyBonus + mod) : '–';

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <aside className="space-y-6 lg:sticky lg:top-40">
                <section aria-labelledby="spellcasting-title" className="rounded-2xl border border-border/60 bg-card p-5">
                    <h3 id="spellcasting-title" className="mb-4 flex items-center gap-2 font-cinzel text-lg font-bold text-foreground">
                        <SparklesIcon className="h-5 w-5 text-accent" /> Capacità magiche
                    </h3>
                    {ability ? (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-center">
                                    <p className="font-mono text-3xl font-bold text-accent">{saveDC}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">CD tiro salvezza</p>
                                </div>
                                <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-center">
                                    <p className="font-mono text-3xl font-bold text-accent">{attackBonus}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Bonus d'attacco</p>
                                </div>
                            </div>
                            <p className="mt-3 text-center text-sm text-muted-foreground">
                                Caratteristica: <span className="font-semibold text-foreground">{abilityLabel(ability)}</span>{' '}
                                <span className="font-mono text-accent">({formatModifier(mod)})</span>
                            </p>
                        </>
                    ) : (
                        <p className="rounded-xl bg-background/40 py-4 text-center text-sm italic text-muted-foreground">
                            Nessuna caratteristica da incantatore. Impostala in Modifica.
                        </p>
                    )}
                </section>

                <ResourceTracker
                    title="Slot incantesimo"
                    slots={character.spellSlots}
                    onSlotChange={(newSlots) => updateCharacter({ spellSlots: newSlots })}
                />
                {character.customResources && character.customResources.length > 0 && (
                    <ResourceTracker
                        title="Altre risorse"
                        slots={character.customResources}
                        onSlotChange={(newResources) => updateCharacter({ customResources: newResources })}
                        isCustom
                    />
                )}
            </aside>

            <div className="lg:col-span-2">
                <PlayViewSpellList />
            </div>
        </div>
    );
};

export default SpellsTabView;
