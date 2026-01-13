import { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Attack, Feature, ICharacter } from '../../characterTypes';
import { rollDiceExpression } from '../../utils/characterUtils';
import { AttackRow } from '../AttackRow';
import { ChevronDownIcon, TrashIcon, SwordIcon, BoltIcon, FireIcon } from '../../../../components/ui/icons';

interface RollResult {
    value: string;
    isCrit: boolean;
    isFail: boolean;
}

const AttacksAndCantrips = ({ items }: { items: Attack[] }) => {
    const [results, setResults] = useState<Record<string, { atk: RollResult[], dmg: RollResult[] }>>({});

    const handleAttackRoll = (attack: Attack) => {
        const modifier = parseInt(attack.bonus) || 0;
        const d20Roll = Math.floor(Math.random() * 20) + 1;
        const total = d20Roll + modifier;
        const newRoll: RollResult = {
            value: `${d20Roll} ${modifier >= 0 ? '+' : '-'} ${Math.abs(modifier)} = ${total}`,
            isCrit: d20Roll === 20,
            isFail: d20Roll === 1,
        };
        setResults(prev => {
            const currentRolls = prev[attack.id] || { atk: [], dmg: [] };
            return { ...prev, [attack.id]: { ...currentRolls, atk: [newRoll, ...currentRolls.atk].slice(0, 5) } };
        });
    };

    const handleDamageRoll = (attack: Attack) => {
        const { pretty } = rollDiceExpression(attack.damage);
        const newRoll: RollResult = {
            value: pretty,
            isCrit: false,
            isFail: false,
        };
        setResults(prev => {
            const currentRolls = prev[attack.id] || { atk: [], dmg: [] };
            return { ...prev, [attack.id]: { ...currentRolls, dmg: [newRoll, ...currentRolls.dmg].slice(0, 5) } };
        });
    };

    const clearResults = (attackId: string) => {
        setResults(prev => ({ ...prev, [attackId]: { atk: [], dmg: [] } }));
    }

    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 flex flex-col h-full">
            <h3 className="text-xl font-cinzel text-accent mb-6 flex items-center gap-2">
                <SwordIcon className="w-5 h-5" />
                Attacks & Cantrips
            </h3>
            <div className="space-y-4 flex-grow overflow-y-auto pr-2 -mr-2">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">No attacks configured.</p>}
                {items.map(item => {
                    const hasResults = (results[item.id]?.atk.length || 0) > 0 || (results[item.id]?.dmg.length || 0) > 0;
                    return (
                        <div key={item.id} className="group">
                            <AttackRow
                                attack={item}
                                actions={
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAttackRoll(item)}
                                            className="group flex items-center gap-1.5 text-xs bg-accent/10 hover:bg-accent text-accent hover:text-accent-foreground border border-accent/20 rounded-lg px-3 py-2 transition-all shadow-sm active:scale-95 font-bold uppercase tracking-wide"
                                            title="Roll To Hit"
                                        >
                                            <SwordIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                            Hit
                                        </button>
                                        <button
                                            onClick={() => handleDamageRoll(item)}
                                            className="group flex items-center gap-1.5 text-xs bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border border-destructive/20 rounded-lg px-3 py-2 transition-all shadow-sm active:scale-95 font-bold uppercase tracking-wide"
                                            title="Roll Damage"
                                        >
                                            <FireIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                            Dmg
                                        </button>
                                    </div>
                                }
                            >
                                {hasResults && (
                                    <div className="mt-2 relative">
                                        <button
                                            onClick={() => clearResults(item.id)}
                                            className="absolute -top-3 -right-3 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-all z-10 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 hover:scale-100"
                                            title="Clear Results"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>

                                        <div className="space-y-1.5">
                                            {results[item.id].atk.map((roll, i) => (
                                                <div
                                                    key={`atk-${i}`}
                                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono shadow-sm animate-in slide-in-from-top-1 fade-in duration-200 ${roll.isCrit
                                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                        : roll.isFail
                                                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                            : 'bg-background/40 border-border/30 text-foreground'
                                                        }`}
                                                >
                                                    <span className="font-bold tracking-wider opacity-70">HIT:</span>
                                                    <span className="font-bold text-sm">
                                                        {roll.isCrit && 'CRIT! '}
                                                        {roll.isFail && 'FAIL! '}
                                                        {roll.value}
                                                    </span>
                                                </div>
                                            ))}
                                            {results[item.id].dmg.map((roll, i) => (
                                                <div key={`dmg-${i}`} className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-background/40 text-xs font-mono shadow-sm animate-in slide-in-from-top-1 fade-in duration-200">
                                                    <span className="font-bold tracking-wider text-destructive/80">DMG:</span>
                                                    <span className="font-bold text-sm text-destructive">{roll.value}</span>
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

const FeaturesList = ({ title, items }: { title: string; items: Feature[] }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    return (
        <div className="bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50 flex flex-col h-full">
            <h3 className="text-xl font-cinzel text-accent mb-6 flex items-center gap-2">
                <BoltIcon className="w-5 h-5" />
                {title}
            </h3>
            <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">No {title.toLowerCase()} found.</p>}
                {items.map(item => (
                    <div key={item.id} className="bg-background/40 hover:bg-background/60 rounded-xl border border-border/50 transition-all duration-300 overflow-hidden group">
                        <button
                            className="flex items-center justify-between p-4 w-full text-left disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-accent/30"
                            onClick={() => item.description && setExpanded(e => ({ ...e, [item.id]: !e[item.id] }))}
                            disabled={!item.description}
                        >
                            <span className="font-bold text-accent group-hover:text-accent-light transition-colors">{item.name}</span>
                            {item.description && <ChevronDownIcon className={`w-5 h-5 text-muted-foreground/60 transition-transform duration-300 ${expanded[item.id] ? 'rotate-180 text-accent' : ''}`} />}
                        </button>
                        {expanded[item.id] && item.description && (
                            <div className="px-4 pb-4 border-t border-border/10 bg-muted/10 animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap pt-3">{item.description}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

const CombatTabView = () => {
    const { character } = useCharacter() as { character: ICharacter };

    const attacks = useMemo(() => [...(character.attacks || [])].sort((a, b) => a.name.localeCompare(b.name)), [character.attacks]);
    const features = useMemo(() => [...(character.featuresAndTraits || [])].sort((a, b) => a.name.localeCompare(b.name)), [character.featuresAndTraits]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttacksAndCantrips items={attacks} />
            <FeaturesList title="Features & Traits" items={features} />
        </div>
    )
};

export default CombatTabView;