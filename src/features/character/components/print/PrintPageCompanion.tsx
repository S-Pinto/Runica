import { ICompanion } from '../../characterTypes';
import { ABILITY_SHORT } from '../../../../lib/labels';
import { ABILITY_KEYS, fmtMod, getMod } from './printUtils';

/** Pagina aggiuntiva: una per ogni compagno / evocazione (solo se il personaggio ne ha). */
export const PrintPageCompanion = ({ companion }: { companion: ICompanion }) => (
    <section className="page">
        <header className="comp-head">
            <div className="n">{companion.name}</div>
            <div className="ty">{companion.type}</div>
        </header>
        <div className="comp-vitals">
            <div className="box stat-tile"><div className="lbl">CA</div><div className="v">{companion.armorClass || 10}</div></div>
            <div className="box stat-tile"><div className="lbl">Punti ferita</div><div className="v">{companion.hp?.max || 0}</div></div>
            <div className="box stat-tile"><div className="lbl">Velocità</div><div className="v">{companion.speed}</div></div>
        </div>
        <div className="comp-abil">
            {ABILITY_KEYS.map((key) => {
                const score = companion.abilityScores?.[key] || 10;
                return (
                    <div key={key} className="box stat-tile">
                        <div className="lbl">{ABILITY_SHORT[key]}</div>
                        <div className="v">{score}</div>
                        <div className="lbl">{fmtMod(getMod(score))}</div>
                    </div>
                );
            })}
        </div>
        <div className="box" style={{ flex: 1 }}>
            <div className="box-title">Azioni e tratti</div>
            <div className="box-body">
                {companion.attacks?.map((atk) => (
                    <div key={atk.id} className="comp-item">
                        <b>{atk.name}.</b> {atk.bonus && <i>Bonus: {atk.bonus}. </i>}<i>Danno:</i> {atk.damage}{atk.damageType ? ` ${atk.damageType}` : ''}.
                        {atk.properties && atk.properties.length > 0 && ` (${atk.properties.join(', ')})`}
                    </div>
                ))}
                {companion.featuresAndTraits?.map((f) => (
                    <div key={f.id} className="comp-item"><b>{f.name}.</b> {f.description}</div>
                ))}
                {companion.notes && <div className="comp-item"><span className="lbl">Note</span><br />{companion.notes}</div>}
            </div>
        </div>
    </section>
);
