import { FC } from 'react';
import { AbilityScores } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { ABILITY_LABELS, ABILITY_SHORT, skillLabel } from '../../../lib/labels';

const ABILITIES: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const getModifier = (score: number) => Math.floor((score - 10) / 2);
const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

/** Proficiency marker: empty ring, filled dot (proficient) or double ring (expertise). */
const ProfDot = ({ proficient, expertise }: { proficient: boolean; expertise?: boolean }) => (
    <span
        aria-hidden
        className={`h-3 w-3 shrink-0 rounded-full border-2 ${
            expertise
                ? 'border-accent bg-accent ring-2 ring-accent/40 ring-offset-1 ring-offset-card'
                : proficient
                  ? 'border-accent bg-accent'
                  : 'border-muted-foreground/40'
        }`}
    />
);

export const AbilitiesDisplay: FC<{ readOnly?: boolean }> = () => {
    const { character } = useCharacter();
    if (!character) return null;

    const { proficiencyBonus, abilityScores, savingThrows, skills } = character;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ABILITIES.map((key) => {
                    const score = abilityScores[key] ?? 10;
                    const mod = getModifier(score);
                    const save = savingThrows[key] ?? { proficient: false };
                    const saveBonus = mod + (save.proficient ? proficiencyBonus : 0);
                    const relevantSkills = (skills || []).filter((s) => s.ability === key);

                    return (
                        <section
                            key={key}
                            aria-label={ABILITY_LABELS[key]}
                            className="flex flex-col rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-accent/40"
                        >
                            <header className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-accent/40 bg-accent/10">
                                    <span className="font-mono text-2xl font-bold leading-none text-accent">{formatModifier(mod)}</span>
                                    <span className="mt-1 font-mono text-xs text-muted-foreground">{score}</span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-cinzel text-lg font-bold text-foreground">{ABILITY_LABELS[key]}</h3>
                                    <p className="font-mono text-xs tracking-widest text-muted-foreground">{ABILITY_SHORT[key]}</p>
                                </div>
                            </header>

                            <ul className="mt-4 space-y-0.5 border-t border-border/50 pt-3 text-sm">
                                <li className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-foreground">
                                    <span className="flex items-center gap-2.5">
                                        <ProfDot proficient={save.proficient} />
                                        Tiro salvezza
                                    </span>
                                    <span className="font-mono font-bold text-accent">{formatModifier(saveBonus)}</span>
                                </li>
                                {relevantSkills.map((skill) => {
                                    const bonus = mod + (skill.proficient ? proficiencyBonus : 0) + (skill.expertise ? proficiencyBonus : 0);
                                    return (
                                        <li key={skill.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-text">
                                            <span className="flex items-center gap-2.5">
                                                <ProfDot proficient={skill.proficient} expertise={skill.expertise} />
                                                {skillLabel(skill.name)}
                                            </span>
                                            <span className="font-mono font-semibold">{formatModifier(bonus)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })}
            </div>

            <p className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><ProfDot proficient={false} /> Nessuna competenza</span>
                <span className="flex items-center gap-2"><ProfDot proficient /> Competente</span>
                <span className="flex items-center gap-2"><ProfDot proficient expertise /> Maestria</span>
                <span>Bonus di competenza {formatModifier(proficiencyBonus)}</span>
            </p>
        </div>
    );
};
