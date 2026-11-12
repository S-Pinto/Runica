import { useMemo } from 'react';
import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { ABILITY_LABELS } from '../../../../lib/labels';
import { StyledSection } from '../ui/StyledInputs';
import { StatBox } from '../ui/StatBox';
import { StatInput } from '../StatInput';
import { useFieldChange } from '../../hooks/useFieldChange';
import { ABILITIES } from './constants';

interface CombatStatsSectionProps {
    character: ICharacter;
    initiative: number;
    proficiencyBonus: number;
}

export const CombatStatsSection = ({ character, initiative, proficiencyBonus }: CombatStatsSectionProps) => {
    const { updateCharacter } = useCharacter();
    const handleFieldChange = useFieldChange();

    const { spellSaveDC, spellAttackBonus } = useMemo(() => {
        if (!character.spellcastingAbility) return { spellSaveDC: '-', spellAttackBonus: '-' };
        const mod = getModifier(character.abilityScores[character.spellcastingAbility]);
        return {
            spellSaveDC: 8 + proficiencyBonus + mod,
            spellAttackBonus: formatModifier(proficiencyBonus + mod),
        };
    }, [character.spellcastingAbility, character.abilityScores, proficiencyBonus]);

    return (
        <StyledSection title="Statistiche di combattimento">
            <div className="grid grid-cols-2 gap-4">
                <StatBox label="Iniziativa" value={formatModifier(initiative)} />
                <StatInput label="Velocità" value={character.speed} onChange={(val) => updateCharacter({ speed: Number(val) })} />
                <StatBox label="Competenza" value={formatModifier(proficiencyBonus)} />
                <div className="col-span-2">
                    <StyledSection title="" className="!p-3 !bg-background/20 !border-border/30">
                        <label htmlFor="spellcastingAbility" className="block text-xs font-bold text-accent uppercase tracking-widest pl-1 mb-2">Caratteristica da incantatore</label>
                        <select
                            id="spellcastingAbility"
                            name="spellcastingAbility"
                            value={character.spellcastingAbility}
                            onChange={handleFieldChange}
                            className="block w-full bg-background/50 border border-border/50 rounded-xl shadow-sm py-2.5 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent sm:text-sm transition-all"
                        >
                            <option value="">Nessuna</option>
                            {ABILITIES.map(ability => (<option key={ability} value={ability}>{ABILITY_LABELS[ability]}</option>))}
                        </select>
                    </StyledSection>
                </div>
                <StatBox label="CD incantesimi" value={String(spellSaveDC)} />
                <StatBox label="Attacco con incantesimi" value={String(spellAttackBonus)} />
            </div>
        </StyledSection>
    );
};
