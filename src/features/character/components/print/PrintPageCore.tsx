import { ReactNode, useMemo } from 'react';
import { ICharacter, Feature, CATEGORY_CONFIG } from '../../characterTypes';
import { getAllActions, calculateArmorClass, CharacterAction } from '../../rules/combat';
import { ABILITY_LABELS, skillLabel } from '../../../../lib/labels';
import { SVGs } from './printStyles';
import { Box } from './PrintBox';
import { AbilityEmblem, InspirationStar, LevelMedallion, Pillars, RuleOrnament, ShieldFrame } from './PrintOrnaments';
import { ABILITY_KEYS, fmtMod, getMod, getPrintLevel, getPrintProficiency } from './printUtils';

const formatDamage = (character: ICharacter, atk: CharacterAction) => {
    const mod = atk.damageAbility ? getMod(character.abilityScores[atk.damageAbility as keyof typeof character.abilityScores]) : 0;
    const parts = [`${atk.damage}${mod !== 0 ? fmtMod(mod) : ''} ${atk.damageType || ''}`.trim()];
    atk.additionalDamage?.forEach((e) => parts.push(`${e.formula} ${e.type}`));
    return parts.join(' + ');
};

const Field = ({ label, value, className = '' }: { label: string; value?: string | number; className?: string }) => (
    <div className={`id-field ${className}`}>
        <div className="lbl">{label}</div>
        <div className="v ell">{value}</div>
    </div>
);

const Stat = ({ label, value }: { label: string; value?: ReactNode }) => (
    <Box className="stat-tile">
        <Pillars />
        <div className="lbl">{label}</div>
        <div className="v">{value}</div>
    </Box>
);

const Head = ({ character, level, hasShield }: { character: ICharacter; level: number; hasShield: boolean }) => (
    <header className="p1-head">
        <Box className="id-box">
            <Field label="Nome del personaggio" value={character.name} className="id-name" />
            <Field label="Background" value={character.background} />
            <Field label="Classe" value={character.class} />
            <Field label="Specie" value={character.race} />
            <Field label="Sottoclasse" value={character.subclass} />
            <div className="level-medal">
                <LevelMedallion />
                <div className="lbl">Livello</div>
                <div className="big">{level}</div>
                <div className="sub">{character.experiencePoints || ''}</div>
                <div className="lbl">PE</div>
            </div>
        </Box>
        <Box className="ac-box">
            <div className="lbl">Classe Armatura</div>
            <div className="ac-art"><ShieldFrame /><b>{calculateArmorClass(character)}</b></div>
            <div className="ac-shield-row">{hasShield ? SVGs.diamondFilled : SVGs.diamond} SCUDO</div>
        </Box>
        <Box className="vit-box">
            <div className="vit-cell">
                <div className="vit-title">Punti ferita</div>
                <div className="hp-cols">
                    <div className="hp-col"><div className="v" /><div className="lbl">Attuali</div></div>
                    <div className="hp-col"><div className="v" /><div className="lbl">Temp</div></div>
                    <div className="hp-col"><div className="v">{character.hp.max}</div><div className="lbl">Max</div></div>
                </div>
            </div>
            <div className="vit-cell">
                <div className="vit-title">Dadi vita</div>
                <div className="dv-slot">
                    <div className="row"><div className="lbl">Spesi</div></div>
                    <div className="row"><div className="lbl">Max</div><div className="v">{character.hitDice?.total}</div></div>
                </div>
            </div>
            <div className="vit-cell">
                <div className="vit-title">Salvezza contro morte</div>
                <div className="ds-rows">
                    <div className="ds-row"><span className="diams">{SVGs.diamond}{SVGs.diamond}{SVGs.diamond}</span><span>Successi</span></div>
                    <div className="ds-row"><span className="diams">{SVGs.diamond}{SVGs.diamond}{SVGs.diamond}</span><span>Fallimenti</span></div>
                </div>
            </div>
        </Box>
    </header>
);

const AbilityCard = ({ character, ability, pb }: { character: ICharacter; ability: (typeof ABILITY_KEYS)[number]; pb: number }) => {
    const score = character.abilityScores[ability];
    const mod = getMod(score);
    const saveProf = !!character.savingThrows?.[ability]?.proficient;
    return (
        <Box className="ab-card">
            <div className="ab-name">{ABILITY_LABELS[ability]}</div>
            <AbilityEmblem mod={fmtMod(mod)} score={score} />
            <ul className="ab-rows">
                <li className="save"><i className={`dot ${saveProf ? 'on' : ''}`} /><b>{fmtMod(mod + (saveProf ? pb : 0))}</b><span>Tiro salvezza</span></li>
                {character.skills.filter((s) => s.ability === ability).map((s) => (
                    <li key={s.name}>
                        <i className={`dot ${s.proficient || s.expertise ? 'on' : ''}`} />
                        <b>{fmtMod(mod + (s.expertise ? pb * 2 : s.proficient ? pb : 0))}</b>
                        <span>{skillLabel(s.name)}</span>
                    </li>
                ))}
            </ul>
        </Box>
    );
};

const FeatureList = ({ list }: { list: Feature[] }) => (
    <div className="cols2">
        {list.map((f) => (
            <div key={f.id} className="feat">
                <div><span className="n serif">{f.name}</span>{f.recovery && f.recovery !== 'none' && <span className="rec">{f.recovery === 'short' ? 'Riposo breve' : 'Riposo lungo'}</span>}</div>
                <div className="d">{f.description}</div>
                {f.uses && f.uses.max > 0 && <div className="feat-pips">{Array.from({ length: Math.min(f.uses.max, 12) }).map((_, i) => <span key={i}>{SVGs.diamond}</span>)}</div>}
            </div>
        ))}
    </div>
);

/** Pagina 1: intestazione, caratteristiche, parametri vitali, attacchi, privilegi, tratti e talenti. */
export const PrintPageCore = ({ character }: { character: ICharacter }) => {
    const actions = useMemo(() => getAllActions(character), [character]);
    const pb = getPrintProficiency(character);
    const level = getPrintLevel(character);
    const hasShield = !!character.equipment?.some((i) => i.equipped && i.armorType === 'shield');

    const groups = useMemo(() => {
        const feats = (character.featuresAndTraits || []).filter((f) => !f.isAction);
        return {
            cls: feats.filter((f) => f.category === 'class' || !f.category),
            species: feats.filter((f) => f.category === 'racial'),
            feats: feats.filter((f) => f.category?.startsWith('feat-')),
        };
    }, [character.featuresAndTraits]);

    const perception = character.skills.find((s) => s.name === 'Perception');
    const passive = 10 + getMod(character.abilityScores.wisdom) + (perception?.expertise ? pb * 2 : perception?.proficient ? pb : 0);
    const weaponRows = Math.max(5, actions.length);

    return (
        <section className="page">
            <Head character={character} level={level} hasShield={hasShield} />
            <div className="p1-rule">
                <RuleOrnament />
                <div className="mark"><i className="gem" />RUNICA<i className="gem" /></div>
                <RuleOrnament flip />
            </div>
            <div className="p1-main">
                <div className="col col-a">
                    <Box className="pb-box"><Pillars /><div className="lbl">Bonus di competenza</div><div className="v">{fmtMod(pb)}</div></Box>
                    {(['strength', 'dexterity', 'constitution'] as const).map((a) => <AbilityCard key={a} character={character} ability={a} pb={pb} />)}
                    <Box className="insp-box"><div className="lbl">Ispirazione eroica</div><InspirationStar /></Box>
                </div>
                <div className="col col-b">
                    {(['intelligence', 'wisdom', 'charisma'] as const).map((a) => <AbilityCard key={a} character={character} ability={a} pb={pb} />)}
                </div>
                {/* Come nel modulo 2024: il riquadro occupa la larghezza delle due colonne di caratteristiche. */}
                <Box title="Addestramento e competenze" className="training-box">
                    <div className="training-row"><span className="lbl">Armature</span>{['Leggere', 'Medie', 'Pesanti', 'Scudi'].map((l) => <span key={l}>{SVGs.diamond}{l}</span>)}</div>
                    <div className="training-sec"><span className="lbl">Armi</span><div className="fill blank-lines" /></div>
                    <div className="training-sec"><span className="lbl">Strumenti</span><div className="fill blank-lines" /></div>
                </Box>
                <div className="col col-c">
                    <div className="tiles4">
                        <Stat label="Iniziativa" value={fmtMod(getMod(character.abilityScores.dexterity))} />
                        <Stat label="Velocità" value={`${Math.round(character.speed * 0.3)} m`} />
                        <Stat label="Taglia" value="" />
                        <Stat label="Percezione passiva" value={passive} />
                    </div>
                    <Box title="Armi e trucchetti di danno" className="weapons-box">
                        <table className="sheet-table">
                            <thead><tr><th style={{ width: '30%' }}>Nome</th><th style={{ width: '14%' }}>Bonus / CD</th><th style={{ width: '30%' }}>Danno e tipo</th><th>Note</th></tr></thead>
                            <tbody>
                                {Array.from({ length: weaponRows }).map((_, i) => {
                                    const a = actions[i];
                                    return (
                                        <tr key={i}>
                                            <td className="serif"><b>{a?.name}</b></td>
                                            <td>{a?.bonus}</td>
                                            <td>{a && formatDamage(character, a)}</td>
                                            <td style={{ fontSize: '5.6pt' }}>{a && (a.sourceType === 'spell' ? 'Trucchetto' : a.mastery || a.properties?.join(', '))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Box>
                    <Box title={CATEGORY_CONFIG.class.label} className="features-box">
                        <div className="box-body grid-split"><FeatureList list={groups.cls} /></div>
                    </Box>
                    <div className="row2">
                        <Box title={CATEGORY_CONFIG.racial.label}><div className="box-body grid-paper">{groups.species.length > 0 && <FeatureList list={groups.species} />}</div></Box>
                        <Box title="Talenti"><div className="box-body grid-paper">{groups.feats.length > 0 && <FeatureList list={groups.feats} />}</div></Box>
                    </div>
                </div>
            </div>
        </section>
    );
};
