import { useMemo } from 'react';
import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { ABILITY_LABELS } from '../../../../lib/labels';
import { BoltIcon, StarIcon } from '../../../../components/ui/icons';
import { StyledSection, StyledSelect } from '../ui/StyledInputs';
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
        if (!character.spellcastingAbility) return { spellSaveDC: '–', spellAttackBonus: '–' };
        const mod = getModifier(character.abilityScores[character.spellcastingAbility]);
        return {
            spellSaveDC: 8 + proficiencyBonus + mod,
            spellAttackBonus: formatModifier(proficiencyBonus + mod),
        };
    }, [character.spellcastingAbility, character.abilityScores, proficiencyBonus]);

    return (
        <StyledSection title="Statistiche di combattimento">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatBox label="Iniziativa" value={formatModifier(initiative)} icon={BoltIcon} />
                <StatBox label="Competenza" value={formatModifier(proficiencyBonus)} icon={StarIcon} />
                {/* La velocità è l'unico valore del gruppo che si scrive a mano: stessa cornice, con i passi. */}
                <div className="frame-rune col-span-2 p-3.5 sm:p-4">
                    <StatInput label="Velocità (ft)" value={character.speed} onChange={(val) => updateCharacter({ speed: Number(val) })} />
                </div>
            </div>

            <div className="mt-5 border-t border-border pt-4">
                <StyledSelect
                    label="Caratteristica da incantatore"
                    name="spellcastingAbility"
                    value={character.spellcastingAbility}
                    onChange={handleFieldChange}
                >
                    <option value="">Nessuna</option>
                    {ABILITIES.map(ability => (<option key={ability} value={ability}>{ABILITY_LABELS[ability]}</option>))}
                </StyledSelect>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                    <StatBox label="CD incantesimi" value={String(spellSaveDC)} />
                    <StatBox label="Attacco con incantesimi" value={String(spellAttackBonus)} />
                </div>
            </div>
        </StyledSection>
    );
};
