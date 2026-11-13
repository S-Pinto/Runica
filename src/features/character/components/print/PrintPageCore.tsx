import { ReactNode, useMemo } from 'react';
import { ICharacter, Feature, CATEGORY_CONFIG } from '../../characterTypes';
import { calculateArmorClass } from '../../rules/combat';
import { buildCharacterActions, formatActionDamage, formatActionHit, type ResolvedAction } from '../../rules/attacks';
import { isShield } from '../../rules/equipment';
import { weaponPropertyLabel } from '../../utils/itemLabels';
import { WEAPON_MASTERIES } from '../../../../data/weaponProperties';
import { ABILITY_LABELS, skillLabel } from '../../../../lib/labels';
import { SVGs } from './printStyles';
import { Box } from './PrintBox';
import { AbilityEmblem, InspirationStar, LevelMedallion, Pillars, RuleOrnament, ShieldFrame } from './PrintOrnaments';
import { ABILITY_KEYS, fmtMod, getMod, getPrintLevel, getPrintProficiency } from './printUtils';

/** Note della riga d'attacco: tipo di fonte, maestria, proprietà, danno a due mani. */
const actionNotes = (a: ResolvedAction) => {
    if (a.source === 'spell') return 'Trucchetto';
    if (a.source === 'feat') return 'Privilegio';
    return [
        a.mastery && (WEAPON_MASTERIES[a.mastery]?.name ?? a.mastery),
        ...a.properties.map(weaponPropertyLabel),
        a.versatileDamage && `2 mani ${a.versatileDamage}`,
        a.source === 'item' && a.notes,
    ].filter(Boolean).join(', ');
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

/** n rombi, i primi `on` pieni (risorse spese, tiri contro la morte segnati). */
const Diamonds = ({ n, on = 0 }: { n: number; on?: number }) => <>{Array.from({ length: n }).map((_, i) => <span key={i}>{i < on ? SVGs.diamondFilled : SVGs.diamond}</span>)}</>;

const Head = ({ character, level, hasShield, filled }: { character: ICharacter; level: number; hasShield: boolean; filled: boolean }) => (
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
                    <div className="hp-col"><div className="v">{filled ? character.hp.current : ''}</div><div className="lbl">Attuali</div></div>
                    <div className="hp-col"><div className="v">{filled && character.hp.temporary ? character.hp.temporary : ''}</div><div className="lbl">Temp</div></div>
                    <div className="hp-col"><div className="v">{character.hp.max}</div><div className="lbl">Max</div></div>
                </div>
            </div>
            <div className="vit-cell">
                <div className="vit-title">Dadi vita</div>
                <div className="dv-slot">
                    <div className="row"><div className="lbl">Spesi</div><div className="v">{filled && character.hitDice?.used ? character.hitDice.used : ''}</div></div>
                    <div className="row"><div className="lbl">Max</div><div className="v">{character.hitDice?.total}</div></div>
                </div>
            </div>
            <div className="vit-cell">
                <div className="vit-title">Salvezza contro morte</div>
                <div className="ds-rows">
                    <div className="ds-row"><span className="diams"><Diamonds n={3} on={filled ? character.deathSaves?.successes : 0} /></span><span>Successi</span></div>
                    <div className="ds-row"><span className="diams"><Diamonds n={3} on={filled ? character.deathSaves?.failures : 0} /></span><span>Fallimenti</span></div>
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

const FeatureList = ({ list, filled }: { list: Feature[]; filled: boolean }) => (
    <div className="cols2">
        {list.map((f) => (
            <div key={f.id} className="feat">
                <div><span className="n serif">{f.name}</span>{f.recovery && f.recovery !== 'none' && <span className="rec">{f.recovery === 'short' ? 'Riposo breve' : 'Riposo lungo'}</span>}</div>
                <div className="d">{f.description}</div>
                {f.uses && f.uses.max > 0 && <div className="feat-pips"><Diamonds n={Math.min(f.uses.max, 12)} on={filled ? f.uses.max - f.uses.current : 0} /></div>}
            </div>
        ))}
    </div>
);

/** Pagina 1: intestazione, caratteristiche, parametri vitali, attacchi, privilegi, tratti e talenti.
 * `filled`: riporta i valori correnti (PF, dadi vita spesi, tiri contro la morte, usi spesi, ispirazione); altrimenti restano da compilare a matita. */
export const PrintPageCore = ({ character, filled }: { character: ICharacter; filled: boolean }) => {
    // Stesso motore della vista di gioco: totali per colpire, danni con modificatori, CD.
    const actions = useMemo(() => buildCharacterActions(character), [character]);
    const pb = getPrintProficiency(character);
    const level = getPrintLevel(character);
    const hasShield = !!character.equipment?.some((i) => i.equipped && isShield(i));

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
            <Head character={character} level={level} hasShield={hasShield} filled={filled} />
            <div className="p1-rule">
                <RuleOrnament />
                <div className="mark"><i className="gem" />RUNICA<i className="gem" /></div>
                <RuleOrnament flip />
            </div>
            <div className="p1-main">
                <div className="col col-a">
                    <Box className="pb-box"><Pillars /><div className="lbl">Bonus di competenza</div><div className="v">{fmtMod(pb)}</div></Box>
                    {(['strength', 'dexterity', 'constitution'] as const).map((a) => <AbilityCard key={a} character={character} ability={a} pb={pb} />)}
                    <Box className="insp-box"><div className="lbl">Ispirazione eroica</div><InspirationStar lit={filled && character.inspiration > 0} /></Box>
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
                                            <td>{a && (a.roll === 'none' ? '' : formatActionHit(a))}</td>
                                            <td>{a && formatActionDamage(a)}</td>
                                            <td style={{ fontSize: '5.6pt' }}>{a && actionNotes(a)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Box>
                    <Box title={CATEGORY_CONFIG.class.label} className="features-box">
                        <div className="box-body grid-split"><FeatureList list={groups.cls} filled={filled} /></div>
                    </Box>
                    <div className="row2">
                        <Box title={CATEGORY_CONFIG.racial.label}><div className="box-body grid-paper">{groups.species.length > 0 && <FeatureList list={groups.species} filled={filled} />}</div></Box>
                        <Box title="Talenti"><div className="box-body grid-paper">{groups.feats.length > 0 && <FeatureList list={groups.feats} filled={filled} />}</div></Box>
                    </div>
                </div>
            </div>
        </section>
    );
};
