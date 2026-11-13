import { useState } from 'react';
import { Attack, AbilityScores } from '../../../characterTypes';
import { AttackRow } from '../../AttackRow';
import { SwordIcon, FireIcon } from '../../../../../components/ui/icons';
import { Button } from '../../../../../components/ui/Button';
import { SegmentedControl, SegmentedOption } from '../../../../../components/ui/SegmentedControl';
import { PlaySection, playEmptyClass } from '../PlaySection';
import { useAttackRolls, RollMode } from './useAttackRolls';
import { AttackDetails } from './AttackDetails';
import { AttackRollResults } from './AttackRollResults';

const ROLL_MODES: SegmentedOption<RollMode>[] = [
    { value: 'normal', label: 'Normale' },
    { value: 'advantage', label: 'Vantaggio', tone: 'success' },
    { value: 'disadvantage', label: 'Svantaggio', tone: 'destructive' },
];

export const AttacksAndCantrips = ({ items, abilityScores, proficiencyBonus }: { items: Attack[], abilityScores: AbilityScores, proficiencyBonus: number }) => {
    const [expandedAttackId, setExpandedAttackId] = useState<string | null>(null);
    const { results, rollMode, setRollMode, handleAttackRoll, handleDamageRoll, clearResults } = useAttackRolls(abilityScores, proficiencyBonus);

    const toggleExpand = (id: string) => {
        setExpandedAttackId(expandedAttackId === id ? null : id);
    };

    return (
        <PlaySection title="Attacchi e trucchetti" icon={<SwordIcon className="text-muted-foreground" />}>
            <SegmentedControl label="Modalità del tiro per colpire" options={ROLL_MODES} value={rollMode} onChange={setRollMode} className="mb-4" />

            {items.length === 0 ? (
                <p className={playEmptyClass}>Nessun attacco o trucchetto.</p>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <AttackRow
                            key={item.id}
                            attack={item}
                            abilityScores={abilityScores}
                            proficiencyBonus={proficiencyBonus}
                            onClick={() => toggleExpand(item.id)}
                            isExpanded={expandedAttackId === item.id}
                            variant="card"
                            actions={
                                <>
                                    {!item.saveAbility && (
                                        <Button onClick={(e) => handleAttackRoll(e, item)} className="flex-1 sm:flex-initial" title="Tira per colpire">
                                            <SwordIcon className="h-4 w-4" /> Colpire
                                        </Button>
                                    )}
                                    <Button variant="secondary" onClick={(e) => handleDamageRoll(e, item)} className="flex-1 sm:flex-initial" title="Tira i danni">
                                        <FireIcon className="h-4 w-4" /> Danni
                                    </Button>
                                </>
                            }
                        >
                            {expandedAttackId === item.id && <AttackDetails attack={item} />}
                            {results[item.id] && <AttackRollResults results={results[item.id]} onClear={() => clearResults(item.id)} />}
                        </AttackRow>
                    ))}
                </div>
            )}
        </PlaySection>
    );
};
