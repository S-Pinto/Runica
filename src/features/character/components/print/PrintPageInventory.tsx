import { ICharacter, Currency } from '../../characterTypes';

const CURRENCY_KEYS: (keyof Currency)[] = ['cp', 'sp', 'ep', 'gp', 'pp'];

/** Pagina 3: monete, equipaggiamento, tratti di personalità e storia del personaggio. */
export const PrintPageInventory = ({ character }: { character: ICharacter }) => (
    <div className="page page-break">
        <div className="inventory-header"><div className="section-title">EQUIPMENT & CURRENCIES</div></div>
        <div className="inventory-content">
            <div className="inv-left">
                <div className="currency-card">
                    {CURRENCY_KEYS.map(curr => (
                        <div key={curr} className="curr-box">
                            <div className="curr-val">{character.currency?.[curr] || 0}</div>
                            <div className="curr-lab">{curr.toUpperCase()}</div>
                        </div>
                    ))}
                </div>
                <div className="equipment-list">
                    <table className="equip-table">
                        <thead><tr><th style={{ width: '10%' }}>QTY</th><th style={{ width: '30%' }}>ITEM NAME</th><th>DESCRIPTION/NOTES</th></tr></thead>
                        <tbody>
                            {character.equipment?.map((item, i) => (
                                <tr key={i}>
                                    <td className="center">{item.quantity}</td>
                                    <td className="font-serif"><b>{item.name}</b></td>
                                    <td className="small-text">{item.description}</td>
                                </tr>
                            ))}
                            {Array.from({ length: Math.max(0, 15 - (character.equipment?.length || 0)) }).map((_, i) => (
                                <tr key={`empty-${i}`}><td colSpan={3}>&nbsp;</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="inv-right">
                <div className="attribute-block"><div className="block-label">PERSONALITY TRAITS</div><div className="block-value">{character.personalityTraits}</div></div>
                <div className="attribute-block"><div className="block-label">IDEALS</div><div className="block-value">{character.ideals}</div></div>
                <div className="attribute-block"><div className="block-label">BONDS</div><div className="block-value">{character.bonds}</div></div>
                <div className="attribute-block"><div className="block-label">FLAWS</div><div className="block-value">{character.flaws}</div></div>
                <div className="biography-block">
                    <div className="section-title">CHARACTER BACKSTORY</div>
                    <div className="bio-text">{character.biography}</div>
                </div>
            </div>
        </div>
    </div>
);
