import { useMemo, useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import * as characterService from '../../characterService';
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

    if (!character) return null;

    const passivePerception = useMemo(() => {
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
    const armorClass = useMemo(() => characterService.calculateArmorClass(character), [character]);

    const hasShield = useMemo(() => {
        return character.equipment?.some(item => item.equipped && item.armorType === 'shield');
    }, [character]);

    const speedMeters = Math.round(character.speed * 0.3);

    return (
        <div className="space-y-6 md:space-y-8">
            {/* HUD Stats Row - Always on top, horizontally scrolling on tiny screens, grid on larger */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatBox
                    label="Armor Class"
                    value={armorClass}
                    subValue={hasShield ? "+ Shield" : undefined}
                    icon={ShieldIcon}
                />
                <StatBox label="Initiative" value={formatModifier(character.initiative)} icon={BoltIcon} />
                <StatBox
                    label="Speed"
                    value={character.speed}
                    subValue={`ft / ≈${speedMeters}m`}
                    icon={ForwardIcon}
                />
                <StatBox label="Proficiency" value={formatModifier(character.proficiencyBonus)} icon={StarIcon} />
                <StatBox label="Passive Perc." value={passivePerception} icon={SearchIcon} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Combat Vitals (HP) - Takes more width on large screens */}
                <div className="lg:col-span-5 space-y-6">
                    <HPTracker />
                    {/* Languages moved here on Desktop to utilize vertical space if HP is short,
                        or it can go below. Let's try putting it here for better balance. */}
                    <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 hidden lg:block">
                        <h3 className="text-lg font-cinzel text-accent mb-3 flex items-center gap-2">
                            Languages
                        </h3>
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">{character.languages || 'None'}</p>
                    </div>
                </div>

                {/* Right Column: Survival Resources */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <DeathSavesTracker />
                    <HitDiceTracker />

                    {/* Languages on Tablet/Mobile: Full width below trackers */}
                    <div className="col-span-1 sm:col-span-2 bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 lg:hidden">
                        <h3 className="text-lg font-cinzel text-accent mb-3">Languages</h3>
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">{character.languages || 'None'}</p>
                    </div>
                </div>

                {/* Status & Defenses Row - Full width below split columns */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Defenses */}
                    <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 flex flex-col h-full">
                        <h3 className="text-lg font-cinzel text-accent mb-4 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5" />
                            Defenses
                        </h3>
                        <div className="space-y-4 flex-grow">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex justify-between">
                                    Resistances
                                    <span className="text-[10px] normal-case bg-background/40 px-2 py-0.5 rounded text-muted-foreground">Half Damage</span>
                                </h4>
                                <div className="bg-background/40 p-3 rounded-xl border border-border/20 min-h-[3rem]">
                                    <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{character.defenses?.resistances || <span className="text-muted-foreground/40 italic">None</span>}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5 flex justify-between">
                                    Immunities
                                    <span className="text-[10px] normal-case bg-background/40 px-2 py-0.5 rounded text-muted-foreground">No Damage</span>
                                </h4>
                                <div className="bg-background/40 p-3 rounded-xl border border-border/20 min-h-[3rem]">
                                    <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{character.defenses?.immunities || <span className="text-muted-foreground/40 italic">None</span>}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conditions */}
                    <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg shadow-accent/5 flex flex-col h-full relative overflow-hidden transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-cinzel text-accent flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500/80" />
                                Conditions
                            </h3>
                            <button
                                onClick={() => setIsEditingConditions(!isEditingConditions)}
                                className={`p-1.5 rounded-lg transition-colors ${isEditingConditions ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/10 text-muted-foreground hover:text-accent'}`}
                                title={isEditingConditions ? "Done Editing" : "Manage Conditions"}
                            >
                                {isEditingConditions ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="bg-background/40 p-4 rounded-xl border border-border/20 flex-grow min-h-[8rem] relative">
                            {/* Active View */}
                            {!isEditingConditions && (
                                <>
                                    {character.conditions && character.conditions.length > 0 ? (
                                        <ul className="space-y-2 animate-in fade-in duration-300">
                                            {character.conditions.map((condName, idx) => {
                                                const condition = CONDITIONS[condName] || { name: condName, description: 'No description available.', bullets: [] };
                                                const isExpanded = expandedCondition === condName;

                                                return (
                                                    <li key={idx} className="bg-destructive/10 text-destructive-foreground rounded-lg border border-destructive/20 overflow-hidden transition-all duration-300">
                                                        <div
                                                            className="px-3 py-2 text-sm font-bold flex items-center justify-between cursor-pointer hover:bg-destructive/5"
                                                            onClick={() => setExpandedCondition(isExpanded ? null : condName)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                                                {condName}
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
                                                                    className="w-full mt-2 bg-destructive/20 hover:bg-destructive text-destructive hover:text-white text-[10px] font-bold uppercase py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                                                                >
                                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                                    Remove Condition
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 italic text-sm animate-in fade-in zoom-in-95 duration-300">
                                            <span>No active conditions</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Editing View */}
                            {isEditingConditions && (
                                <div className="absolute inset-0 bg-card p-4 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200 z-10 flex flex-col gap-2">
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Toggle Conditions</p>
                                    <div className="space-y-2">
                                        {Object.values(CONDITIONS).map(condition => {
                                            const isActive = character.conditions?.includes(condition.name);
                                            const isExpanded = expandedCondition === condition.name;

                                            return (
                                                <div key={condition.name} className={`rounded-lg border transition-all ${isActive ? 'bg-destructive/5 border-destructive/30' : 'bg-background/50 border-border/30 hover:border-accent/40'}`}>
                                                    <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => setExpandedCondition(isExpanded ? null : condition.name)}>
                                                        <span className={`text-sm font-semibold ${isActive ? 'text-destructive' : 'text-foreground'}`}>{condition.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const current = character.conditions || [];
                                                                    const newConditions = isActive
                                                                        ? current.filter(c => c !== condition.name)
                                                                        : [...current, condition.name];
                                                                    updateCharacter({ conditions: newConditions });
                                                                }}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${isActive
                                                                        ? 'bg-destructive text-white hover:bg-destructive/90 hover:scale-105 active:scale-95 ring-2 ring-destructive/20'
                                                                        : 'bg-accent/10 text-accent hover:bg-accent hover:text-white hover:scale-105 active:scale-95'
                                                                    }`}
                                                            >
                                                                {isActive ? <XMarkIcon className="w-5 h-5 font-bold stroke-[3]" /> : <PlusIcon className="w-5 h-5 font-bold stroke-[3]" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Always show description in edit mode if expanded, or simplified? Let's hide unless clicked to keep list clean, but user asked for explanations. */}
                                                    <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-2 px-2' : 'grid-rows-[0fr] opacity-0 pb-0 px-2'}`}>
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
                </div>
            </div>
        </div>
    );
};

export default MainTabView;
