import { useMemo, useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import * as combat from '../../rules/combat';
import { StatBox } from '../ui/StatBox';
import { HPTracker } from './HPTracker';
import { DeathSavesTracker } from './DeathSavesTracker';
import { HitDiceTracker } from './HitDiceTracker';
import { PlaySection, playLabelClass } from './PlaySection';
import { Button } from '../../../../components/ui/Button';
import {
    ShieldIcon,
    BoltIcon,
    StarIcon,
    SearchIcon,
    ForwardIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon,
    ChevronDownIcon,
} from '../../../../components/ui/icons';
import { CONDITIONS } from '../../../../data/conditions';

/** Descrizione ed effetti di una condizione, mostrati quando la riga è aperta. */
const ConditionDetails = ({ description, bullets }: { description: string; bullets: string[] }) => (
    <div className="space-y-2 text-sm leading-relaxed text-text">
        <p>{description}</p>
        {bullets.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
            </ul>
        )}
    </div>
);

const MainTabView = () => {
    const { character, updateCharacter } = useCharacter();
    const [isEditingConditions, setIsEditingConditions] = useState(false);
    const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

    const passivePerception = useMemo(() => {
        if (!character) return 10;
        const wisdomMod = getModifier(character.abilityScores.wisdom);
        const perceptionSkill = character.skills.find(s => s.name === 'Perception');
        let bonus = 0;
        if (perceptionSkill) {
            if (perceptionSkill.expertise) bonus = character.proficiencyBonus * 2;
            else if (perceptionSkill.proficient) bonus = character.proficiencyBonus;
        }
        return 10 + wisdomMod + bonus;
    }, [character]);

    const armorClass = useMemo(() => (character ? combat.calculateArmorClass(character) : 10), [character]);

    const hasShield = useMemo(() => {
        return character?.equipment?.some(item => item.equipped && item.armorType === 'shield');
    }, [character]);

    if (!character) return null;

    const speedMeters = Math.round(character.speed * 0.3);
    const activeConditions = character.conditions || [];

    const toggleCondition = (key: string) => {
        const next = activeConditions.includes(key)
            ? activeConditions.filter(c => c !== key)
            : [...activeConditions, key];
        updateCharacter({ conditions: next });
    };

    const languages = (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{character.languages || 'Nessuna'}</p>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
                <StatBox
                    label="Classe Armatura"
                    value={armorClass}
                    subValue={hasShield ? 'con scudo' : undefined}
                    icon={ShieldIcon}
                />
                <StatBox label="Iniziativa" value={formatModifier(getModifier(character.abilityScores.dexterity))} icon={BoltIcon} />
                <StatBox
                    label="Velocità"
                    value={character.speed}
                    subValue={`ft · ${speedMeters} m`}
                    icon={ForwardIcon}
                />
                <StatBox label="Competenza" value={formatModifier(character.proficiencyBonus)} icon={StarIcon} />
                <StatBox label="Percezione passiva" value={passivePerception} icon={SearchIcon} className="col-span-2 md:col-span-1" />
            </div>

            <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-12">
                {/* Colonna sinistra: punti vita e condizioni, ciò che cambia a ogni turno. */}
                <div className="space-y-4 sm:space-y-6 lg:col-span-5">
                    <HPTracker />

                    <PlaySection
                        title="Condizioni"
                        icon={<ExclamationTriangleIcon className={activeConditions.length > 0 ? 'text-warning' : 'text-muted-foreground'} />}
                        aside={
                            <Button
                                variant={isEditingConditions ? 'primary' : 'secondary'}
                                size="sm"
                                className="h-10 rounded-xl px-3 text-sm"
                                onClick={() => { setIsEditingConditions(!isEditingConditions); setExpandedCondition(null); }}
                                aria-pressed={isEditingConditions}
                            >
                                {isEditingConditions ? <><CheckIcon className="h-4 w-4" /> Fatto</> : <><PlusIcon className="h-4 w-4" /> Gestisci</>}
                            </Button>
                        }
                    >
                        {!isEditingConditions && activeConditions.length === 0 && (
                            <p className="text-sm text-muted-foreground">Nessuna condizione attiva.</p>
                        )}

                        {!isEditingConditions && activeConditions.length > 0 && (
                            <ul className="space-y-2">
                                {activeConditions.map((condName) => {
                                    const condition = CONDITIONS[condName] || { name: condName, description: 'Nessuna descrizione disponibile.', bullets: [] };
                                    const isExpanded = expandedCondition === condName;
                                    return (
                                        <li key={condName} className="overflow-hidden rounded-xl border border-destructive/40 bg-destructive/10">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedCondition(isExpanded ? null : condName)}
                                                aria-expanded={isExpanded}
                                                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    <span aria-hidden className="h-2 w-2 rounded-full bg-destructive" />
                                                    {condition.name}
                                                </span>
                                                <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isExpanded && (
                                                <div className="space-y-3 border-t border-destructive/30 px-3 py-3 animate-fadeIn">
                                                    <ConditionDetails description={condition.description} bullets={condition.bullets} />
                                                    <Button variant="destructive-outline" className="w-full" onClick={() => toggleCondition(condName)}>
                                                        <XMarkIcon className="h-4 w-4" /> Rimuovi condizione
                                                    </Button>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {isEditingConditions && (
                            <ul className="-mr-2 max-h-[60vh] space-y-1 overflow-y-auto pr-2">
                                {Object.entries(CONDITIONS).map(([condKey, condition]) => {
                                    const isActive = activeConditions.includes(condKey);
                                    const isExpanded = expandedCondition === condKey;
                                    return (
                                        <li key={condKey} className={`rounded-xl border transition-colors duration-150 ${isActive ? 'border-destructive/40 bg-destructive/10' : 'border-transparent'}`}>
                                            <div className="flex items-center gap-1 pr-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedCondition(isExpanded ? null : condKey)}
                                                    aria-expanded={isExpanded}
                                                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                                >
                                                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    <span className={`truncate ${isActive ? 'text-destructive' : 'text-text'}`}>{condition.name}</span>
                                                </button>
                                                <Button
                                                    variant={isActive ? 'destructive' : 'secondary'}
                                                    size="icon"
                                                    onClick={() => toggleCondition(condKey)}
                                                    aria-pressed={isActive}
                                                    aria-label={isActive ? `Rimuovi ${condition.name}` : `Aggiungi ${condition.name}`}
                                                >
                                                    {isActive ? <XMarkIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                            {isExpanded && (
                                                <div className="px-3 pb-3 pl-9 animate-fadeIn">
                                                    <ConditionDetails description={condition.description} bullets={condition.bullets} />
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </PlaySection>

                    {/* Su desktop le lingue riempiono la colonna dei punti vita. */}
                    <PlaySection title="Lingue" className="hidden lg:block">{languages}</PlaySection>
                </div>

                {/* Colonna destra: risorse di sopravvivenza. */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:col-span-7">
                    <DeathSavesTracker />
                    <HitDiceTracker />

                    <PlaySection title="Difese" icon={<ShieldCheckIcon className="text-muted-foreground" />} className="sm:col-span-2">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className={playLabelClass}>Resistenze <span className="font-normal normal-case tracking-normal">· danni dimezzati</span></dt>
                                <dd className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                    {character.defenses?.resistances || <span className="text-muted-foreground">Nessuna</span>}
                                </dd>
                            </div>
                            <div>
                                <dt className={playLabelClass}>Immunità <span className="font-normal normal-case tracking-normal">· nessun danno</span></dt>
                                <dd className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                    {character.defenses?.immunities || <span className="text-muted-foreground">Nessuna</span>}
                                </dd>
                            </div>
                        </dl>
                    </PlaySection>

                    <PlaySection title="Lingue" className="sm:col-span-2 lg:hidden">{languages}</PlaySection>
                </div>
            </div>
        </div>
    );
};

export default MainTabView;
