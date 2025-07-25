import React, { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { Attack, Feature } from '../../characterTypes';
import { rollDiceExpression } from '../../utils/characterUtils';

const AttacksAndCantrips = ({ items }: {items: Attack[]}) => {
    const [results, setResults] = useState<Record<string, {atk?: string, dmg?: string}>>({});
    const handleAttackRoll = (attack: Attack) => {
        const modifier = parseInt(attack.bonus) || 0;
        const d20Roll = Math.floor(Math.random() * 20) + 1;
        const total = d20Roll + modifier;
        const pretty = `${d20Roll} ${modifier >= 0 ? '+' : '-'} ${Math.abs(modifier)} = ${total}`;
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], atk: pretty } }));
    };
    const handleDamageRoll = (attack: Attack) => {
        const { pretty } = rollDiceExpression(attack.damage);
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], dmg: pretty } }));
    };
    return (
         <div className="bg-card p-4 rounded-lg border border-border flex flex-col h-full">
            <h3 className="text-lg font-cinzel text-accent mb-3">Attacks & Cantrips</h3>
            <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(50vh-5rem)]">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">None.</p>}
                {items.map(item => (
                     <div key={item.id} className="bg-card/50 rounded-lg text-sm p-3 space-y-2">
                        <div className="flex justify-between items-start">
                            <span className="font-semibold text-accent text-base">{item.name}</span>
                            <div className="flex gap-4 font-mono text-foreground text-right">
                                <span title="Attack Bonus">{item.bonus}</span>
                                <span title="Damage">{item.damage}</span>
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                             <button onClick={() => handleAttackRoll(item)} className="text-xs bg-secondary hover:bg-secondary/80 rounded px-3 py-1.5 transition-colors font-bold">ATK</button>
                             <button onClick={() => handleDamageRoll(item)} className="text-xs bg-destructive/80 hover:bg-destructive rounded px-3 py-1.5 transition-colors font-bold">DMG</button>
                        </div>
                         {(results[item.id]?.atk || results[item.id]?.dmg) &&
                             <div className="text-xs text-foreground bg-muted/50 p-2 rounded-md border-l-2 border-accent space-y-1">
                                 {results[item.id].atk && <div><strong>Attack:</strong> <span className="font-mono text-accent">{results[item.id].atk}</span></div>}
                                 {results[item.id].dmg && <div><strong>Damage:</strong> <span className="font-mono text-destructive">{results[item.id].dmg}</span></div>}
                             </div>
                         }
                    </div>
                ))}
            </div>
        </div>
    )
}

const FeaturesList = ({ title, items }: {title: string; items: Feature[]}) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    return (
         <div className="bg-card p-4 rounded-lg border border-border flex flex-col h-full">
            <h3 className="text-lg font-cinzel text-accent mb-3">{title}</h3>
            <div className="space-y-2 flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(50vh-5rem)]">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">None.</p>}
                {items.map(item => (
                     <div key={item.id} className="bg-card/50 rounded-lg text-sm">
                         <div className="flex items-center justify-between p-3 cursor-pointer w-full text-left" onClick={() => item.description && setExpanded(e => ({...e, [item.id]: !e[item.id]}))}>
                           <span className="font-semibold text-accent">{item.name}</span>
                         </div>
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
    const { character } = useCharacter();
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttacksAndCantrips items={character.attacks || []} />
            <FeaturesList title="Features & Traits" items={character.featuresAndTraits || []} />
        </div>
    )
};

export default CombatTabView;