import { useState } from 'react';
import { AttackRow } from '../../AttackRow';
import { SwordIcon, FireIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { SegmentedControl, SegmentedOption } from '../../../../../components/ui/SegmentedControl';
import { PlaySection, playEmptyClass } from '../PlaySection';
import type { ResolvedAction } from '../../../rules/attacks';
import { useAttackRolls, RollMode } from './useAttackRolls';
import { AttackDetails } from './AttackDetails';
import { AttackRollResults } from './AttackRollResults';

const ROLL_MODES: SegmentedOption<RollMode>[] = [
    { value: 'normal', label: 'Normale' },
    { value: 'advantage', label: 'Vantaggio', tone: 'success' },
    { value: 'disadvantage', label: 'Svantaggio', tone: 'destructive' },
];

interface AttacksAndCantripsProps {
    items: ResolvedAction[];
    /** Tiro per colpire effettuato (consumo munizioni). */
    onAttackRolled?: (action: ResolvedAction) => void;
    /** Spende (−1) o recupera (+1) un uso dell'azione. */
    onSpendUse?: (action: ResolvedAction, delta: number) => void;
    /** Apre la Scheda Oggetto della fonte (armi e poteri degli oggetti). */
    onOpenItem?: (itemId: string) => void;
}

export const AttacksAndCantrips = ({ items, onAttackRolled, onSpendUse, onOpenItem }: AttacksAndCantripsProps) => {
    const [expandedAttackId, setExpandedAttackId] = useState<string | null>(null);
    const { results, rollMode, setRollMode, handleAttackRoll, handleDamageRoll, clearResults, pendingCrit, forceCrit, setForceCrit } = useAttackRolls({ onAttackRolled });

    const toggleExpand = (id: string) => {
        setExpandedAttackId(expandedAttackId === id ? null : id);
    };

    return (
        <PlaySection title="Attacchi e trucchetti" icon={<SwordIcon className="text-muted-foreground" />}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <SegmentedControl label="Modalità del tiro per colpire" options={ROLL_MODES} value={rollMode} onChange={setRollMode} className="min-w-0 flex-1" />
                <Button
                    variant="secondary"
                    onClick={() => setForceCrit(!forceCrit)}
                    aria-pressed={forceCrit}
                    title="Il prossimo tiro di danni raddoppia tutti i dadi"
                    className={forceCrit ? 'border-success/60 bg-success/15 text-success' : ''}
                >
                    Critico
                </Button>
            </div>

            {items.length === 0 ? (
                <p className={playEmptyClass}>Nessun attacco o trucchetto. Equipaggia un'arma nell'inventario o aggiungi un attacco nell'editor.</p>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <AttackRow
                            key={item.id}
                            action={item}
                            onClick={() => toggleExpand(item.id)}
                            isExpanded={expandedAttackId === item.id}
                            variant="card"
                            actions={
                                <>
                                    {item.roll === 'attack' && (
                                        <Button onClick={(e) => handleAttackRoll(e, item)} className="flex-1 sm:flex-initial" title="Tira per colpire">
                                            <SwordIcon className="h-4 w-4" /> Colpire
                                        </Button>
                                    )}
                                    {item.damage && (
                                        <Button
                                            variant="secondary"
                                            onClick={(e) => handleDamageRoll(e, item)}
                                            className={`flex-1 sm:flex-initial ${pendingCrit[item.id] || forceCrit ? 'ring-2 ring-success' : ''}`}
                                            title={pendingCrit[item.id] || forceCrit ? 'Tira i danni del colpo critico' : 'Tira i danni'}
                                        >
                                            <FireIcon className="h-4 w-4" /> {pendingCrit[item.id] || forceCrit ? 'Critico' : 'Danni'}
                                        </Button>
                                    )}
                                    {item.versatileDamage && (
                                        <Button
                                            variant="secondary"
                                            onClick={(e) => handleDamageRoll(e, item, true)}
                                            disabled={item.versatileBlocked}
                                            className="flex-1 sm:flex-initial"
                                            title={item.versatileBlocked ? 'Con lo scudo imbracciato non puoi impugnarla a due mani' : 'Tira i danni a due mani'}
                                        >
                                            2 mani
                                        </Button>
                                    )}
                                    {item.uses && onSpendUse && (
                                        <Button
                                            variant="secondary"
                                            onClick={(e) => { e.stopPropagation(); onSpendUse(item, -1); }}
                                            disabled={item.uses.current < (item.chargeCost ?? 1) || (item.source === 'item' && item.attunementMissing)}
                                            className="flex-1 sm:flex-initial"
                                            title="Spendi un uso"
                                        >
                                            Usa
                                        </Button>
                                    )}
                                </>
                            }
                        >
                            {expandedAttackId === item.id && <AttackDetails action={item} onOpenItem={onOpenItem} />}
                            {results[item.id] && <AttackRollResults results={results[item.id]} onClear={() => clearResults(item.id)} />}
                        </AttackRow>
                    ))}
                </div>
            )}
        </PlaySection>
    );
};
