import React from 'react';
import { ICharacter, AbilityScores } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { ABILITY_LABELS, ABILITY_SHORT } from '../../../../lib/labels';
import { CONDITIONS } from '../../../../data/conditions';
import { XMarkIcon } from '../../../../components/ui/icons';
import { fieldCheckRowClass, fieldChipClass, fieldGroupClass, fieldGroupTitleClass } from '../../../../components/ui/field';
import { getArmorClassBreakdown } from '../../rules/combat';
import { StyledInput, StyledTextArea, StyledSection } from '../ui/StyledInputs';
import { StatInput } from '../StatInput';
import { ABILITIES } from './constants';

interface VitalsSectionProps {
    character: ICharacter;
}

const HitPointsCard = ({ character }: VitalsSectionProps) => {
    const { setCharacter } = useCharacter();

    const handleHpChange = (field: 'current' | 'max' | 'temporary', value: number) => {
        setCharacter(prev => ({ ...prev!, hp: { ...prev!.hp, [field]: value } }));
    };

    const handleHitDiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setCharacter(prev => ({ ...prev!, hitDice: { ...prev!.hitDice, total: value } }));
    };

    return (
        <div className="frame-rune p-4 sm:p-5">
            <h4 className={`${fieldGroupTitleClass} mb-3`}>Punti vita</h4>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
                <StatInput label="Attuali" value={character.hp.current} onChange={(val) => handleHpChange('current', Number(val))} />
                <StatInput label="Massimi" value={character.hp.max} onChange={(val) => handleHpChange('max', Number(val))} />
                <StatInput label="Temporanei" value={character.hp.temporary} onChange={(val) => handleHpChange('temporary', Number(val))} />
            </div>
            <div className="mt-4 border-t border-border pt-4">
                <StyledInput label="Dadi vita" subLabel="Numero e tipo, es. 5d8" name="hitDice" value={character.hitDice.total} onChange={handleHitDiceChange} placeholder="1d8" className="sm:max-w-xs" />
            </div>
        </div>
    );
};

const UnarmoredDefenseCard = ({ character }: VitalsSectionProps) => {
    const { updateCharacter } = useCharacter();

    const handleUnarmoredAbilityToggle = (ability: keyof AbilityScores) => {
        const currentAbilities = character.unarmoredDefense?.abilities || [];
        const newAbilities = currentAbilities.includes(ability)
            ? currentAbilities.filter(a => a !== ability)
            : [...currentAbilities, ability];
        updateCharacter({ unarmoredDefense: { base: character.unarmoredDefense?.base ?? 10, abilities: newAbilities } });
    };

    return (
        <div className={fieldGroupClass}>
            <h4 className={`${fieldGroupTitleClass} mb-3`}>Difesa senza armatura</h4>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="sm:w-36 sm:shrink-0">
                    <StatInput label="CA base" value={character.unarmoredDefense?.base ?? 10} onChange={(val) => updateCharacter({ unarmoredDefense: { base: Number(val), abilities: character.unarmoredDefense?.abilities || [] } })} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="mb-1.5 text-label uppercase text-muted-foreground">Più i modificatori di</p>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Caratteristiche sommate alla CA">
                        {ABILITIES.map(ability => {
                            const active = character.unarmoredDefense?.abilities.includes(ability);
                            return (
                                <button
                                    key={ability}
                                    type="button"
                                    aria-pressed={active}
                                    title={ABILITY_LABELS[ability]}
                                    onClick={() => handleUnarmoredAbilityToggle(ability)}
                                    className={`${fieldChipClass(active)} min-h-10 px-3`}
                                >
                                    {ABILITY_SHORT[ability]}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

/** CA calcolata con il dettaglio, e la possibilità di impostarla a mano (homebrew, decisioni del DM). */
const ArmorClassCard = ({ character }: VitalsSectionProps) => {
    const { updateCharacter } = useCharacter();
    const ac = getArmorClassBreakdown(character);

    return (
        <div className={fieldGroupClass}>
            <h4 className={`${fieldGroupTitleClass} mb-3`}>Classe Armatura</h4>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-sm text-text">
                        Calcolata <span className="font-mono text-lg font-bold tabular-nums text-foreground">{ac.computed}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {ac.parts.map((p, i) => `${i === 0 ? p.value : `${p.value >= 0 ? '+' : ''}${p.value}`} ${p.label}`).join(' · ')}
                    </p>
                    {ac.inactiveBonuses.length > 0 && (
                        <p className="mt-0.5 text-xs text-warning">Esclusi finché non sei in sintonia: {ac.inactiveBonuses.map(i => i.name).join(', ')}.</p>
                    )}
                    <label className={`${fieldCheckRowClass} mt-2`}>
                        <input
                            type="checkbox"
                            className="check-rune"
                            checked={ac.manual}
                            onChange={e => updateCharacter({ armorClassOverride: e.target.checked ? ac.computed : null })}
                        />
                        Imposta a mano
                    </label>
                </div>
                {ac.manual && (
                    <div className="sm:w-36 sm:shrink-0">
                        <StatInput label="CA manuale" value={ac.total} onChange={(val) => updateCharacter({ armorClassOverride: Number(val) || 0 })} />
                    </div>
                )}
            </div>
        </div>
    );
};

const DefensesAndConditions = ({ character }: VitalsSectionProps) => {
    const { setCharacter } = useCharacter();

    const handleDefensesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCharacter(prev => ({
            ...prev!,
            defenses: { ...prev!.defenses, [name]: value }
        }));
    };

    // Conditions are stored by English key (e.g. 'Poisoned') and shown by Italian name.
    const toggleCondition = (key: string) => {
        setCharacter(prev => {
            if (!prev) return prev;
            const current = prev.conditions || [];
            return { ...prev, conditions: current.includes(key) ? current.filter(c => c !== key) : [...current, key] };
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StyledTextArea label="Resistenze" subLabel="Danni dimezzati" name="resistances" value={character.defenses?.resistances || ''} onChange={handleDefensesChange} placeholder="Fuoco, veleno…" rows={2} />
                <StyledTextArea label="Immunità" subLabel="Nessun danno" name="immunities" value={character.defenses?.immunities || ''} onChange={handleDefensesChange} placeholder="Freddo, charme…" rows={2} />
            </div>
            <div>
                <p className="mb-1.5 text-label uppercase text-muted-foreground">Condizioni</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Condizioni">
                    {Object.entries(CONDITIONS).map(([key, cond]) => {
                        const active = character.conditions?.includes(key);
                        return (
                            <button
                                key={key}
                                type="button"
                                aria-pressed={active}
                                title={cond.description}
                                onClick={() => toggleCondition(key)}
                                className={fieldChipClass(active, 'destructive')}
                            >
                                {cond.name}
                            </button>
                        );
                    })}
                    {(character.conditions || []).filter(c => !CONDITIONS[c]).map(c => (
                        <button key={c} type="button" onClick={() => toggleCondition(c)} title="Condizione personalizzata: clicca per rimuoverla" className={`${fieldChipClass(true, 'destructive')} gap-1`}>
                            {c} <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const VitalsSection = ({ character }: VitalsSectionProps) => (
    <StyledSection title="Vita e difesa">
        <div className="space-y-5">
            <HitPointsCard character={character} />
            <UnarmoredDefenseCard character={character} />
            <ArmorClassCard character={character} />
            <DefensesAndConditions character={character} />
        </div>
    </StyledSection>
);
