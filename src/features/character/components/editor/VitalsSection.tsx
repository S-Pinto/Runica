import React from 'react';
import { ICharacter, AbilityScores } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { ABILITY_SHORT } from '../../../../lib/labels';
import { CONDITIONS } from '../../../../data/conditions';
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
        <div className="bg-background/30 rounded-xl p-4 border border-border/40">
            <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-3 text-center">Punti vita</label>
            {/* Changed from grid-cols-3 to flex-col to allow buttons and values to be seen clearly */}
            <div className="grid grid-cols-1 gap-3">
                <StatInput label="PV attuali" value={character.hp.current} onChange={(val) => handleHpChange('current', Number(val))} inputClassName="text-success" />
                <StatInput label="PV massimi" value={character.hp.max} onChange={(val) => handleHpChange('max', Number(val))} />
                <StatInput label="PV temporanei" value={character.hp.temporary} onChange={(val) => handleHpChange('temporary', Number(val))} inputClassName="text-accent" />
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
                <StyledInput label="Dadi vita" subLabel="Tipo di dado" name="hitDice" value={character.hitDice.total} onChange={handleHitDiceChange} placeholder="Es. 1d8" className="w-1/2 mx-auto text-center" />
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
        <div className="bg-background/30 rounded-xl p-4 border border-border/40">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-accent uppercase tracking-widest">Difesa senza armatura</label>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-32 flex-shrink-0">
                    <StatInput label="CA base" value={character.unarmoredDefense?.base ?? 10} onChange={(val) => updateCharacter({ unarmoredDefense: { base: Number(val), abilities: character.unarmoredDefense?.abilities || [] } })} />
                </div>
                <div className="text-muted-foreground font-cinzel text-xl">+</div>
                <div className="flex-grow flex flex-wrap justify-center sm:justify-start gap-2">
                    {ABILITIES.map(ability => (
                        <label key={ability} className={`
                            cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all
                            ${character.unarmoredDefense?.abilities.includes(ability)
                                ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_rgb(var(--color-accent)/0.4)]'
                                : 'bg-background/50 text-muted-foreground border-border hover:border-accent/50'}
                        `}>
                            <input type="checkbox" className="hidden" checked={character.unarmoredDefense?.abilities.includes(ability)} onChange={() => handleUnarmoredAbilityToggle(ability)} />
                            {ABILITY_SHORT[ability]}
                        </label>
                    ))}
                </div>
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
        <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <StyledTextArea label="Resistenze" subLabel="Danni dimezzati" name="resistances" value={character.defenses?.resistances || ''} onChange={handleDefensesChange} placeholder="Fuoco, veleno…" rows={2} className="min-h-[80px]" />
                </div>
                <div>
                    <StyledTextArea label="Immunità" subLabel="Nessun danno" name="immunities" value={character.defenses?.immunities || ''} onChange={handleDefensesChange} placeholder="Freddo, charme…" rows={2} className="min-h-[80px]" />
                </div>
            </div>
            <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Condizioni</p>
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
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                    active
                                        ? 'border-destructive/50 bg-destructive/15 text-destructive'
                                        : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                                }`}
                            >
                                {cond.name}
                            </button>
                        );
                    })}
                    {(character.conditions || []).filter(c => !CONDITIONS[c]).map(c => (
                        <button key={c} type="button" onClick={() => toggleCondition(c)} title="Condizione personalizzata: clicca per rimuoverla" className="rounded-full border border-destructive/50 bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                            {c} ×
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const VitalsSection = ({ character }: VitalsSectionProps) => (
    <StyledSection title="Vita e difesa">
        <div className="space-y-6">
            <HitPointsCard character={character} />
            <UnarmoredDefenseCard character={character} />
            <DefensesAndConditions character={character} />
        </div>
    </StyledSection>
);
