import { ICompanion } from '../../characterTypes';
import { ABILITY_KEYS, fmtMod, getMod } from './printUtils';

/** Pagina 4+: una pagina per ogni compagno / evocazione. */
export const PrintPageCompanion = ({ companion }: { companion: ICompanion }) => (
    <div className="page page-break">
        <header className="companion-header">
            <div className="section-title">COMPANION / SUMMON</div>
            <div className="comp-name-row">
                <div className="comp-name font-serif">{companion.name}</div>
                <div className="comp-type">{companion.type}</div>
            </div>
        </header>
        <div className="companion-content">
            <div className="comp-left">
                <div className="comp-vitals">
                    <div className="comp-vital-box"><div className="box-label">AC</div><div className="box-value">{companion.armorClass || 10}</div></div>
                    <div className="comp-vital-box"><div className="box-label">HP</div><div className="box-value">{companion.hp?.max || 0}</div></div>
                    <div className="comp-vital-box"><div className="box-label">SPEED</div><div className="box-value">{companion.speed || '30ft'}</div></div>
                </div>
                <div className="comp-abilities">
                    {ABILITY_KEYS.map(key => (
                        <div key={key} className="comp-ability">
                            <div className="ab-lab">{key.substring(0, 3).toUpperCase()}</div>
                            <div className="ab-val">{companion.abilityScores?.[key] || 10} ({fmtMod(getMod(companion.abilityScores?.[key] || 10))})</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="comp-right">
                <div className="comp-actions">
                    <div className="section-title">ACTIONS & TRAITS</div>
                    {companion.attacks?.map((atk, idx) => (
                        <div key={idx} className="comp-action-item">
                            <b>{atk.name}.</b> {atk.bonus ? <i>Hit: {atk.bonus}. </i> : ''} <i>Damage:</i> {atk.damage}. {atk.properties && atk.properties.length > 0 && `(${atk.properties.join(', ')})`}
                        </div>
                    ))}
                    {companion.featuresAndTraits?.map((f, idx) => (
                        <div key={idx} className="comp-action-item"><b>{f.name}.</b> {f.description}</div>
                    ))}
                    {companion.notes && <div className="comp-notes"><div className="block-label">NOTES</div><div className="small-text">{companion.notes}</div></div>}
                </div>
            </div>
        </div>
    </div>
);
