import { useMemo } from 'react';
import { ICharacter, Feature } from '../../characterTypes';
import { getAllActions, calculateArmorClass, CharacterAction } from '../../rules/combat';
import { SVGs } from './printStyles';
import { ABILITY_KEYS, fmtMod, getMod, getPrintLevel, getPrintProficiency } from './printUtils';

const CATEGORY_LABELS: Record<string, string> = {
    'class': 'CLASS FEATURES',
    'racial': 'RACIAL TRAITS',
    'feat-origin': 'ORIGIN FEATS',
    'feat-general': 'GENERAL FEATS',
    'feat-combat': 'COMBAT FEATS',
    'feat-epic': 'EPIC FEATS',
};

const FEATURE_CATEGORIES = ['class', 'racial', 'feat-origin', 'feat-general', 'feat-combat', 'feat-epic', 'other'];

const formatDamage = (character: ICharacter, atk: CharacterAction) => {
    const mod = atk.damageAbility ? getMod(character.abilityScores[atk.damageAbility as keyof typeof character.abilityScores]) : 0;
    const parts = [`${atk.damage}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''} ${atk.damageType || ''}`.trim()];
    if (atk.additionalDamage && atk.additionalDamage.length > 0) {
        atk.additionalDamage.forEach((e) => {
            parts.push(`${e.formula} ${e.type}`);
        });
    }
    return parts.join(' + ');
};

const PrintHeader = ({ character, level }: { character: ICharacter; level: number }) => (
    <header className="char-header">
        <div className="portrait-container">
            {character.imageUrl ? <img src={character.imageUrl} className="portrait-img" alt="Portrait" /> : <div className="portrait-placeholder">{SVGs.portraitFrame}</div>}
        </div>
        <div className="header-info">
            <div className="name-level-row">
                <div className="header-field name-field">
                    <div className="field-value">{character.name}</div>
                    <div className="field-label">CHARACTER NAME</div>
                </div>
                <div className="level-badge">
                    <div className="lvl-label">LVL</div>
                    <div className="lvl-val">{level}</div>
                </div>
            </div>
            <div className="meta-row">
                <div className="header-field"><div className="field-value">{character.class}</div><div className="field-label">CLASS</div></div>
                <div className="header-field"><div className="field-value">{character.background}</div><div className="field-label">BACKGROUND</div></div>
                <div className="header-field"><div className="field-value">{character.race}</div><div className="field-label">SPECIES</div></div>
                <div className="header-field"><div className="field-value">{character.alignment}</div><div className="field-label">ALIGNMENT</div></div>
            </div>
        </div>
    </header>
);

const AbilitiesColumn = ({ character, pb }: { character: ICharacter; pb: number }) => (
    <div className="left-col">
        <div className="pb-container-v15">
            <div className="pb-svg-frame">{SVGs.pbFrame}</div>
            <div className="pb-badge-v15">
                <div className="pb-label-v15">PROFICIENCY</div>
                <div className="pb-value-v15">{fmtMod(pb)}</div>
                <div className="pb-label-v15">BONUS</div>
            </div>
        </div>
        <div className="abilities-vertical">
            {ABILITY_KEYS.map(key => {
                const score = character.abilityScores[key];
                const mod = getMod(score);
                const saveProf = character.savingThrows[key]?.proficient;
                return (
                    <div key={key} className="ability-card-v9">
                        <div className="ability-label-v9">{key.toUpperCase()}</div>
                        <div className="ability-body-v9">
                            <div className="ability-header-v9">
                                <div className="mod-container-v9">{SVGs.modFrame}<div className="mod-value-v9">{fmtMod(mod)}</div></div>
                                <div className="score-bubble-v9"><div className="score-val-v9">{score}</div></div>
                            </div>
                            <div className="ability-details-v9">
                                <div className="save-row-v9">
                                    <div className={`prof-indicator ${saveProf ? 'filled' : ''}`}></div>
                                    <span style={{ width: '4.5mm', textAlign: 'right', fontWeight: 800 }}>{fmtMod(mod + (saveProf ? pb : 0))}</span>
                                    <span style={{ fontWeight: 950 }}>SAVING THROW</span>
                                </div>
                                <div className="skills-list-v9">
                                    {character.skills.filter(s => s.ability === key).map(s => (
                                        <div key={s.name} className="skill-row">
                                            <div className={`prof-indicator ${s.proficient ? 'filled' : ''}`}></div>
                                            <span className="skill-val">{fmtMod(mod + (s.proficient ? pb : 0) + (s.expertise ? pb : 0))}</span>
                                            <span className="skill-name-v8">{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const VitalsBlock = ({ character, pb, level }: { character: ICharacter; pb: number; level: number }) => (
    <>
        <div className="vitals-row">
            <div className="vital-card ac-card">
                <div className="vital-label">ARMOR CLASS</div>
                <div className="shield-container">{SVGs.shield}<div className="vital-value">{calculateArmorClass(character)}</div></div>
            </div>
            <div className="vital-card"><div className="vital-label">INITIATIVE</div><div className="vital-value-frame">{fmtMod(getMod(character.abilityScores.dexterity))}</div></div>
            <div className="vital-card"><div className="vital-label">SPEED</div><div className="vital-value-frame">{character.speed}ft</div></div>
            <div className="vital-card"><div className="vital-label">PASSIVE PERC.</div><div className="vital-value-frame">{10 + getMod(character.abilityScores.wisdom) + (character.skills.find(s => s.name === 'Perception')?.proficient ? pb : 0)}</div></div>
        </div>

        <div className="hp-vitals-container">
            <div className="hp-row">
                <div className="hp-box current-hp"><div className="box-label">CURRENT HIT POINTS</div><div className="box-value-empty"></div></div>
                <div className="hp-box max-hp"><div className="box-label">MAX HIT POINTS</div><div className="box-value">{character.hp.max}</div></div>
                <div className="hp-box temp-hp"><div className="box-label">TEMP HIT POINTS</div><div className="box-value-empty"></div></div>
            </div>
            <div className="vitals-lower-row">
                <div className="vital-box hit-dice">
                    <div className="box-label">HIT DICE</div>
                    <div className="hd-val">{character.hitDice.total}</div>
                    <div className="hd-dots-grid">{Array.from({ length: level }).map((_, i) => <span key={i}>{SVGs.dot}</span>)}</div>
                </div>
                <div className="vital-box death-saves">
                    <div className="box-label">DEATH SAVES</div>
                    <div className="ds-container">
                        <div className="ds-row">SUCC {SVGs.diamond} {SVGs.diamond} {SVGs.diamond}</div>
                        <div className="ds-row">FAIL {SVGs.diamond} {SVGs.diamond} {SVGs.diamond}</div>
                    </div>
                </div>
            </div>
        </div>
    </>
);

const AttacksTable = ({ character, actions }: { character: ICharacter; actions: CharacterAction[] }) => (
    <div className="section-card">
        <div className="section-title">ATTACKS & SPELLCASTING</div>
        <table className="grid-table">
            <thead><tr><th style={{ width: '21%' }}>NAME</th><th style={{ width: '10%' }}>HIT/DC</th><th style={{ width: '23%' }}>DAMAGE/TYPE</th><th style={{ width: '18%' }}>PROPERTIES</th><th style={{ width: '28%' }}>MASTERY/NOTES</th></tr></thead>
            <tbody>
                {actions.map((atk, i) => (
                    <tr key={i}>
                        <td className="font-serif"><b>{atk.name}</b></td>
                        <td className="center"><b>{atk.bonus}</b></td>
                        <td style={{ fontSize: '7.2pt' }}><b>{formatDamage(character, atk)}</b></td>
                        <td className="notes-cell">{atk.sourceType === 'spell' ? 'Cantrip' : (atk.properties?.join(', ') || '---')}</td>
                        <td className="notes-cell">
                            {atk.notes ? (
                                atk.notes.includes(': ') ? (
                                    <><b>{atk.notes.split(': ')[0]}</b>: {atk.notes.split(': ').slice(1).join(': ')}</>
                                ) : atk.notes
                            ) : (atk.properties?.join(', ') || '---')}
                        </td>
                    </tr>
                ))}
                {Array.from({ length: Math.max(0, 4 - actions.length) }).map((_, i) => <tr key={`empty-${i}`}><td colSpan={5}>&nbsp;</td></tr>)}
            </tbody>
        </table>
    </div>
);

const FeaturesBlock = ({ character }: { character: ICharacter }) => {
    const groupedFeatures = useMemo(() => {
        const groups: Record<string, Feature[]> = {};
        if (!character.featuresAndTraits) return groups;
        character.featuresAndTraits.filter(f => !f.isAction).forEach(f => {
            const cat = f.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(f);
        });
        return groups;
    }, [character.featuresAndTraits]);

    return (
        <div className="section-card">
            <div className="section-title">FEATURES & TRAITS</div>
            <div className="features-container">
                {FEATURE_CATEGORIES.map(cat => {
                    const list = groupedFeatures[cat];
                    if (!list || list.length === 0) return null;
                    return (
                        <div key={cat} className="feature-group">
                            <div className="group-label">{CATEGORY_LABELS[cat] || 'OTHER FEATURES'}</div>
                            {list.map((f, i) => (
                                <div key={i} className="feature-item-v14">
                                    <div className="feat-header">
                                        <span className="font-serif feat-name">{f.name}</span>
                                        {f.recovery && <span className="feat-recovery">Recover: {f.recovery === 'short' ? 'Short' : 'Long'} Rest</span>}
                                    </div>
                                    <div className="feat-desc">{f.description}</div>
                                    {f.uses && f.uses.max > 0 && <div className="feature-tracker">{Array.from({ length: f.uses.max }).map((_, idx) => <span key={idx}>{SVGs.diamond}</span>)}</div>}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/** Pagina 1: intestazione, caratteristiche, parametri vitali, attacchi e privilegi. */
export const PrintPageCore = ({ character }: { character: ICharacter }) => {
    const actions = useMemo(() => getAllActions(character), [character]);
    const pb = getPrintProficiency(character);
    const level = getPrintLevel(character);

    return (
        <div className="page">
            <PrintHeader character={character} level={level} />
            <div className="main-content">
                <AbilitiesColumn character={character} pb={pb} />
                <div className="right-col">
                    <VitalsBlock character={character} pb={pb} level={level} />
                    <AttacksTable character={character} actions={actions} />
                    <FeaturesBlock character={character} />
                </div>
            </div>
        </div>
    );
};
