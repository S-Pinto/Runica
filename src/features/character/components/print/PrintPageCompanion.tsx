import { ReactNode } from 'react';
import { ICompanion } from '../../characterTypes';
import { ABILITY_LABELS, skillLabel } from '../../../../lib/labels';
import { Box } from './PrintBox';
import { AbilityEmblem, Pillars, RuleOrnament, ShieldFrame } from './PrintOrnaments';
import { ABILITY_KEYS, fmtMod, getMod } from './printUtils';

const ATTACK_ROWS = 6;

const Vital = ({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) => (
    <Box className={`stat-tile comp-vital ${className}`}>
        <Pillars />
        <div className="lbl">{label}</div>
        {children}
    </Box>
);

/** Pagina aggiuntiva: una per ogni compagno / evocazione (solo se il personaggio ne ha). Stesso linguaggio grafico delle pagine 1-2. */
export const PrintPageCompanion = ({ companion, ownerName }: { companion: ICompanion; ownerName?: string }) => {
    const skills = (companion.skills || []).filter((s) => s.proficient || s.expertise);
    const attackRows = Math.max(ATTACK_ROWS, companion.attacks?.length || 0);
    const items = (companion.equipment || []).map((it) => `${it.quantity > 1 ? `${it.quantity}× ` : ''}${it.name}`);
    const spells = (companion.spells || []).map((s) => s.name);

    return (
        <section className="page">
            <Box className="comp-id">
                <div className="comp-id-row">
                    <div className="id-field comp-name"><div className="lbl">Nome del compagno</div><div className="v ell">{companion.name}</div></div>
                    <div className="id-field comp-type"><div className="lbl">Tipo</div><div className="v ell">{companion.type}</div></div>
                    <div className="id-field comp-owner"><div className="lbl">Compagno di</div><div className="v ell">{ownerName}</div></div>
                </div>
            </Box>
            <div className="p1-rule">
                <RuleOrnament />
                <div className="mark"><i className="gem" />COMPAGNO<i className="gem" /></div>
                <RuleOrnament flip />
            </div>

            <div className="comp-vitals">
                <Box className="ac-box comp-ac">
                    <div className="lbl">Classe Armatura</div>
                    <div className="ac-art"><ShieldFrame /><b>{companion.armorClass || 10}</b></div>
                </Box>
                <Box className="vit-box comp-hp">
                    <div className="vit-cell">
                        <div className="vit-title">Punti ferita</div>
                        <div className="hp-cols">
                            <div className="hp-col"><div className="v" /><div className="lbl">Attuali</div></div>
                            <div className="hp-col"><div className="v" /><div className="lbl">Temp</div></div>
                            <div className="hp-col"><div className="v">{companion.hp?.max || ''}</div><div className="lbl">Max</div></div>
                        </div>
                    </div>
                </Box>
                <Vital label="Velocità"><div className="v">{companion.speed}</div></Vital>
            </div>

            <div className="comp-abil">
                {ABILITY_KEYS.map((key) => {
                    const score = companion.abilityScores?.[key] || 10;
                    return (
                        <Box key={key} className="ab-card comp-ab">
                            <div className="ab-name">{ABILITY_LABELS[key]}</div>
                            <AbilityEmblem mod={fmtMod(getMod(score))} score={score} />
                        </Box>
                    );
                })}
            </div>

            <Box title="Attacchi" className="weapons-box">
                <table className="sheet-table">
                    <thead><tr><th style={{ width: '30%' }}>Nome</th><th style={{ width: '14%' }}>Bonus / CD</th><th style={{ width: '30%' }}>Danno e tipo</th><th>Note</th></tr></thead>
                    <tbody>
                        {Array.from({ length: attackRows }).map((_, i) => {
                            const a = companion.attacks?.[i];
                            return (
                                <tr key={i}>
                                    <td className="serif"><b>{a?.name}</b></td>
                                    <td>{a?.bonus}</td>
                                    <td>{a && `${a.damage}${a.damageType ? ` ${a.damageType}` : ''}`}</td>
                                    <td style={{ fontSize: '5.6pt' }}>{a?.properties?.join(', ')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Box>

            <div className="comp-bottom">
                <Box title="Tratti e capacità" className="comp-traits">
                    <div className="box-body grid-paper">
                        <div className="comp-cols">
                            {companion.featuresAndTraits?.map((f) => (
                                <div key={f.id} className="feat"><span className="n serif">{f.name}</span><div className="d comp-d">{f.description}</div></div>
                            ))}
                        </div>
                    </div>
                </Box>
                <div className="comp-side">
                    <Box title="Competenze" className="comp-small">
                        <div className="box-body grid-paper comp-text">
                            {skills.map((s) => skillLabel(s.name)).join(', ')}
                            {spells.length > 0 && <><div className="lbl" style={{ marginTop: '1mm' }}>Incantesimi</div>{spells.join(', ')}</>}
                        </div>
                    </Box>
                    <Box title="Equipaggiamento" className="comp-small">
                        <div className="box-body grid-paper comp-text">{items.join(', ')}</div>
                    </Box>
                    <Box title="Note" className="comp-notes">
                        <div className="box-body grid-paper comp-text" style={{ whiteSpace: 'pre-wrap' }}>{companion.notes}</div>
                    </Box>
                </div>
            </div>
            <div className="p-foot"><span>Runica · {companion.name}</span><span>Compagno</span></div>
        </section>
    );
};
