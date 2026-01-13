import { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Attack, Feature, FeatureCategory, CATEGORY_CONFIG, ICharacter } from '../../characterTypes';
import { rollDiceExpression } from '../../utils/characterUtils';
import { AttackRow } from '../AttackRow';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, SwordIcon, BoltIcon, FireIcon } from '../../../../components/ui/icons';
import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../../data/weaponProperties';

interface RollResult {
    value: string;
    breakdown?: string;
    isCrit: boolean;
    isFail: boolean;
}

const ABILITY_MAP: Record<string, string> = {
    str: 'strength',
    dex: 'dexterity',
    con: 'constitution',
    int: 'intelligence',
    wis: 'wisdom',
    cha: 'charisma'
};

const AttacksAndCantrips = ({ items, abilityScores, proficiencyBonus }: { items: Attack[], abilityScores: any, proficiencyBonus: number }) => {
    const [results, setResults] = useState<Record<string, { atk: RollResult[], dmg: RollResult[] }>>({});
    const [expandedAttackId, setExpandedAttackId] = useState<string | null>(null);

    const handleAttackRoll = (e: React.MouseEvent, attack: Attack) => {
        e.stopPropagation();

        const d20Roll = Math.floor(Math.random() * 20) + 1;
        let total = d20Roll;
        let breakdownParts = [`d20(${d20Roll})`];

        // 1. Ability Modifier
        if (attack.attackAbility && abilityScores) {
            const abilityKey = ABILITY_MAP[attack.attackAbility.toLowerCase()] || attack.attackAbility;
            const score = abilityScores[abilityKey] || 10;
            const modifier = Math.floor((score - 10) / 2);
            if (modifier !== 0) {
                total += modifier;
                const sign = modifier >= 0 ? '+' : '';
                breakdownParts.push(`${sign}${modifier}(${attack.attackAbility.toUpperCase()})`);
            }
        }

        // 2. Proficiency
        if (attack.isProficient) {
            total += proficiencyBonus;
            breakdownParts.push(`+${proficiencyBonus}(PB)`);
        }

        // 3. Custom/Magic Bonus
        const cleanBonus = attack.bonus?.toString().replace(/\s/g, '') || '0';
        let magicBonus = parseInt(cleanBonus, 10);
        if (isNaN(magicBonus)) {
            const match = attack.bonus?.match(/[+-]?\d+/);
            magicBonus = match ? parseInt(match[0], 10) : 0;
        }

        if (magicBonus !== 0) {
            total += magicBonus;
            const sign = magicBonus >= 0 ? '+' : '';
            breakdownParts.push(`${sign}${magicBonus}(Misc)`);
        }

        const breakdown = breakdownParts.join(' + ').replace(/\+ \+/g, '+ ').replace(/\+ -/g, '- '); // Clean up signs

        const newRoll: RollResult = {
            value: total.toString(),
            breakdown,
            isCrit: d20Roll === 20,
            isFail: d20Roll === 1,
        };
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], atk: [...(prev[attack.id]?.atk || []), newRoll] } }));
    };

    const handleDamageRoll = (e: React.MouseEvent, attack: Attack) => {
        e.stopPropagation();

        // Roll Main Damage
        const mainResult = rollDiceExpression(attack.damage);
        let totalDamage = mainResult.total;
        let details = [`${mainResult.total} ${attack.damageType || ''}`.trim()];
        let breakdownParts = [`${mainResult.pretty} ${attack.damageType ? `(${attack.damageType})` : ''}`];

        // Add Modifier from Ability
        if (attack.damageAbility && abilityScores) {
            const abilityKey = ABILITY_MAP[attack.damageAbility.toLowerCase()] || attack.damageAbility;
            const score = abilityScores[abilityKey] || 10;
            const modifier = Math.floor((score - 10) / 2);
            if (modifier !== 0) {
                totalDamage += modifier;
                const sign = modifier >= 0 ? '+' : '-';
                breakdownParts.push(`${sign}${Math.abs(modifier)} (${attack.damageAbility.toUpperCase()})`);
            }
        }

        // Roll Additional Damages
        if (attack.additionalDamage) {
            attack.additionalDamage.forEach(extra => {
                const extraResult = rollDiceExpression(extra.formula);
                totalDamage += extraResult.total;
                details.push(`${extraResult.total} ${extra.type}`);
                breakdownParts.push(`${extraResult.pretty} (${extra.type})`);
            });
        }

        const valueString = details.length > 1
            ? `${totalDamage} (${details.join(' + ')})`
            : `${totalDamage} ${attack.damageType || ''}`.trim();

        const newRoll: RollResult = {
            value: valueString,
            breakdown: breakdownParts.join(' + '),
            isCrit: false,
            isFail: false
        };
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], dmg: [...(prev[attack.id]?.dmg || []), newRoll] } }));
    };



    const clearResults = (attackId: string) => {
        setResults(prev => {
            const newState = { ...prev };
            delete newState[attackId];
            return newState;
        });
    };

    const toggleExpand = (id: string) => {
        setExpandedAttackId(expandedAttackId === id ? null : id);
    };

    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 flex flex-col h-full">
            <h3 className="text-xl font-cinzel text-accent mb-6 flex items-center gap-2">
                <SwordIcon className="w-5 h-5" />
                Attacks & Cantrips
            </h3>
            <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">No attacks or cantrips added.</p>}
                {items.map(item => {
                    const isExpanded = expandedAttackId === item.id;
                    const hasMastery = item.mastery && WEAPON_MASTERIES[item.mastery as keyof typeof WEAPON_MASTERIES];

                    return (
                        <div key={item.id} className="group relative">
                            <AttackRow
                                attack={item}
                                onClick={() => toggleExpand(item.id)}
                                variant="card"
                                actions={
                                    <>
                                        <button
                                            onClick={(e) => handleAttackRoll(e, item)}
                                            className="h-9 px-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                                            title="Roll Attack"
                                        >
                                            <SwordIcon className="w-3.5 h-3.5" />
                                            Hit
                                        </button>
                                        <button
                                            onClick={(e) => handleDamageRoll(e, item)}
                                            className="h-9 px-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                                            title="Roll Damage"
                                        >
                                            <FireIcon className="w-3.5 h-3.5" />
                                            Dmg
                                        </button>
                                    </>
                                }
                            >
                                {isExpanded && (
                                    <div className="pb-2 space-y-3">
                                        <div className="h-px bg-border/20 w-full my-2" />

                                        {/* Dynamic Content based on Weapon vs Spell */}
                                        {item.saveAbility ? (
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div className="bg-background/40 p-2.5 rounded-lg border border-border/30">
                                                    <span className="block text-muted-foreground mb-0.5 text-[10px] uppercase tracking-wider">Save DC</span>
                                                    <span className="font-bold text-base text-foreground">
                                                        {item.bonus} <span className="text-accent text-xs align-middle ml-0.5">{item.saveAbility.toUpperCase()}</span>
                                                    </span>
                                                </div>
                                                <div className="bg-background/40 p-2.5 rounded-lg border border-border/30">
                                                    <span className="block text-muted-foreground mb-0.5 text-[10px] uppercase tracking-wider">Effect</span>
                                                    <span className="font-bold text-base text-foreground truncate">{item.damage || '-'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Weapon Properties */}
                                                {(item.properties && item.properties.length > 0) && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Properties</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.properties.map(propKey => {
                                                                const propData = WEAPON_PROPERTIES[propKey as keyof typeof WEAPON_PROPERTIES];
                                                                return (
                                                                    <div key={propKey} className="bg-muted/30 border border-border/30 rounded px-2 py-1">
                                                                        <span className="font-bold text-[10px] text-foreground block">{propData?.name || propKey}</span>
                                                                        {propData?.description && <span className="text-[9px] text-muted-foreground leading-tight block mt-0.5">{propData.description}</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Weapon Mastery */}
                                                {hasMastery && (
                                                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2.5 mt-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Mastery: {hasMastery.name}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed">{hasMastery.description}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                    </div>
                                )}

                                {/* Roll Results */}
                                {results[item.id] && (
                                    <div className="mt-3 pt-3 border-t border-border/20 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Results</span>
                                            <button onClick={() => clearResults(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Clear Results">
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            {results[item.id].atk?.map((roll, i) => (
                                                <div
                                                    key={`atk-${i}`}
                                                    className={`flex flex-col p-2 rounded-lg border text-xs font-mono shadow-sm animate-in slide-in-from-left-2 fade-in duration-300
                                                        ${roll.isCrit
                                                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
                                                            : roll.isFail
                                                                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                                                : 'bg-background/40 border-border/30 text-foreground'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold tracking-wider opacity-70">HIT:</span>
                                                        <span className="font-bold text-sm">
                                                            {roll.isCrit && 'CRIT! '}
                                                            {roll.isFail && 'FAIL! '}
                                                            {roll.value}
                                                        </span>
                                                    </div>
                                                    {roll.breakdown && (
                                                        <div className="text-[10px] text-right opacity-60 mt-0.5 font-sans">
                                                            {roll.breakdown}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {results[item.id].dmg?.map((roll, i) => (
                                                <div key={`dmg-${i}`} className="flex flex-col p-2 rounded-lg border border-border/30 bg-background/40 text-xs font-mono shadow-sm animate-in slide-in-from-top-1 fade-in duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold tracking-wider text-destructive/80">DMG:</span>
                                                        <span className="font-bold text-sm text-destructive">{roll.value}</span>
                                                    </div>
                                                    {roll.breakdown && (
                                                        <div className="text-[10px] text-right opacity-60 mt-0.5 text-destructive/80 font-sans">
                                                            {roll.breakdown}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </AttackRow>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const CategorySectionDisplay = ({
    category,
    features,
}: {
    category: FeatureCategory;
    features: Feature[];
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

    const config = CATEGORY_CONFIG[category];
    const count = features.length;

    if (count === 0 && (category === 'feat-origin' || category === 'feat-general' || category === 'feat-combat' || category === 'feat-epic')) {
        return null;
    }

    const toggleFeature = (id: string) => {
        setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="rounded-xl overflow-hidden border border-border/30 bg-background/20 mb-3 last:mb-0">
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-card/40 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
                    <h3 className={`font-cinzel text-sm font-bold text-${config.color}`}>{config.label}</h3>
                    {count > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${config.color}/10 text-${config.color} border border-${config.color}/20`}>
                            {count}
                        </span>
                    )}
                </div>
            </div>

            {isExpanded && features.length > 0 && (
                <div className="border-t border-border/20 p-2 space-y-2">
                    {features.map(feature => (
                        <div key={feature.id} className="bg-background/30 rounded-lg overflow-hidden border border-border/10">
                            <button
                                className="flex items-center justify-between p-2.5 w-full text-left disabled:cursor-default focus:outline-none hover:bg-background/40 transition-colors"
                                onClick={() => feature.description && toggleFeature(feature.id)}
                                disabled={!feature.description}
                            >
                                <span className={`font-semibold text-sm text-${config.color} opacity-90`}>{feature.name}</span>
                                {feature.description && <ChevronDownIcon className={`w-4 h-4 text-muted-foreground/60 transition-transform duration-300 ${expandedFeatures[feature.id] ? 'rotate-180 text-accent' : ''}`} />}
                            </button>
                            {expandedFeatures[feature.id] && feature.description && (
                                <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="h-px bg-border/10 w-full mb-2" />
                                    <p className="text-foreground/80 text-xs leading-relaxed whitespace-pre-wrap">{feature.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {isExpanded && features.length === 0 && (
                <div className="p-4 text-center border-t border-border/20">
                    <p className="text-xs text-muted-foreground italic opacity-70">{config.description}</p>
                </div>
            )}
        </div>
    );
};

const FeaturesList = ({ items }: { items: Feature[] }) => {

    const featuresByCategory = useMemo(() => {
        const categorized: Record<FeatureCategory, Feature[]> = {
            'class': [],
            'racial': [],
            'feat-origin': [],
            'feat-general': [],
            'feat-combat': [],
            'feat-epic': [],
        };

        items.forEach(feature => {
            const category = feature.category || 'class';
            if (categorized[category]) {
                categorized[category].push(feature);
            }
        });

        return categorized;
    }, [items]);

    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 flex flex-col h-full">
            <h3 className="text-xl font-cinzel text-accent mb-6 flex items-center gap-2">
                <BoltIcon className="w-5 h-5" />
                Features & Traits
            </h3>
            <div className="space-y-4 flex-grow overflow-y-auto pr-2 -mr-2">
                <CategorySectionDisplay category="class" features={featuresByCategory['class']} />
                <CategorySectionDisplay category="racial" features={featuresByCategory['racial']} />

                {/* Feats Section Group */}
                <div className="space-y-1">
                    {(featuresByCategory['feat-origin'].length > 0 ||
                        featuresByCategory['feat-general'].length > 0 ||
                        featuresByCategory['feat-combat'].length > 0 ||
                        featuresByCategory['feat-epic'].length > 0) && (
                            <div className="flex items-center gap-2 px-1 pb-2 pt-2">
                                <span className="w-1 h-1 rounded-full bg-amber-500/50" />
                                <h4 className="text-xs font-bold text-amber-500/80 uppercase tracking-widest">Feats</h4>
                                <div className="h-px bg-amber-500/20 flex-1" />
                            </div>
                        )}

                    <CategorySectionDisplay category="feat-origin" features={featuresByCategory['feat-origin']} />
                    <CategorySectionDisplay category="feat-general" features={featuresByCategory['feat-general']} />
                    <CategorySectionDisplay category="feat-combat" features={featuresByCategory['feat-combat']} />
                    <CategorySectionDisplay category="feat-epic" features={featuresByCategory['feat-epic']} />
                </div>
            </div>
        </div>
    )
}

const CombatTabView = () => {
    const { character } = useCharacter() as { character: ICharacter };

    const attacks = useMemo(() => [...(character.attacks || [])].sort((a, b) => a.name.localeCompare(b.name)), [character.attacks]);
    const features = useMemo(() => [...(character.featuresAndTraits || [])].sort((a, b) => a.name.localeCompare(b.name)), [character.featuresAndTraits]);

    // Calculate Proficiency Bonus (Level 1-4 = +2, 5-8 = +3, etc.)
    const proficiencyBonus = Math.ceil((character.level || 1) / 4) + 1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttacksAndCantrips items={attacks} abilityScores={character.abilityScores} proficiencyBonus={proficiencyBonus} />
            <FeaturesList items={features} />
        </div>
    )
};

export default CombatTabView;