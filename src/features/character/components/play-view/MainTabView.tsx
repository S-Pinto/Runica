import { useMemo, useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import * as combat from '../../rules/combat';
import { StatBox } from '../ui/StatBox';
import { HPTracker } from './HPTracker';
import { DeathSavesTracker } from './DeathSavesTracker';
import { HitDiceTracker } from './HitDiceTracker';
import {
    ShieldIcon,
    BoltIcon,
    StarIcon,
    // EyeIcon used for Perception if available, otherwise check list
    SearchIcon,
    ForwardIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '../../../../components/ui/icons';
import { CONDITIONS } from '../../../../data/conditions';

// Fallback icons if ChatBubble/ArrowTrending are not in the main export yet,
// but based on `icons.tsx` I saw `SearchIcon` and `ShieldIcon`.
// I will use `BoltIcon` (Initiative), `ShieldIcon` (AC), `ArrowRightIcon` (Speed?? No, looked for a better one),
// `StarIcon` (Proficiency), `SearchIcon` (Perception).

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

    // Calculate Armor Class (memoized)
    const armorClass = useMemo(() => (character ? combat.calculateArmorClass(character) : 10), [character]);

    const hasShield = useMemo(() => {
        return character?.equipment?.some(item => item.equipped && item.armorType === 'shield');
    }, [character]);

    if (!character) return null;

    const speedMeters = Math.round(character.speed * 0.3);

    return (
        <div className="space-y-6 md:space-y-8">
            {/* HUD Stats Row - Always on top, horizontally scrolling on tiny screens, grid on larger */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
                <StatBox
                    label="Classe Armatura"
                    value={armorClass}
                    subValue={hasShield ? "con scudo" : undefined}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Combat Vitals (HP) - Takes more width on large screens */}
                <div className="lg:col-span-5 space-y-6">
                    <HPTracker />

                    {/* Conditions - Priority High, below HP */}
                    <div className={`bg-card p-5 sm:p-6 rounded-2xl border border-border/60 transition-all duration-300 ${isEditingConditions ? 'ring-2 ring-accent/20' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-cinzel font-bold text-foreground flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                                Condizioni
                            </h3>
                            <button
                                onClick={() => setIsEditingConditions(!isEditingConditions)}
                                className={`p-1.5 rounded-lg transition-colors ${isEditingConditions ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/10 text-muted-foreground hover:text-accent'}`}
                                title={isEditingConditions ? "Fine" : "Gestisci condizioni"}
                                aria-label={isEditingConditions ? "Fine" : "Gestisci condizioni"}
                            >
                                {isEditingConditions ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className={`
                            bg-background/40 rounded-xl border border-border/20 relative overflow-hidden transition-all duration-500 ease-in-out
                            ${isEditingConditions ? 'min-h-[320px] max-h-[60vh] overflow-y-auto p-4' : 'min-h-[3.5rem] p-0'}
                        `}>
                            {/* Active View - Compact when empty/not editing */}
                            {!isEditingConditions && (
                                <div className={`p-4 transition-all duration-300 ${character.conditions?.length ? 'min-h-[6rem]' : 'flex items-center justify-center min-h-[3.5rem]'}`}>
                                    {character.conditions && character.conditions.length > 0 ? (
                                        <ul className="space-y-2 animate-in fade-in duration-300 w-full">
                                            {character.conditions.map((condName, idx) => {
                                                const condition = CONDITIONS[condName] || { name: condName, description: 'Nessuna descrizione disponibile.', bullets: [] };
                                                const isExpanded = expandedCondition === condName;

                                                return (
                                                    <li key={idx} className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 overflow-hidden transition-all duration-300">
                                                        <div
                                                            className="px-3 py-2 text-sm font-bold flex items-center justify-between cursor-pointer hover:bg-destructive/5"
                                                            onClick={() => setExpandedCondition(isExpanded ? null : condName)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                                                {condition.name}
                                                            </div>
                                                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                                        </div>

                                                        <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-3 px-3' : 'grid-rows-[0fr] opacity-0 pb-0 px-3'}`}>
                                                            <div className="overflow-hidden space-y-2">
                                                                <div className="h-px bg-destructive/20 mb-2" />
                                                                <p className="text-xs leading-relaxed opacity-90">{condition.description}</p>
                                                                {condition.bullets.length > 0 && (
                                                                    <ul className="list-disc pl-4 space-y-0.5 text-[10px] opacity-80">
                                                                        {condition.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                                                    </ul>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newConditions = character.conditions.filter(c => c !== condName);
                                                                        updateCharacter({ conditions: newConditions });
                                                                    }}
                                                                    className="w-full mt-2 bg-destructive/20 hover:bg-destructive text-destructive hover:text-destructive-foreground text-[10px] font-bold uppercase py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                                                                >
                                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                                    Rimuovi condizione
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 italic text-sm animate-in fade-in zoom-in-95 duration-300">
                                            <span>Nessuna condizione attiva</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Editing View - Expanded */}
                            {isEditingConditions && (
                                <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">

                                    <div className="grid grid-cols-1 gap-2">
                                        {Object.entries(CONDITIONS).map(([condKey, condition]) => {
                                            const isActive = character.conditions?.includes(condKey);
                                            const isExpanded = expandedCondition === condKey;

                                            return (
                                                <div key={condKey} className={`rounded-lg border transition-all duration-200 ${isActive ? 'bg-destructive/5 border-destructive/30' : 'bg-background/50 border-border/30 hover:border-accent/40'}`}>
                                                    <div className="flex items-center justify-between p-2.5 cursor-pointer" onClick={() => setExpandedCondition(isExpanded ? null : condKey)}>
                                                        <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-destructive' : 'text-foreground'}`}>{condition.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const current = character.conditions || [];
                                                                    const newConditions = isActive
                                                                        ? current.filter(c => c !== condKey)
                                                                        : [...current, condKey];
                                                                    updateCharacter({ conditions: newConditions });
                                                                }}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${isActive
                                                                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 active:scale-95 ring-2 ring-destructive/20'
                                                                    : 'bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95'
                                                                    }`}
                                                            >
                                                                {isActive ? <XMarkIcon className="w-5 h-5 font-bold stroke-[3]" /> : <PlusIcon className="w-5 h-5 font-bold stroke-[3]" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-3 px-3' : 'grid-rows-[0fr] opacity-0 pb-0 px-3'}`}>
                                                        <div className="overflow-hidden space-y-1.5 pt-1 border-t border-border/10">
                                                            <p className="text-[11px] leading-relaxed text-muted-foreground">{condition.description}</p>
                                                            {condition.bullets.length > 0 && (
                                                                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-muted-foreground/80">
                                                                    {condition.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Languages moved here on Desktop to utilize vertical space if HP is short,
                        or it can go below. Let's try putting it here for better balance. */}
                    <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/60 hidden lg:block">
                        <h3 className="text-lg font-cinzel font-bold text-foreground mb-3 flex items-center gap-2">
                            Lingue
                        </h3>
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">{character.languages || 'Nessuna'}</p>
                    </div>
                </div>

                {/* Right Column: Survival Resources */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <DeathSavesTracker />
                    <HitDiceTracker />

                    {/* Defenses */}
                    <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/60 flex flex-col h-full sm:col-span-2 xl:col-span-1">
                        <h3 className="text-lg font-cinzel font-bold text-foreground mb-4 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5" />
                            Difese
                        </h3>
                        <div className="space-y-4 flex-grow">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex justify-between">
                                    Resistenze
                                    <span className="text-[10px] normal-case bg-background/40 px-2 py-0.5 rounded text-muted-foreground">Danni dimezzati</span>
                                </h4>
                                <div className="bg-background/40 p-3 rounded-xl border border-border/20 min-h-[3rem]">
                                    <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{character.defenses?.resistances || <span className="text-muted-foreground/60 italic">Nessuna</span>}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex justify-between">
                                    Immunità
                                    <span className="text-[10px] normal-case bg-background/40 px-2 py-0.5 rounded text-muted-foreground">Nessun danno</span>
                                </h4>
                                <div className="bg-background/40 p-3 rounded-xl border border-border/20 min-h-[3rem]">
                                    <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{character.defenses?.immunities || <span className="text-muted-foreground/60 italic">Nessuna</span>}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Languages on Tablet/Mobile: Full width below trackers */}
                    <div className="col-span-1 sm:col-span-2 bg-card p-5 sm:p-6 rounded-2xl border border-border/60 lg:hidden">
                        <h3 className="text-lg font-cinzel font-bold text-foreground mb-3">Lingue</h3>
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">{character.languages || 'Nessuna'}</p>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default MainTabView;
