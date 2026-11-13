import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { ResourceTracker } from './ResourceTracker';
import { PlaySection } from './PlaySection';
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
        <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Su desktop la colonna resta visibile sotto l'header e la barra delle sezioni. */}
            <aside className="space-y-4 sm:space-y-6 lg:sticky lg:top-[calc(var(--header-offset)+4.5rem)]">
                <PlaySection title="Capacità magiche" icon={<SparklesIcon className="text-muted-foreground" />}>
                    {ability ? (
                        <>
                            <dl className="grid grid-cols-2 gap-3">
                                <div>
                                    <dd className="font-mono text-numeric tabular-nums text-foreground">{saveDC}</dd>
                                    <dt className="mt-1 text-xs font-medium text-muted-foreground">CD tiro salvezza</dt>
                                </div>
                                <div>
                                    <dd className="font-mono text-numeric tabular-nums text-foreground">{attackBonus}</dd>
                                    <dt className="mt-1 text-xs font-medium text-muted-foreground">Bonus d'attacco</dt>
                                </div>
                            </dl>
                            <p className="mt-4 border-t border-foreground/10 pt-3 text-sm text-muted-foreground">
                                Caratteristica: <span className="font-semibold text-foreground">{abilityLabel(ability)}</span>{' '}
                                <span className="font-mono text-foreground">({formatModifier(mod)})</span>
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Nessuna caratteristica da incantatore. Impostala in Modifica.
                        </p>
                    )}
                </PlaySection>

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
