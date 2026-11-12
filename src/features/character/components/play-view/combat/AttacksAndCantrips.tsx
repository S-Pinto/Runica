import { useState } from 'react';
import { Attack, AbilityScores } from '../../../characterTypes';
import { AttackRow } from '../../AttackRow';
import { SwordIcon, FireIcon } from '../../../../../components/ui/icons';
import { useAttackRolls } from './useAttackRolls';
import { AttackDetails } from './AttackDetails';
import { AttackRollResults } from './AttackRollResults';

const ROLL_MODES = [
    ['normal', 'Normale'],
    ['advantage', 'Vantaggio'],
    ['disadvantage', 'Svantaggio'],
] as const;

export const AttacksAndCantrips = ({ items, abilityScores, proficiencyBonus }: { items: Attack[], abilityScores: AbilityScores, proficiencyBonus: number }) => {
    const [expandedAttackId, setExpandedAttackId] = useState<string | null>(null);
    const { results, rollMode, setRollMode, handleAttackRoll, handleDamageRoll, clearResults } = useAttackRolls(abilityScores, proficiencyBonus);

    const toggleExpand = (id: string) => {
        setExpandedAttackId(expandedAttackId === id ? null : id);
    };

    return (
        <div className="bg-card p-6 rounded-2xl border border-border/50 flex flex-col h-full">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-cinzel font-bold text-foreground flex items-center gap-2">
                    <SwordIcon className="w-5 h-5" />
                    Attacchi e trucchetti
                </h3>
                <div role="radiogroup" aria-label="Modalità del tiro per colpire" className="flex rounded-xl border border-border bg-background/40 p-0.5 text-xs font-semibold">
                    {ROLL_MODES.map(([mode, label]) => (
                        <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={rollMode === mode}
                            onClick={() => setRollMode(mode)}
                            className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                                rollMode === mode
                                    ? mode === 'advantage' ? 'bg-success/20 text-success' : mode === 'disadvantage' ? 'bg-destructive/20 text-destructive' : 'bg-accent/20 text-accent'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">Nessun attacco o trucchetto.</p>}
                {items.map(item => (
                    <div key={item.id} className="group relative">
                        <AttackRow
                            attack={item}
                            abilityScores={abilityScores}
                            proficiencyBonus={proficiencyBonus}
                            onClick={() => toggleExpand(item.id)}
                            variant="card"
                            actions={
                                <div className="flex w-full items-center gap-2">
                                    {!item.saveAbility && (
                                        <button
                                            onClick={(e) => handleAttackRoll(e, item)}
                                            className="flex-1 sm:flex-initial h-10 px-3.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                                            title="Tira per colpire"
                                        >
                                            <SwordIcon className="w-4 h-4" />
                                            Colpire
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleDamageRoll(e, item)}
                                        className="flex-1 sm:flex-initial h-10 px-3.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                                        title="Danni"
                                    >
                                        <FireIcon className="w-4 h-4" />
                                        Danni
                                    </button>
                                </div>
                            }
                        >
                            {expandedAttackId === item.id && <AttackDetails attack={item} />}
                            {results[item.id] && <AttackRollResults results={results[item.id]} onClear={() => clearResults(item.id)} />}
                        </AttackRow>
                    </div>
                ))}
            </div>
        </div>
    );
};
