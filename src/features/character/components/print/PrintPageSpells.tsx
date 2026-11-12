import React, { useMemo } from 'react';
import { ICharacter } from '../../characterTypes';
import { SVGs } from './printStyles';
import { fmtMod, getMod, getPrintProficiency } from './printUtils';

/** Pagina 2: caratteristica da incantatore, slot, risorse personalizzate e lista incantesimi. */
export const PrintPageSpells = ({ character }: { character: ICharacter }) => {
    const sortedSpells = useMemo(() => {
        if (!character.spells) return [];
        return [...character.spells].sort((a, b) => (a.level || 0) - (b.level || 0));
    }, [character.spells]);

    const pb = getPrintProficiency(character);
    const hasCustomResources = character.customResources && character.customResources.length > 0;
    const spellAbility = character.spellcastingAbility || 'intelligence';
    const spellMod = getMod(character.abilityScores[spellAbility] || 10);
    const saveDC = 8 + pb + spellMod;
    const attackBonus = pb + spellMod;

    return (
        <div className="page page-break">
            <header className="spell-header-card">
                <div className="spell-field"><div className="field-val">{character.class}</div><div className="field-lab">CLASS</div></div>
                <div className="spell-field"><div className="field-val">{spellAbility.toUpperCase()}</div><div className="field-lab">ABILITY</div></div>
                <div className="spell-field"><div className="field-val">{saveDC}</div><div className="field-lab">SAVE DC</div></div>
                <div className="spell-field"><div className="field-val">{fmtMod(attackBonus)}</div><div className="field-lab">BONUS</div></div>
            </header>
            <div className="spells-content">
                <div className="spells-left">
                    <div className="section-card" style={{ padding: '4mm' }}>
                        <div className="section-title">SPELL SLOTS</div>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
                            const max = character.spellSlots?.[lv]?.max || 0;
                            if (max === 0) return null;
                            return (
                                <div key={lv} className="slot-row">
                                    <div className="lvl-label" style={{ fontWeight: 900, minWidth: '4mm' }}>{lv}</div>
                                    <div className="slot-diamonds">{Array.from({ length: max }).map((_, i) => <span key={i}>{SVGs.diamond}</span>)}</div>
                                </div>
                            );
                        })}
                    </div>
                    {hasCustomResources && (
                        <div className="section-card" style={{ padding: '4mm', marginTop: '6mm' }}>
                            <div className="section-title">CUSTOM RESOURCES</div>
                            {character.customResources.map((res, i) => (
                                <div key={i} className="res-row">
                                    <span className="font-serif res-name">{res.name}</span>
                                    <div className="res-tracker">{Array.from({ length: res.max }).map((_, idx) => <span key={idx}>{SVGs.diamond}</span>)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="spells-right">
                    <div className="section-card">
                        <div className="section-title">CANTRIPS & SPELLS</div>
                        <table className="spell-detail-table">
                            <thead><tr><th style={{ width: '5%' }}>LVL</th><th style={{ width: '30%' }}>NAME</th><th style={{ width: '20%' }}>TIME</th><th style={{ width: '20%' }}>RANGE</th><th style={{ width: '25%' }}>DURATION/COMP</th></tr></thead>
                            <tbody>
                                {sortedSpells.map((s, i) => (
                                    <React.Fragment key={i}>
                                        <tr className="spell-main-row">
                                            <td className="lv-cell">{s.level}</td>
                                            <td className="font-serif"><b>{s.name}</b></td>
                                            <td>{s.castingTime}</td><td>{s.range}</td><td>{s.duration}{s.components ? ` (${s.components})` : ''}</td>
                                        </tr>
                                        <tr className="spell-desc-row"><td colSpan={5} className="spell-desc-cell">{s.description}</td></tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
