import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getCharacter, getAllActions, calculateArmorClass } from '../../characterService';
import { ICharacter } from '../../characterTypes';
import { generateCharacterPDF } from '../../../../api/characterApi';
import React from 'react';

const CATEGORY_LABELS: any = {
    'class': 'CLASS FEATURES',
    'racial': 'RACIAL TRAITS',
    'feat-origin': 'ORIGIN FEATS',
    'feat-general': 'GENERAL FEATS',
    'feat-combat': 'COMBAT FEATS',
    'feat-epic': 'EPIC FEATS',
};

const SharedStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@700;900&display=swap');

    :root {
        --black: #000;
        --white: #ffffff;
        --gray-light: #f9f9f9;
        --gray-medium: #666;
        --gray-border: #bbb;
    }

    .dnd-sheet-wrapper {
        background: #f0f0f0;
        padding: 40px 20px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        font-family: 'Inter', sans-serif;
    }

    .print-controls {
        background: white;
        padding: 15px 30px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex;
        gap: 20px;
        align-items: center;
        position: sticky;
        top: 20px;
        z-index: 100;
        width: 210mm;
    }

    .download-btn {
        background: #b91c1c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .download-btn:disabled { background: #999; cursor: not-allowed; }

    .page {
        width: 210mm;
        height: 297mm;
        padding: 10mm;
        background: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.2);
        position: relative;
        overflow: hidden;
        margin-bottom: 20mm;
        font-size: 7.5pt;
        line-height: 1.2;
        color: var(--black);
    }

    .page-break { page-break-before: always; }

    .font-serif { font-family: 'Libre Baskerville', serif; }
    .center { text-align: center; }

    /* HEADER */
    .char-header { display: flex; gap: 6mm; margin-bottom: 6mm; align-items: flex-end; }
    .portrait-container { width: 32mm; height: 42mm; border: 2px solid #000; border-radius: 4px; overflow: hidden; background: #f9f9f9; flex-shrink: 0; }
    .portrait-img { width: 100%; height: 100%; object-fit: cover; }
    .portrait-placeholder { width: 100%; height: 100%; padding: 4mm; display: flex; align-items: center; justify-content: center; }
    .header-info { flex: 1; }
    
    .name-level-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm; }
    .name-field { flex: 1; border-bottom: 2px solid #000; padding-bottom: 1mm; }
    .name-field .field-value { font-family: 'Playfair Display', serif; font-size: 26pt; font-weight: 900; line-height: 1; }
    .level-badge { background: #000; border-radius: 4px; padding: 2mm 5mm; color: #fff; text-align: center; box-shadow: 2px 2px 0 #bbb; margin-left: 4mm; }
    .lvl-val { font-family: 'Libre Baskerville', serif; font-size: 20pt; font-weight: 700; }

    .meta-row { display: flex; gap: 4mm; margin-top: 2mm; border-bottom: 1.5px solid #000; padding-bottom: 1.5mm; }
    .header-field { flex: 1; display: flex; flex-direction: column-reverse; }
    .meta-row .field-value { font-family: 'Libre Baskerville', serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; }
    .field-label { font-size: 6pt; font-weight: 950; color: #666; text-transform: uppercase; margin-top: 0.5mm; }

    /* HP & VITALS */
    .vitals-row { display: flex; gap: 2.5mm; margin-bottom: 3.5mm; }
    .vital-card { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 1.5mm; text-align: center; }
    .shield-container { position: relative; width: 14mm; height: 16mm; margin: 0 auto; }
    .shield-container .vital-value { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); font-size: 15pt; font-weight: 900; font-family: 'Libre Baskerville'; }
    .vital-value-frame { font-size: 14pt; font-weight: 900; height: 10mm; display: flex; align-items: center; justify-content: center; }
    .hp-vitals-container { display: flex; flex-direction: column; gap: 3mm; margin-bottom: 3.5mm; }
    .hp-row { display: flex; gap: 3mm; }
    .hp-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 1.5mm; display: flex; flex-direction: column; align-items: center; }
    .hp-box .box-value { font-size: 14pt; margin: 0.5mm 0; }
    .box-label { font-size: 6pt; font-weight: 800; color: #666; margin-bottom: 1mm; text-align: center; text-transform: uppercase; }
    .box-value { font-family: 'Libre Baskerville', serif; font-size: 16pt; font-weight: 900; margin: 0.5mm 0; }
    .vitals-lower-row { display: flex; gap: 3mm; }
    .vital-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 1.5mm; text-align: center; position: relative; }
    .hit-dice .hd-val { font-family: 'Libre Baskerville', serif; font-size: 12pt; font-weight: 900; margin-bottom: 1mm; }
    .hd-dots-grid { display: flex; flex-wrap: wrap; gap: 0.5mm; justify-content: center; align-items: center; min-height: 7mm; padding: 1mm; }
    .ds-container { display: flex; flex-direction: column; gap: 1mm; margin-top: 1.5mm; }
    .ds-row { font-size: 6.5pt; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 1mm; }

    /* SECTION CARDS */
    .section-card { border: 2px solid #000; border-radius: 4px; padding: 2.5mm; margin-bottom: 4mm; }
    .section-title { font-weight: 900; font-size: 7.5pt; background: #000; color: #fff; padding: 0.8mm 1.5mm; border-radius: 2px; margin-bottom: 2mm; display: inline-block; text-transform: uppercase; }
    
    /* ABILITIES & SKILLS */
    .abilities-vertical { display: flex; flex-direction: column; gap: 2mm; }
    .ability-card-v9 { border: 2px solid #000; border-radius: 4px; padding: 1mm; background: #fff; box-shadow: 2px 2px 0 #eee; display: flex; flex-direction: column; overflow: visible; }
    .ability-label-v9 { font-size: 6.5pt; font-weight: 950; color: #000; letter-spacing: 0.3pt; margin-bottom: 1.2mm; padding-left: 1mm; border-bottom: 1px solid #ddd; padding-bottom: 0.5mm; }
    .ability-body-v9 { display: flex; align-items: stretch; gap: 2.5mm; }
    .ability-header-v9 { position: relative; width: 14.5mm; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
    .mod-container-v9 { position: relative; width: 14mm; height: 16mm; }
    .mod-value-v9 { position: absolute; top: 48%; left: 50%; transform: translate(-50%, -50%); font-family: 'Libre Baskerville', serif; font-size: 15pt; font-weight: 900; }
    .score-bubble-v9 { position: absolute; bottom: -1mm; background: #fff; border: 1.5px solid #000; border-radius: 10px; padding: 0.2mm 1.5mm; z-index: 10; min-width: 9mm; text-align: center; box-shadow: 1px 1px 0 #bbb; }
    .score-val-v9 { font-size: 8.5pt; font-weight: 800; line-height: 1; }
    .ability-details-v9 { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .save-row-v9 { display: flex; align-items: center; gap: 1.5mm; margin-bottom: 1.5mm; font-weight: 850; font-size: 6.2pt; border-bottom: 1.8px solid #000; padding-bottom: 0.8mm; color: #000; }
    .skills-list-v9 { display: flex; flex-direction: column; gap: 0.3mm; }
    .skill-row { display: flex; align-items: center; gap: 1.5mm; font-size: 6.4pt; line-height: 1.1; margin-bottom: 0.4mm; }
    .skill-name-v8 { font-weight: 600; color: #000; }
    .prof-indicator { width: 2mm; height: 2mm; border: 1px solid #000; border-radius: 50%; flex-shrink: 0; }
    .prof-indicator.filled { background: #000; }
    .skill-val { width: 4.5mm; text-align: right; font-weight: 800; color: #000; }

    /* PB BADGE */
    .pb-container-v15 { position: relative; width: 22mm; height: 22mm; margin: 0 auto 4mm; display: flex; align-items: center; justify-content: center; }
    .pb-badge-v15 { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2; }
    .pb-value-v15 { font-family: 'Libre Baskerville', serif; font-size: 18pt; font-weight: 900; line-height: 1; margin-top: 1mm; }
    .pb-label-v15 { font-size: 5pt; font-weight: 950; color: #666; text-transform: uppercase; letter-spacing: 0.2pt; }
    .pb-svg-frame { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }

    /* LAYOUTS */
    .main-content { display: grid; grid-template-columns: 55mm 1fr; gap: 6mm; }
    .grid-table { width: 100%; border-collapse: collapse; }
    .grid-table th { text-align: left; font-size: 5.2pt; font-weight: 950; color: #666; border-bottom: 1px solid #000; padding: 0.5mm 0; }
    .grid-table td { padding: 1.8mm 0.5mm; border-bottom: 1px solid #eee; font-size: 7.2pt; vertical-align: top; }
    .notes-cell { font-size: 6.2pt; color: #444; line-height: 1.1; padding-top: 2mm !important; }

    .features-container { column-count: 2; column-gap: 4mm; column-fill: auto; }
    .feature-group { break-inside: avoid; margin-bottom: 4mm; }
    .group-label { font-size: 6pt; font-weight: 950; color: #666; letter-spacing: 0.4pt; border-bottom: 1.2px solid #000; padding-bottom: 0.5mm; margin-bottom: 1.5mm; text-transform: uppercase; }
    .feature-item-v14 { margin-bottom: 2.5mm; break-inside: avoid; }
    .feat-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.2mm; position: relative; }
    .feat-name { font-weight: 750; font-size: 7.8pt; color: #000; }
    .feat-recovery { font-size: 5.8pt; font-weight: 850; color: #666; text-transform: uppercase; }
    .feat-desc { font-size: 6.8pt; line-height: 1.2; color: #333; }
    .feature-tracker { display: flex; flex-wrap: wrap; gap: 0.5mm; margin-top: 1mm; }

    /* SPELLS PAGE */
    .spell-header-card { display: flex; gap: 4mm; border: 2px solid #000; border-radius: 4px; padding: 3mm; margin-bottom: 6mm; background: #f9f9f9; }
    .spell-field { flex: 1; text-align: center; border-right: 1px solid #ddd; }
    .spell-field:last-child { border-right: none; }
    .field-lab { font-size: 6pt; font-weight: 900; color: #666; margin-top: 1mm; text-transform: uppercase; }
    .field-val { font-family: 'Libre Baskerville'; font-size: 14pt; font-weight: 900; }
    .spells-content { display: grid; grid-template-columns: 50mm 1fr; gap: 6mm; }
    .slot-row { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; padding: 1mm; border-bottom: 1px solid #eee; }
    .slot-diamonds { display: flex; gap: 1mm; }
    .spell-detail-table { width: 100%; border-collapse: collapse; }
    .spell-detail-table th { text-align: left; font-size: 5.5pt; font-weight: 950; color: #666; border-bottom: 1px solid #000; padding-bottom: 1mm; }
    .spell-main-row td { padding: 1.5mm 0.5mm 0.5mm 0.5mm; font-size: 7.5pt; vertical-align: top; }
    .spell-desc-row td { padding: 0.5mm 0.5mm 2.5mm 0.5mm; border-bottom: 1px solid #eee; }
    .spell-desc-cell { font-size: 6.5pt; line-height: 1.1; color: #444; }
    .lv-cell { background: #000; color: #fff; text-align: center; border-radius: 2px; font-weight: 900; font-size: 6.5pt; width: 6mm; height: 5mm; display: inline-flex; align-items: center; justify-content: center; }

    /* PAGE 3: INVENTORY & LORE */
    .inventory-content { display: grid; grid-template-columns: 105mm 1fr; gap: 8mm; margin-top: 4mm; }
    .currency-card { display: flex; gap: 2mm; margin-bottom: 4mm; }
    .curr-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 2mm; text-align: center; background: #f9f9f9; display: flex; flex-direction: column; align-items: center; }
    .curr-val { font-family: 'Libre Baskerville'; font-size: 11pt; font-weight: 900; }
    .curr-lab { font-size: 6pt; font-weight: 900; color: #666; margin-top: 1mm; }
    .equip-table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
    .equip-table th { background: #eee; font-size: 6pt; font-weight: 950; padding: 1.2mm; border: 1px solid #000; text-align: left; text-transform: uppercase; }
    .equip-table td { padding: 1.8mm 1.2mm; border: 1px solid #000; font-size: 7.5pt; vertical-align: top; }
    .attribute-block { border: 1.5px solid #000; border-radius: 4px; padding: 2mm; margin-bottom: 4mm; background: #fff; }
    .block-label { font-size: 6pt; font-weight: 950; color: #666; margin-bottom: 1.5mm; border-bottom: 1px solid #ddd; padding-bottom: 0.5mm; text-transform: uppercase; }
    .block-value { font-size: 7.5pt; line-height: 1.3; font-style: italic; color: #111; }
    .biography-block { margin-top: 6mm; }
    .bio-text { font-size: 8pt; line-height: 1.5; white-space: pre-wrap; margin-top: 2mm; color: #111; font-family: 'Libre Baskerville', serif; }

    /* COMPANIONS */
    .companion-header { margin-bottom: 6mm; border-bottom: 2px solid #000; padding-bottom: 2mm; margin-top: 6mm; }
    .comp-name-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 2mm; }
    .comp-name { font-size: 20pt; font-weight: 900; color: #000; font-family: 'Playfair Display'; }
    .comp-type { font-size: 12pt; font-weight: 700; color: #666; font-style: italic; }
    .companion-content { display: grid; grid-template-columns: 60mm 1fr; gap: 8mm; }
    .comp-vitals { display: flex; gap: 3mm; margin-bottom: 4mm; }
    .comp-vital-box { flex: 1; border: 2px solid #000; border-radius: 4px; padding: 2mm; text-align: center; background: #f9f9f9; }
    .comp-abilities { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; margin-bottom: 6mm; }
    .comp-ability { border: 1px solid #000; padding: 1.2mm; display: flex; justify-content: space-between; font-size: 7pt; background: #fff; }
    .ab-lab { font-weight: 900; color: #666; }
    .comp-action-item { margin-bottom: 3.5mm; line-height: 1.35; font-size: 7.5pt; border-bottom: 1px solid #eee; padding-bottom: 1.5mm; }
    .comp-notes { margin-top: 6mm; border-top: 1px solid #000; padding-top: 2mm; }

    @media print {
        .dnd-sheet-wrapper { background: white; padding: 0; }
        .print-controls { display: none; }
        .page { box-shadow: none; margin: 0; page-break-after: always; }
    }
  `}</style>
);

const SVGs = {
    shield: (
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0 L100 15 L100 60 C100 95 50 120 50 120 C50 120 0 95 0 60 L0 15 Z" fill="#f5f5f5" stroke="black" strokeWidth="4" />
        </svg>
    ),
    modFrame: (
        <svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <path d="M10 0 L70 0 Q80 0 80 10 L80 90 Q80 100 70 100 L10 100 Q0 100 0 90 L0 10 Q0 0 10 0" fill="#f9f9f9" stroke="black" strokeWidth="2" />
        </svg>
    ),
    portraitFrame: (
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="90" height="110" rx="10" fill="#eee" stroke="#ccc" strokeWidth="2" />
        </svg>
    ),
    diamond: (
        <svg viewBox="0 0 20 20" style={{ width: '2.8mm', height: '2.8mm' }}>
            <rect x="4" y="4" width="12" height="12" fill="none" stroke="black" strokeWidth="2" transform="rotate(45 10 10)" />
        </svg>
    ),
    dot: (
        <svg viewBox="0 0 20 20" style={{ width: '3.2mm', height: '3.2mm' }}>
            <circle cx="10" cy="10" r="7" fill="none" stroke="black" strokeWidth="2" />
        </svg>
    ),
    pbFrame: (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#f9f9f9" stroke="black" strokeWidth="2" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2,2" />
        </svg>
    ),
};

const getMod = (score: number) => Math.floor(((score || 10) - 10) / 2);
const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export const PrintableCharacterSheet = () => {
    const { characterId } = useParams();
    const [character, setCharacter] = useState<ICharacter | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (characterId) {
            getCharacter(characterId).then(setCharacter);
        }
    }, [characterId]);

    const actions = useMemo(() => character ? getAllActions(character) : [], [character]);

    const groupedFeatures = useMemo(() => {
        if (!character?.featuresAndTraits) return {};
        const features = character.featuresAndTraits.filter(f => !f.isAction);
        return features.reduce((acc: any, f: any) => {
            const cat = f.category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(f);
            return acc;
        }, {});
    }, [character?.featuresAndTraits]);

    const sortedSpells = useMemo(() => {
        if (!character?.spells) return [];
        return [...character.spells].sort((a, b) => (a.level || 0) - (b.level || 0));
    }, [character?.spells]);

    const featureCategories = ['class', 'racial', 'feat-origin', 'feat-general', 'feat-combat', 'feat-epic', 'other'];

    if (!character) return <div>Loading...</div>;

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const pdfBlob = await generateCharacterPDF(character);
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${character.name || 'character'}_sheet.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download error:', error);
            alert('Errore durante la generazione del PDF.');
        } finally {
            setDownloading(false);
        }
    };

    const pb = Math.ceil((character.level || 1) / 4) + 1;
    const level = character.level || 1;

    const formatDamage = (atk: any) => {
        const mod = atk.damageAbility ? getMod(character.abilityScores[atk.damageAbility as keyof typeof character.abilityScores]) : 0;
        let parts = [`${atk.damage}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''} ${atk.damageType || ''}`.trim()];
        if (atk.additionalDamage && atk.additionalDamage.length > 0) {
            atk.additionalDamage.forEach((e: any) => {
                parts.push(`${e.formula} ${e.type}`);
            });
        }
        return parts.join(' + ');
    };

    const hasSpells = character.spells && character.spells.length > 0;
    const hasCustomResources = character.customResources && character.customResources.length > 0;
    const hasCompanions = character.companions && character.companions.length > 0;

    // Spellcasting logic
    const spellAbility = character.spellcastingAbility || 'intelligence';
    const spellMod = getMod(character.abilityScores[spellAbility as keyof typeof character.abilityScores] || 10);
    const saveDC = 8 + pb + spellMod;
    const attackBonus = pb + spellMod;

    return (
        <div className="dnd-sheet-wrapper">
            <SharedStyles />
            <div className="print-controls">
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>D&D 2024 CS (v15.2.0)</h2>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Premium Page 1 + Multi-Page Expansion</p>
                </div>
                <button onClick={handleDownload} className="download-btn" disabled={downloading}>
                    {downloading ? 'Generating...' : 'Download PDF'}
                </button>
            </div>

            {/* PAGE 1: CORE */}
            <div className="page">
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

                <div className="main-content">
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
                            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(key => {
                                const score = character.abilityScores[key as keyof typeof character.abilityScores];
                                const mod = getMod(score);
                                const saveProf = character.savingThrows[key as keyof typeof character.abilityScores]?.proficient;
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

                    <div className="right-col">
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

                        <div className="section-card">
                            <div className="section-title">ATTACKS & SPELLCASTING</div>
                            <table className="grid-table">
                                <thead><tr><th style={{ width: '21%' }}>NAME</th><th style={{ width: '10%' }}>HIT/DC</th><th style={{ width: '23%' }}>DAMAGE/TYPE</th><th style={{ width: '18%' }}>PROPERTIES</th><th style={{ width: '28%' }}>MASTERY/NOTES</th></tr></thead>
                                <tbody>
                                    {actions.map((atk, i) => (
                                        <tr key={i}>
                                            <td className="font-serif"><b>{atk.name}</b></td>
                                            <td className="center"><b>{atk.bonus}</b></td>
                                            <td style={{ fontSize: '7.2pt' }}><b>{formatDamage(atk)}</b></td>
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

                        <div className="section-card">
                            <div className="section-title">FEATURES & TRAITS</div>
                            <div className="features-container">
                                {featureCategories.map(cat => {
                                    const list = groupedFeatures[cat];
                                    if (!list || list.length === 0) return null;
                                    return (
                                        <div key={cat} className="feature-group">
                                            <div className="group-label">{CATEGORY_LABELS[cat] || 'OTHER FEATURES'}</div>
                                            {list.map((f: any, i: number) => (
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
                    </div>
                </div>
            </div>

            {/* PAGE 2: SPELLS & RESOURCES */}
            {
                (hasSpells || hasCustomResources) && (
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
                                        {character.customResources.map((res: any, i: number) => (
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
                                            {sortedSpells.map((s: any, i: number) => (
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
                )
            }

            {/* PAGE 3: INVENTORY & LORE */}
            <div className="page page-break">
                <div className="inventory-header"><div className="section-title">EQUIPMENT & CURRENCIES</div></div>
                <div className="inventory-content">
                    <div className="inv-left">
                        <div className="currency-card">
                            {['cp', 'sp', 'ep', 'gp', 'pp'].map(curr => (
                                <div key={curr} className="curr-box">
                                    <div className="curr-val">{character.currency?.[curr as keyof typeof character.currency] || 0}</div>
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

            {/* PAGE 4+: COMPANIONS */}
            {
                hasCompanions && character.companions.map((comp: any, i: number) => (
                    <div key={i} className="page page-break">
                        <header className="companion-header">
                            <div className="section-title">COMPANION / SUMMON</div>
                            <div className="comp-name-row">
                                <div className="comp-name font-serif">{comp.name}</div>
                                <div className="comp-type">{comp.type}</div>
                            </div>
                        </header>
                        <div className="companion-content">
                            <div className="comp-left">
                                <div className="comp-vitals">
                                    <div className="comp-vital-box"><div className="box-label">AC</div><div className="box-value">{comp.armorClass || 10}</div></div>
                                    <div className="comp-vital-box"><div className="box-label">HP</div><div className="box-value">{comp.hp?.max || 0}</div></div>
                                    <div className="comp-vital-box"><div className="box-label">SPEED</div><div className="box-value">{comp.speed || '30ft'}</div></div>
                                </div>
                                <div className="comp-abilities">
                                    {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(key => (
                                        <div key={key} className="comp-ability">
                                            <div className="ab-lab">{key.substring(0, 3).toUpperCase()}</div>
                                            <div className="ab-val">{comp.abilityScores?.[key as keyof typeof comp.abilityScores] || 10} ({fmtMod(getMod(comp.abilityScores?.[key as keyof typeof comp.abilityScores] || 10))})</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="comp-right">
                                <div className="comp-actions">
                                    <div className="section-title">ACTIONS & TRAITS</div>
                                    {comp.attacks?.map((atk: any, idx: number) => (
                                        <div key={idx} className="comp-action-item">
                                            <b>{atk.name}.</b> {atk.bonus ? <i>Hit: {atk.bonus}. </i> : ''} <i>Damage:</i> {atk.damage}. {atk.properties?.length > 0 && `(${atk.properties.join(', ')})`}
                                        </div>
                                    ))}
                                    {comp.featuresAndTraits?.map((f: any, idx: number) => (
                                        <div key={idx} className="comp-action-item"><b>{f.name}.</b> {f.description}</div>
                                    ))}
                                    {comp.notes && <div className="comp-notes"><div className="block-label">NOTES</div><div className="small-text">{comp.notes}</div></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    );
};
