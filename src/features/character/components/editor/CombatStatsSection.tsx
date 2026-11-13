import { useMemo } from 'react';
import { ICharacter } from '../../characterTypes';
import { useCharacter } from '../../CharacterProvider';
import { getModifier, formatModifier } from '../../utils/characterUtils';
import { ABILITY_LABELS } from '../../../../lib/labels';
import { BoltIcon, StarIcon, ShieldIcon, SparklesIcon } from '../../../../components/ui/icons';
import { RuneDivider } from '../../../../components/ui/RuneDivider';
import { StyledSection, StyledSelect } from '../ui/StyledInputs';
import { BentoStat } from '../ui/BentoStat';
import { StatInput } from '../StatInput';
import { playGroupTitleClass, playInsetClass } from '../play-view/PlaySection';
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
        <StyledSection icon={<ShieldIcon className="text-muted-foreground" />} title="Statistiche di combattimento">
            <div className="grid grid-cols-2 gap-3">
                <BentoStat inset small label="Iniziativa" value={formatModifier(initiative)} icon={BoltIcon} />
                <BentoStat inset small label="Competenza" value={formatModifier(proficiencyBonus)} icon={StarIcon} />
                {/* La velocità è l'unico valore del gruppo che si scrive a mano: stesso riquadro, con i passi. */}
                <div className={`${playInsetClass} col-span-2 p-3 sm:p-4`}>
                    <StatInput label="Velocità (ft)" value={character.speed} onChange={(val) => updateCharacter({ speed: Number(val) })} />
                </div>
            </div>

            <RuneDivider glyph="notch" className="my-5" />
            <div className="space-y-3">
                <h4 className={playGroupTitleClass}>Incantesimi</h4>
                <StyledSelect
                    label="Caratteristica da incantatore"
                    name="spellcastingAbility"
                    value={character.spellcastingAbility}
                    onChange={handleFieldChange}
                >
                    <option value="">Nessuna</option>
                    {ABILITIES.map(ability => (<option key={ability} value={ability}>{ABILITY_LABELS[ability]}</option>))}
                </StyledSelect>
                <div className="grid grid-cols-2 gap-3">
                    <BentoStat inset small label="CD incantesimi" value={String(spellSaveDC)} icon={ShieldIcon} />
                    <BentoStat inset small label="Attacco" value={String(spellAttackBonus)} icon={SparklesIcon} />
                </div>
            </div>
        </StyledSection>
    );
};
