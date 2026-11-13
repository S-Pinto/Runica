// Stili CSS e SVG condivisi dalle pagine della scheda stampabile (A4, bianco e nero).
// I colori sono volutamente fissi: la carta non segue il tema dell'app.

export const SharedStyles = () => (
    <style>{`
    @page { size: A4; margin: 0; }

    .dnd-sheet-wrapper {
        background: #e5e5e5;
        padding: 24px 12px 40px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        color: #111;
    }
    .print-controls {
        background: #fff; padding: 12px 20px; border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.12);
        display: flex; gap: 16px; align-items: center;
        position: sticky; top: 12px; z-index: 100; width: 210mm; max-width: 100%;
    }
    .print-btn {
        background: #111; color: #fff; border: none; padding: 9px 18px; border-radius: 6px;
        font-weight: 600; cursor: pointer;
    }
    .print-btn.secondary { background: #fff; color: #111; border: 1px solid #999; }

    /* --- Pagina --- */
    .page {
        width: 210mm; height: 297mm; padding: 8mm; box-sizing: border-box;
        background: #fff; box-shadow: 0 0 18px rgba(0,0,0,0.2);
        position: relative; overflow: hidden;
        font-size: 7pt; line-height: 1.2; color: #111;
        break-after: page; page-break-after: always;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
        display: flex; flex-direction: column; gap: 2.5mm;
    }
    .page *, .page *::before, .page *::after { box-sizing: border-box; }
    .serif { font-family: Georgia, 'Times New Roman', serif; }
    .ell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* --- Riquadri --- */
    .box {
        border: 0.45mm solid #444; border-radius: 2.2mm; background: #fff;
        padding: 1.8mm 2.2mm; display: flex; flex-direction: column; min-height: 0; min-width: 0;
    }
    .box-title {
        font-family: Georgia, serif; font-weight: 700; font-size: 7.4pt; letter-spacing: 0.4pt;
        text-transform: uppercase; text-align: center; color: #222;
        border-bottom: 0.3mm solid #444; padding-bottom: 1mm; margin-bottom: 1.2mm; flex-shrink: 0;
    }
    .box-body { flex: 1; min-height: 0; overflow: hidden; }
    .lbl { font-size: 5.2pt; font-weight: 700; letter-spacing: 0.3pt; text-transform: uppercase; color: #666; }
    .blank-lines {
        background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 5.2mm, #bbb 5.2mm, #bbb 5.5mm);
    }
    .grid-paper {
        background-image:
            linear-gradient(#ddd 0.2mm, transparent 0.2mm),
            linear-gradient(90deg, #ddd 0.2mm, transparent 0.2mm);
        background-size: 4mm 4mm;
    }

    /* --- Pagina 1: intestazione --- */
    .p1-head { display: grid; grid-template-columns: 1fr 26mm 70mm; gap: 2.5mm; height: 27mm; flex-shrink: 0; }
    .id-box { display: grid; grid-template-columns: 1fr 1fr 22mm; grid-template-rows: repeat(3, 1fr); column-gap: 3mm; padding: 1.5mm 2.5mm; }
    .id-field { display: flex; flex-direction: column-reverse; border-bottom: 0.25mm solid #888; min-width: 0; }
    .id-field .v { font-family: Georgia, serif; font-weight: 700; font-size: 8.5pt; }
    .id-name { grid-column: 1 / 3; }
    .level-oval {
        grid-column: 3; grid-row: 1 / 4; align-self: center; justify-self: center;
        width: 20mm; height: 23mm; border: 0.45mm solid #444; border-radius: 50%;
        display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    }
    .level-oval .big { font-family: Georgia, serif; font-size: 15pt; font-weight: 700; line-height: 1; }
    .level-oval .sub { border-top: 0.25mm solid #888; width: 12mm; margin-top: 1mm; padding-top: 0.6mm; font-size: 6.5pt; font-weight: 600; }
    .ac-box { align-items: center; text-align: center; padding: 1.5mm; }
    .ac-shield {
        width: 16mm; height: 17mm; margin-top: 1mm; border: 0.45mm solid #444;
        border-radius: 1.5mm 1.5mm 8mm 8mm / 1.5mm 1.5mm 9mm 9mm;
        display: flex; align-items: center; justify-content: center;
        font-family: Georgia, serif; font-size: 17pt; font-weight: 700;
    }
    .ac-shield-row { margin-top: 0.8mm; display: flex; gap: 1mm; align-items: center; font-size: 5.2pt; font-weight: 700; color: #666; }
    .vit-box { display: grid; grid-template-columns: 1.3fr 1fr 1fr; padding: 0; overflow: hidden; }
    .vit-cell { padding: 1.5mm 2mm; border-right: 0.3mm solid #444; display: flex; flex-direction: column; text-align: center; }
    .vit-cell:last-child { border-right: none; }
    .hp-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 0 1.5mm; margin-top: 1mm; }
    .hp-slot { border-bottom: 0.25mm solid #888; display: flex; flex-direction: column-reverse; align-items: center; justify-content: flex-start; }
    .hp-slot .v { font-family: Georgia, serif; font-size: 11pt; font-weight: 700; }
    .hp-slot.cur { grid-row: 1 / 3; }
    .dv-slot { flex: 1; display: flex; flex-direction: column; justify-content: space-around; }
    .dv-slot .row { display: flex; flex-direction: column-reverse; align-items: center; border-bottom: 0.25mm solid #888; min-height: 7mm; }
    .dv-slot .v { font-family: Georgia, serif; font-size: 10pt; font-weight: 700; }
    .ds-rows { flex: 1; display: flex; flex-direction: column; justify-content: space-around; align-items: center; }
    .ds-row { display: flex; align-items: center; gap: 0.8mm; font-size: 5.2pt; font-weight: 700; color: #444; }

    .p1-rule {
        display: flex; align-items: center; gap: 3mm; height: 3.5mm; flex-shrink: 0;
        font-family: Georgia, serif; font-weight: 700; font-size: 7pt; letter-spacing: 3pt; color: #444;
    }
    .p1-rule::before, .p1-rule::after { content: ''; flex: 1; border-top: 0.3mm solid #444; }

    /* --- Pagina 1: corpo --- */
    .p1-main { flex: 1; min-height: 0; display: grid; grid-template-columns: 38mm 38mm 1fr; gap: 2.5mm; }
    .col { display: flex; flex-direction: column; gap: 2mm; min-height: 0; min-width: 0; }
    .stat-tile { align-items: center; text-align: center; justify-content: center; padding: 1.5mm; }
    .stat-tile .v { font-family: Georgia, serif; font-size: 13pt; font-weight: 700; line-height: 1.1; min-height: 6mm; }
    .pb-box { align-items: center; text-align: center; height: 19mm; flex: none; }
    .pb-box .v { font-family: Georgia, serif; font-size: 16pt; font-weight: 700; line-height: 1; margin-top: 1mm; }
    .ab-card { flex: 1 1 auto; padding: 1.2mm 1.6mm; }
    .ab-name { text-align: center; font-family: Georgia, serif; font-weight: 700; font-size: 7.2pt; letter-spacing: 0.4pt; text-transform: uppercase; border-bottom: 0.3mm solid #444; padding-bottom: 0.6mm; }
    .ab-top { display: flex; justify-content: center; align-items: center; gap: 1.5mm; margin: 1.2mm 0; }
    .ab-mod { width: 13mm; height: 13mm; border: 0.4mm solid #444; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .ab-mod b { font-family: Georgia, serif; font-size: 13pt; line-height: 1; }
    .ab-mod small, .ab-score small { font-size: 3.6pt; font-weight: 700; color: #666; letter-spacing: 0.2pt; }
    .ab-score { width: 11mm; height: 8mm; border: 0.4mm solid #444; border-radius: 1.5mm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .ab-score b { font-size: 9pt; line-height: 1; }
    .ab-rows { list-style: none; margin: 0; padding: 0; }
    .ab-rows li { display: flex; align-items: center; gap: 1.2mm; padding: 0.55mm 0; font-size: 6.4pt; border-top: 0.2mm solid #ccc; }
    .ab-rows li.save { border-top: 0.3mm solid #444; font-weight: 700; }
    .ab-rows li b { width: 5mm; text-align: right; font-weight: 700; }
    .dot { width: 2.2mm; height: 2.2mm; border: 0.3mm solid #222; border-radius: 50%; flex-shrink: 0; }
    .dot.on { background: #111; }
    .insp-box { align-items: center; text-align: center; height: 17mm; flex: none; }
    .insp-box .sq { width: 7mm; height: 7mm; margin-top: 1.5mm; border: 0.4mm solid #444; transform: rotate(45deg) scale(0.8); }
    .training-box { flex: 1 1 0; }
    .training-row { display: flex; align-items: center; gap: 1.5mm; border-bottom: 0.3mm solid #444; padding-bottom: 1mm; margin-bottom: 1mm; flex-wrap: wrap; font-size: 6pt; }
    .training-sec { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .training-sec .fill { flex: 1; }

    .tiles4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5mm; flex-shrink: 0; }
    table.sheet-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .sheet-table th { text-align: left; font-size: 5.2pt; font-weight: 700; color: #666; text-transform: uppercase; padding-bottom: 0.6mm; }
    .sheet-table td { border-top: 0.2mm solid #ccc; height: 5.8mm; padding: 0 1mm; font-size: 6.8pt; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .weapons-box { flex-shrink: 0; }
    .features-box { flex: 1 1 0; }
    .cols2 { column-count: 2; column-gap: 3mm; column-rule: 0.2mm solid #bbb; height: 100%; column-fill: auto; }
    .feat { break-inside: avoid; margin-bottom: 1.4mm; }
    .feat .n { font-weight: 700; font-size: 6.8pt; }
    .feat .rec { font-size: 5pt; color: #666; text-transform: uppercase; margin-left: 1mm; }
    .feat .d { font-size: 6pt; color: #333; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; }
    .feat-pips { display: flex; gap: 0.4mm; margin-top: 0.4mm; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm; height: 54mm; flex-shrink: 0; }
    .row2 .feat .d { -webkit-line-clamp: 3; }

    /* --- Pagina 2 --- */
    .p2-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 62mm; gap: 2.5mm; }
    .p2-top { display: grid; grid-template-columns: 52mm 1fr; gap: 2.5mm; height: 29mm; flex-shrink: 0; }
    .sc-box { padding: 0; overflow: hidden; }
    .sc-head { text-align: center; padding: 1mm; border-bottom: 0.3mm solid #444; }
    .sc-row { flex: 1; display: grid; grid-template-columns: 11mm 1fr; border-bottom: 0.2mm solid #ccc; }
    .sc-row:last-child { border-bottom: none; }
    .sc-row .num { display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 11pt; font-weight: 700; border-right: 0.3mm solid #444; }
    .sc-row .t { display: flex; align-items: center; padding-left: 1.5mm; font-family: Georgia, serif; font-weight: 700; font-size: 6.5pt; text-transform: uppercase; line-height: 1.05; }
    .slots-box { padding: 1.5mm 2.5mm; }
    .slots-grid { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); grid-auto-flow: column; gap: 0 2mm; }
    .slot-line svg { width: 2.3mm !important; height: 2.3mm !important; }
    .slot-line { display: flex; align-items: center; gap: 0.4mm; font-size: 6pt; border-bottom: 0.2mm solid #ccc; padding: 0.4mm 0; }
    .slot-line .lv { font-family: Georgia, serif; font-weight: 700; font-size: 5.4pt; text-transform: uppercase; width: 6.8mm; }
    .slot-line .tot { width: 3.6mm; text-align: center; font-weight: 700; }
    .spells-box { flex: 1; min-height: 0; }
    .sp-head, .sp-row { display: grid; grid-template-columns: 8mm 1fr 14mm 14mm 21mm 28mm; gap: 0 1.5mm; align-items: end; }
    .sp-head { font-size: 5pt; font-weight: 700; color: #666; text-transform: uppercase; padding-bottom: 0.6mm; }
    .sp-rows { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .sp-row { flex: 1 1 0; min-height: 0; border-top: 0.2mm solid #bbb; align-items: center; font-size: 6.6pt; }
    .sp-row > span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .sp-row .lv { text-align: center; font-weight: 700; }
    .sp-row .nm { font-weight: 700; }
    .sp-row .note { font-size: 5.8pt; color: #444; }
    .crm { display: flex; gap: 1.6mm; font-size: 5.4pt; color: #777; align-items: center; }
    .crm span { display: flex; align-items: center; gap: 0.3mm; }
    .crm .on { color: #111; font-weight: 700; }
    .side-col { display: flex; flex-direction: column; gap: 2.5mm; min-height: 0; }
    .story-item { margin-bottom: 1.1mm; }
    .story-item .t { font-size: 6pt; line-height: 1.25; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; white-space: pre-wrap; }
    .story-bio { font-size: 6pt; line-height: 1.25; white-space: pre-wrap; }
    .equip-list { font-size: 6.3pt; list-style: none; margin: 0; padding: 0; }
    .equip-list li { border-bottom: 0.15mm solid #ddd; padding: 0.35mm 0; display: flex; gap: 1.2mm; white-space: nowrap; overflow: hidden; }
    .equip-list li .q { width: 5mm; text-align: right; flex-shrink: 0; font-weight: 700; }
    .attune { margin-top: auto; flex-shrink: 0; }
    .attune-row { display: flex; align-items: center; gap: 1.5mm; border-bottom: 0.25mm solid #888; height: 5.2mm; font-size: 6.3pt; }
    .coins { flex-shrink: 0; }
    .coin-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5mm; }
    .coin { text-align: center; }
    .coin .c { height: 9mm; margin-top: 0.6mm; border: 0.4mm solid #444; border-radius: 1.5mm; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 8.5pt; font-weight: 700; }
    .p-foot { position: absolute; left: 8mm; right: 8mm; bottom: 3mm; font-size: 4.6pt; color: #888; display: flex; justify-content: space-between; }

    /* --- Continuazioni e compagni --- */
    .cont-title { font-family: Georgia, serif; font-size: 12pt; font-weight: 700; border-bottom: 0.45mm solid #444; padding-bottom: 1.5mm; flex-shrink: 0; }
    .cont-body { flex: 1; min-height: 0; }
    .cont-text { white-space: pre-wrap; font-size: 7.4pt; line-height: 1.35; margin-bottom: 3mm; }
    .cont-cols { column-count: 2; column-gap: 5mm; }
    .comp-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 0.45mm solid #444; padding-bottom: 1.5mm; flex-shrink: 0; }
    .comp-head .n { font-family: Georgia, serif; font-size: 18pt; font-weight: 700; }
    .comp-head .ty { font-size: 10pt; font-style: italic; color: #555; }
    .comp-vitals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; flex-shrink: 0; }
    .comp-abil { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; flex-shrink: 0; }
    .comp-item { margin-bottom: 2mm; font-size: 7.2pt; line-height: 1.3; border-bottom: 0.15mm solid #ddd; padding-bottom: 1mm; }

    @media print {
        html, body { background: #fff !important; margin: 0; padding: 0; }
        .dnd-sheet-wrapper { background: #fff; padding: 0; gap: 0; display: block; min-height: 0; }
        .print-controls { display: none !important; }
        .page { box-shadow: none; margin: 0; }
        .page:last-of-type { break-after: auto; page-break-after: auto; }
    }
  `}</style>
);

export const SVGs = {
    diamond: (
        <svg viewBox="0 0 20 20" style={{ width: '2.8mm', height: '2.8mm', flexShrink: 0 }}>
            <rect x="4.5" y="4.5" width="11" height="11" fill="none" stroke="#222" strokeWidth="1.6" transform="rotate(45 10 10)" />
        </svg>
    ),
    diamondFilled: (
        <svg viewBox="0 0 20 20" style={{ width: '2.8mm', height: '2.8mm', flexShrink: 0 }}>
            <rect x="4.5" y="4.5" width="11" height="11" fill="#222" stroke="#222" strokeWidth="1.6" transform="rotate(45 10 10)" />
        </svg>
    ),
};
