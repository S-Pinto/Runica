import React, { useState, useMemo } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Attack, Feature, ICharacter } from '../../characterTypes';
import { rollDiceExpression } from '../../utils/characterUtils';
import { AttackRow } from '../AttackRow';
import { ChevronDownIcon, XCircleIcon, SwordIcon, BoltIcon } from '../../../../components/ui/icons';

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
            isCrit: false, // Damage rolls don't typically crit/fail in the same way
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
        <div className="bg-card p-4 rounded-lg border border-border flex flex-col h-full">
            <h3 className="text-lg font-cinzel text-accent mb-3">Attacks & Cantrips</h3>
            <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(100vh-20rem)]">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">None.</p>}
                {items.map(item => {
                    const hasResults = results[item.id]?.atk.length > 0 || results[item.id]?.dmg.length > 0;
                    return (
                        <AttackRow
                            key={item.id}
                            attack={item}
                            actions={
                                <>
                                    <button onClick={() => handleAttackRoll(item)} className="text-xs bg-secondary hover:bg-secondary/80 rounded px-3 py-1.5 transition-colors font-bold">ATK</button>
                                    <button onClick={() => handleDamageRoll(item)} className="text-xs bg-destructive/80 hover:bg-destructive rounded px-3 py-1.5 transition-colors font-bold">DMG</button>
                                </>
                            }
                        >
                            {hasResults && (
                                <div className="text-xs text-foreground bg-muted/50 p-2 rounded-md border-l-2 border-accent space-y-1 relative">
                                    <button onClick={() => clearResults(item.id)} className="absolute top-1 right-1 text-muted-foreground hover:text-destructive"><XCircleIcon className="w-3 h-3"/></button>
                                    {results[item.id].atk.map((roll, i) => (
                                        <div
                                            key={`atk-${i}`}
                                            className={
                                                (roll.isCrit ? 'text-green-400 ' : '') +
                                                (roll.isFail ? 'text-red-500 ' : '')
                                            }
                                                >
                                            <strong>Attack:</strong>{" "}
                                            <span className="font-mono">
                                                {roll.isCrit ? 'CRIT! ' : ''}
                                                {roll.isFail ? 'FAIL! ' : ''}
                                                {roll.value}
                                            </span>
                                        </div>
                                    ))}
                                    {results[item.id].dmg.map((roll, i) => <div key={`dmg-${i}`}><strong>Damage:</strong> <span className="font-mono text-destructive">{roll.value}</span></div>)}
                                </div>
                            )}
                        </AttackRow>
                    )
                })}
            </div>
        </div>
    )
}

const FeaturesList = ({ title, items }: { title: string; items: Feature[] }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    return (
        <div className="bg-card p-4 rounded-lg border border-border flex flex-col h-full">
            <h3 className="text-lg font-cinzel text-accent mb-3">{title}</h3>
            <div className="space-y-2 flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(100vh-20rem)]">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">None.</p>}
                {items.map(item => (
                    <div key={item.id} className="bg-card/50 rounded-lg text-sm">
                        <button
                            className="flex items-center justify-between p-3 w-full text-left disabled:cursor-default"
                            onClick={() => item.description && setExpanded(e => ({ ...e, [item.id]: !e[item.id] }))}
                            disabled={!item.description}
                        >
                            <span className="font-semibold text-accent">{item.name}</span>
                            {item.description && <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform ${expanded[item.id] ? 'rotate-180' : ''}`} />}
                        </button>
                        {expanded[item.id] && item.description && (
                            <div className="p-3 border-t border-border/50 bg-muted/30">
                                <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
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

    const attacks = useMemo(() => [...(character.attacks || [])].sort((a,b) => a.name.localeCompare(b.name)), [character.attacks]);
    const features = useMemo(() => [...(character.featuresAndTraits || [])].sort((a,b) => a.name.localeCompare(b.name)), [character.featuresAndTraits]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttacksAndCantrips items={attacks} />
            <FeaturesList title="Features & Traits" items={features} />
        </div>
    )
};

export default CombatTabView;