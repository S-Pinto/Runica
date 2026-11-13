// Stili CSS e SVG condivisi dalle pagine della scheda stampabile (A4, bianco e nero).
// I colori sono volutamente fissi: la carta non segue il tema dell'app.

export const SharedStyles = () => (
    <style>{`
    @page { size: A4; margin: 0; }

    /* --- Anteprima a schermo: foglio A4 centrato su fondo neutro --- */
    .dnd-sheet-wrapper {
        background: radial-gradient(ellipse at top, #e9e8e4, #d3d2cd);
        padding: 0 12px 48px;
        min-height: 100vh;
        display: flex; flex-direction: column; align-items: center; gap: 22px;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        color: #111;
        overflow-x: auto;
    }
    .print-controls {
        background: rgba(255,255,255,0.92); backdrop-filter: blur(6px);
        padding: 8px 16px; border-radius: 0 0 12px 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.12);
        display: flex; gap: 12px; align-items: center;
        position: sticky; top: 0; z-index: 100; width: 210mm; max-width: 100%;
    }
    .print-btn {
        background: #1b1b1b; color: #fff; border: none; padding: 7px 16px; border-radius: 999px;
        font-size: 0.8rem; font-weight: 600; cursor: pointer;
    }
    .print-btn.secondary { background: transparent; color: #333; border: 1px solid #aaa; }

    /* --- Pagina --- */
    .page {
        width: 210mm; height: 297mm; padding: 8mm; box-sizing: border-box;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.16), 0 28px 60px rgba(0,0,0,0.10);
        position: relative; overflow: hidden; flex-shrink: 0;
        font-size: 7pt; line-height: 1.2; color: #111;
        break-after: page; page-break-after: always;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
        display: flex; flex-direction: column; gap: 2.5mm;
    }
    .page *, .page *::before, .page *::after { box-sizing: border-box; }
    .serif { font-family: Georgia, 'Times New Roman', serif; }
    .ell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* --- Cornici con angoli smussati a 45° (linea scura + filetto grigio perla) --- */
    .box, .bx1, .bx2, .bx3 {
        display: flex; flex-direction: column; min-height: 0; min-width: 0;
        clip-path: polygon(var(--k) 0, calc(100% - var(--k)) 0, 100% var(--k), 100% calc(100% - var(--k)), calc(100% - var(--k)) 100%, var(--k) 100%, 0 calc(100% - var(--k)), 0 var(--k));
    }
    .bx1, .bx2, .bx3 { flex: 1 1 auto; }
    .box { --c: 2.6mm; --k: var(--c); background: #111; padding: 0.42mm; }
    .bx1 { --k: calc(var(--c) - 0.24mm); background: #fff; padding: 0.32mm; }
    .bx2 { --k: calc(var(--c) - 0.44mm); background: #5f5f5f; padding: 0.22mm; }
    .bx3 { --k: calc(var(--c) - 0.56mm); background: #fff; padding: 1.5mm 2mm; position: relative; }
    .box.tight .bx3 { padding: 0; }
    .box-title {
        display: flex; align-items: center; gap: 1.6mm; flex-shrink: 0; margin-bottom: 1.3mm;
        font-family: Georgia, serif; font-weight: 700; font-size: 7.4pt; letter-spacing: 1.1pt;
        text-transform: uppercase; color: #111; background: #ececec;
        padding: 0.7mm 1.5mm; margin-left: -0.6mm; margin-right: -0.6mm;
        border-top: 0.2mm solid #444; border-bottom: 0.2mm solid #444;
    }
    .box-title::before, .box-title::after { content: ''; flex: 1; height: 0.8mm; border-top: 0.2mm solid #333; border-bottom: 0.2mm solid #333; }
    .box-title > span { white-space: nowrap; }
    .box-body { flex: 1; min-height: 0; overflow: hidden; }
    .lbl { font-size: 4.9pt; font-weight: 700; letter-spacing: 0.7pt; text-transform: uppercase; color: #333; font-variant-caps: all-small-caps; }
    .blank-lines {
        background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 5.2mm, #6f6f6f 5.2mm, #6f6f6f 5.42mm);
    }
    .grid-paper {
        background-image:
            linear-gradient(#cdcdcd 0.13mm, transparent 0.13mm),
            linear-gradient(90deg, #cdcdcd 0.13mm, transparent 0.13mm);
        background-size: 3.5mm 3.5mm;
    }

    /* --- Pagina 1: intestazione --- */
    .p1-head { display: grid; grid-template-columns: 1fr 23mm 80mm; gap: 2.5mm; height: 28mm; flex-shrink: 0; }
    .id-box .bx3 { display: grid; grid-template-columns: 1fr 1fr 24mm; grid-template-rows: repeat(3, 1fr); column-gap: 3mm; padding: 1.3mm 3mm 1.3mm 3mm; }
    .id-field { display: flex; flex-direction: column-reverse; border-bottom: 0.22mm solid #444; min-width: 0; }
    .id-field .v { font-family: Georgia, serif; font-weight: 700; font-size: 8.5pt; }
    .id-name { grid-column: 1 / 3; }
    .level-medal {
        grid-column: 3; grid-row: 1 / 4; align-self: center; justify-self: center; position: relative;
        width: 21mm; height: 24.5mm;
        display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    }
    .level-medal > * { position: relative; }
    .level-medal .big { font-family: Georgia, serif; font-size: 15pt; font-weight: 700; line-height: 1; }
    .level-medal .sub { border-top: 0.22mm solid #333; width: 11mm; margin-top: 0.8mm; padding-top: 0.4mm; min-height: 3.2mm; font-size: 6.2pt; font-weight: 600; }
    .ac-box .bx3 { align-items: center; text-align: center; padding: 1.2mm 0.8mm; }
    .ac-art { position: relative; width: 17mm; height: 19.5mm; margin-top: 0.8mm; display: flex; align-items: center; justify-content: center; }
    .ac-art b { position: relative; font-family: Georgia, serif; font-size: 16pt; line-height: 1; margin-top: -1.2mm; }
    .ac-shield-row { margin-top: 0.4mm; display: flex; gap: 1mm; align-items: center; font-size: 5pt; font-weight: 700; color: #222; letter-spacing: 0.6pt; }
    .vit-box .bx3 { display: grid; grid-template-columns: 1.7fr 1fr 1fr; padding: 0; }
    .vit-cell { padding: 1.3mm 1.6mm; border-right: 0.3mm solid #222; display: flex; flex-direction: column; text-align: center; min-width: 0; }
    .vit-cell:last-child { border-right: none; }
    .vit-title { font-family: Georgia, serif; font-weight: 700; font-size: 6.2pt; letter-spacing: 0.9pt; text-transform: uppercase; border-bottom: 0.22mm solid #444; padding-bottom: 0.5mm; }
    .hp-cols { flex: 1; display: grid; grid-template-columns: 1.2fr 1fr 1fr; margin-top: 0.6mm; }
    .hp-col { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; border-right: 0.22mm solid #555; padding: 0 0.5mm; }
    .hp-col:last-child { border-right: none; }
    .hp-col .v { font-family: Georgia, serif; font-size: 12pt; font-weight: 700; flex: 1; display: flex; align-items: center; }
    .hp-col .lbl { border-top: 0.18mm solid #555; width: 100%; padding-top: 0.3mm; }
    .dv-slot { flex: 1; display: flex; flex-direction: column; justify-content: space-around; margin-top: 0.4mm; }
    .dv-slot .row { display: flex; flex-direction: column-reverse; align-items: center; border-bottom: 0.22mm solid #555; min-height: 6.6mm; }
    .dv-slot .row:last-child { border-bottom: none; }
    .dv-slot .v { font-family: Georgia, serif; font-size: 10pt; font-weight: 700; }
    .ds-rows { flex: 1; display: flex; flex-direction: column; justify-content: space-around; align-items: center; }
    .ds-row { display: flex; flex-direction: column; align-items: center; font-size: 4.9pt; font-weight: 700; color: #222; letter-spacing: 0.5pt; text-transform: uppercase; }
    .ds-row .diams { display: flex; }

    .p1-rule {
        display: flex; align-items: center; gap: 2.5mm; height: 4mm; flex-shrink: 0;
    }
    .p1-rule .mark {
        display: flex; align-items: center; gap: 1.6mm;
        font-family: 'Norse', Georgia, serif; font-weight: 700; font-size: 11pt; letter-spacing: 3.5pt; color: #1d1d1d; line-height: 1;
    }
    .p1-rule .gem { width: 1.7mm; height: 1.7mm; background: #1d1d1d; transform: rotate(45deg); }

    /* --- Pagina 1: corpo --- */
    .p1-main { flex: 1; min-height: 0; display: grid; grid-template-columns: 38mm 38mm 1fr; grid-template-rows: minmax(0, 1fr) 50mm; gap: 2.5mm; }
    .p1-main > .col-a { grid-column: 1; grid-row: 1; }
    .p1-main > .col-b { grid-column: 2; grid-row: 1; }
    .p1-main > .training-box { grid-column: 1 / 3; grid-row: 2; }
    .p1-main > .col-c { grid-column: 3; grid-row: 1 / 3; }
    .col { display: flex; flex-direction: column; gap: 2mm; min-height: 0; min-width: 0; }
    .stat-tile .bx3 { align-items: center; text-align: center; justify-content: center; padding: 1.3mm 1mm 1.5mm; position: relative; }
    .stat-tile .bx3 > :not(svg) { position: relative; }
    .stat-tile .v { font-family: Georgia, serif; font-size: 14pt; font-weight: 700; line-height: 1.1; min-height: 6mm; }
    .stat-tile .lbl { font-size: 5pt; letter-spacing: 0.5pt; line-height: 1.1; padding: 0 2.2mm; }
    .stat-tile .stat-sub { font-family: Georgia, serif; font-size: 5.6pt; font-weight: 700; letter-spacing: 1pt; text-transform: uppercase; border-bottom: 0.2mm solid #777; padding: 0 2mm 0.4mm; margin-bottom: 0.8mm; }
    .pb-box { height: 15mm; flex: none; }
    .pb-box .bx3 { align-items: center; text-align: center; justify-content: center; padding: 1mm; }
    .pb-box .bx3 > :not(svg) { position: relative; }
    .pb-box .v { font-family: Georgia, serif; font-size: 16pt; font-weight: 700; line-height: 1; margin-top: 0.8mm; }
    .ab-card { flex: 1 1 auto; min-height: 0; overflow: hidden; }
    .ab-card .bx3 { padding: 1mm 1.4mm 1.2mm; }
    .ab-name { text-align: center; font-family: Georgia, serif; font-weight: 700; font-size: 7.2pt; letter-spacing: 1.2pt; text-transform: uppercase; background: #ececec; border-top: 0.2mm solid #444; border-bottom: 0.2mm solid #444; margin: 0 -0.6mm; padding: 0.4mm 0; }
    .ab-emblem { position: relative; width: 100%; aspect-ratio: 100 / 50; margin: 0.6mm auto 0.4mm; flex-shrink: 0; max-height: 17mm; }
    .ab-emblem .ab-mod { position: absolute; left: 26%; top: 44%; transform: translate(-50%, -50%); font-family: Georgia, serif; font-size: 14pt; line-height: 1; }
    .ab-emblem .ab-score { position: absolute; left: 70%; top: 48%; transform: translate(-50%, -50%); font-size: 10.5pt; line-height: 1; }
    .ab-emblem small { position: absolute; font-size: 3.6pt; font-weight: 700; color: #222; letter-spacing: 0.4pt; line-height: 1; }
    .ab-cap-m { left: 1%; bottom: 0; }
    .ab-cap-s { right: 4%; bottom: 7%; }
    .ab-rows { list-style: none; margin: 0; padding: 0; flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .ab-rows li { flex: 1 1 0; min-height: 5.4mm; max-height: 7.2mm; display: flex; align-items: center; gap: 1.2mm; font-size: 6.4pt; border-top: 0.18mm solid #8a8a8a; }
    .ab-rows li.save { border-top: 0.32mm solid #222; font-weight: 700; }
    .ab-rows li b { width: 5mm; text-align: right; font-weight: 700; }
    .dot { width: 2.2mm; height: 2.2mm; border: 0.32mm solid #111; border-radius: 50%; flex-shrink: 0; }
    .dot.on { background: #111; }
    .insp-box { height: 19mm; flex: none; }
    .insp-box .bx3 { align-items: center; text-align: center; padding: 1mm; }
    .insp-box .bx3 > svg { margin-top: 1.2mm; }
    .training-box { min-height: 0; }
    .training-row { display: flex; align-items: center; gap: 2.4mm; border-bottom: 0.28mm solid #222; padding-bottom: 1mm; margin-bottom: 1mm; font-size: 6.4pt; white-space: nowrap; }
    .training-row > span { display: flex; align-items: center; gap: 0.6mm; }
    .training-sec + .training-sec { border-top: 0.28mm solid #222; padding-top: 0.8mm; margin-top: 0.4mm; }
    .training-sec { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .training-sec .fill { flex: 1; }

    .tiles4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; flex-shrink: 0; height: 15mm; }
    table.sheet-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .sheet-table th { text-align: left; font-size: 5pt; font-weight: 700; color: #333; text-transform: uppercase; letter-spacing: 0.6pt; padding: 0 1mm 0.6mm; border-left: 0.18mm solid #8a8a8a; }
    .sheet-table th:first-child, .sheet-table td:first-child { border-left: none; }
    .sheet-table td { border-top: 0.2mm solid #8a8a8a; border-left: 0.18mm solid #8a8a8a; height: 6mm; padding: 0 1mm; font-size: 6.8pt; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .weapons-box { flex-shrink: 0; }
    .features-box { flex: 1 1 0; }
    .cols2 { column-count: 2; column-gap: 4mm; height: 100%; column-fill: auto; padding: 0 0.5mm; }
    .grid-split {
        background-image:
            linear-gradient(#333, #333),
            linear-gradient(#cdcdcd 0.13mm, transparent 0.13mm),
            linear-gradient(90deg, #cdcdcd 0.13mm, transparent 0.13mm);
        background-size: 0.28mm 100%, 3.5mm 3.5mm, 3.5mm 3.5mm;
        background-position: center top, 0 0, 0 0;
        background-repeat: no-repeat, repeat, repeat;
    }
    .feat { break-inside: avoid; margin-bottom: 1.4mm; }
    .feat .n { font-weight: 700; font-size: 6.8pt; }
    .feat .rec { font-size: 5pt; color: #444; text-transform: uppercase; margin-left: 1mm; }
    .feat .d { font-size: 6pt; color: #1f1f1f; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; }
    .feat-pips { display: flex; gap: 0.4mm; margin-top: 0.4mm; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm; height: 52mm; flex-shrink: 0; }
    .row2 .feat .d { -webkit-line-clamp: 3; }
    .row2 .cols2 { column-count: 1; column-rule: none; }

    /* --- Pagina 2 --- */
    .p2-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 62mm; gap: 2.5mm; }
    .p2-top { display: grid; grid-template-columns: 50mm 1fr; gap: 2.5mm; height: 37mm; flex-shrink: 0; }
    .sc-box .bx3 { padding: 0; }
    .sc-head { text-align: center; padding: 0.8mm 1mm 0.6mm; background: #ececec; border-bottom: 0.28mm solid #222; clip-path: polygon(2mm 0, calc(100% - 2mm) 0, 100% 100%, 0 100%); margin: 0 1.2mm; }
    .sc-head .nm { font-family: Georgia, serif; font-weight: 700; font-size: 8pt; min-height: 3.4mm; }
    .sc-rows { flex: 1; display: flex; flex-direction: column; padding: 0.8mm 1.4mm 1.2mm; gap: 0.8mm; min-height: 0; }
    .sc-row { flex: 1; display: grid; grid-template-columns: 11mm 1fr; align-items: stretch; gap: 1.6mm; min-height: 0; }
    .sc-row .num { display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 10.5pt; font-weight: 700; border: 0.38mm solid #111; outline: 0.18mm solid #5f5f5f; outline-offset: 0.5mm; background: #fff; }
    .sc-row .t { display: flex; align-items: center; font-family: Georgia, serif; font-weight: 700; font-size: 6.1pt; letter-spacing: 0.5pt; text-transform: uppercase; line-height: 1.05; }
    .p2-right { display: flex; flex-direction: column; gap: 1mm; min-width: 0; min-height: 0; }
    .slots-box { flex: 1; }
    .slots-box .bx3 { padding: 1mm 2.2mm 1.2mm; }
    .slots-box .box-title { margin-bottom: 0.8mm; }
    .slots-cols { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); column-gap: 0; min-height: 0; }
    .slots-col { display: flex; flex-direction: column; padding: 0 1.6mm; border-left: 0.22mm solid #6f6f6f; min-width: 0; }
    .slots-col:first-child { border-left: none; padding-left: 0; }
    .slots-col:last-child { padding-right: 0; }
    .slots-hd { display: flex; align-items: flex-end; font-size: 4.6pt; font-weight: 700; color: #333; text-transform: uppercase; letter-spacing: 0.4pt; padding-bottom: 0.3mm; }
    .slots-hd .a { width: 6.6mm; }
    .slots-hd .b { width: 6mm; text-align: center; }
    .slots-hd .c { flex: 1; text-align: left; padding-left: 2.6mm; }
    .slot-line { flex: 1; display: flex; align-items: center; gap: 0.3mm; font-size: 6pt; min-height: 0; }
    .slot-line svg { width: 2.3mm !important; height: 2.3mm !important; }
    .slot-line .lv { font-family: Georgia, serif; font-weight: 700; font-size: 5.4pt; letter-spacing: 0.2pt; text-transform: uppercase; width: 6.6mm; white-space: nowrap; }
    .slot-line .tot { width: 5mm; flex-shrink: 0; height: 3.4mm; border-bottom: 0.28mm solid #222; text-align: center; font-weight: 700; line-height: 3.4mm; margin-right: 1mm; }
    .slot-line .dm { display: flex; }
    .spells-box { flex: 1; min-height: 0; }
    .sp-head, .sp-row { display: grid; grid-template-columns: 7mm 1fr 13mm 12mm 20mm 24mm; gap: 0 1.5mm; align-items: end; }
    .sp-head { font-size: 5pt; font-weight: 700; color: #333; text-transform: uppercase; letter-spacing: 0.4pt; padding-bottom: 0.6mm; }
    .sp-rows { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .sp-row { flex: 1 1 0; min-height: 0; border-top: 0.2mm solid #8a8a8a; align-items: center; font-size: 6.6pt; }
    .sp-row > span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .sp-row .lv { text-align: center; font-weight: 700; }
    .sp-row .nm { font-weight: 700; }
    .sp-row .note { font-size: 5.8pt; color: #222; }
    .crm { display: flex; gap: 1.6mm; font-size: 5.4pt; color: #444; align-items: center; }
    .crm span { display: flex; align-items: center; gap: 0.3mm; }
    .crm .on { color: #111; font-weight: 700; }
    .side-col { display: flex; flex-direction: column; gap: 2.5mm; min-height: 0; }
    .story-item { margin-bottom: 1.1mm; }
    .story-item .t { font-size: 6pt; line-height: 1.25; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; white-space: pre-wrap; }
    .story-bio { font-size: 6pt; line-height: 1.25; white-space: pre-wrap; }
    .equip-list { font-size: 6.3pt; list-style: none; margin: 0; padding: 0; }
    .equip-list li { border-bottom: 0.18mm solid #9a9a9a; padding: 0.35mm 0; display: flex; gap: 1.2mm; white-space: nowrap; overflow: hidden; }
    .equip-list li .q { width: 5mm; text-align: right; flex-shrink: 0; font-weight: 700; }
    .attune { margin-top: auto; flex-shrink: 0; }
    .attune .lbl { margin-bottom: 0.3mm; }
    .attune-row { display: flex; align-items: center; gap: 1.5mm; border-bottom: 0.25mm solid #444; height: 5.4mm; font-size: 6.3pt; }
    .coins { flex-shrink: 0; }
    .coin-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.4mm; }
    .coin { text-align: center; }
    .coin-c {
        --n: 1.2mm; height: 10mm; margin-top: 0.6mm; background: #111; padding: 0.3mm;
        clip-path: polygon(0 var(--n), 38% var(--n), 42% 0, 58% 0, 62% var(--n), 100% var(--n), 100% calc(100% - var(--n)), 62% calc(100% - var(--n)), 58% 100%, 42% 100%, 38% calc(100% - var(--n)), 0 calc(100% - var(--n)));
        display: flex;
    }
    .coin-c > div {
        flex: 1; background: #fff; display: flex; align-items: center; justify-content: center;
        font-family: Georgia, serif; font-size: 8.5pt; font-weight: 700;
        clip-path: polygon(0 calc(var(--n) + .3mm), 38% calc(var(--n) + .3mm), 42% .3mm, 58% .3mm, 62% calc(var(--n) + .3mm), 100% calc(var(--n) + .3mm), 100% calc(100% - var(--n) - .3mm), 62% calc(100% - var(--n) - .3mm), 58% calc(100% - .3mm), 42% calc(100% - .3mm), 38% calc(100% - var(--n) - .3mm), 0 calc(100% - var(--n) - .3mm));
    }
    .p-foot { position: absolute; left: 8mm; right: 8mm; bottom: 3mm; font-size: 4.6pt; color: #555; display: flex; justify-content: space-between; }

    /* --- Continuazioni e compagni --- */
    .cont-title { font-family: Georgia, serif; font-size: 12pt; font-weight: 700; border-bottom: 0.45mm solid #444; padding-bottom: 1.5mm; flex-shrink: 0; }
    .cont-body { flex: 1; min-height: 0; }
    .cont-text { white-space: pre-wrap; font-size: 7.4pt; line-height: 1.35; margin-bottom: 3mm; }
    .cont-cols { column-count: 2; column-gap: 5mm; }
    .comp-id { height: 15mm; flex-shrink: 0; }
    .comp-id .bx3 { justify-content: center; padding: 1.2mm 3mm; }
    .comp-id-row { display: grid; grid-template-columns: 2fr 1.2fr 1.2fr; column-gap: 4mm; }
    .comp-name .v { font-size: 13pt; }
    .comp-vitals { display: grid; grid-template-columns: 26mm 1fr 1fr; gap: 2.5mm; height: 30mm; flex-shrink: 0; }
    .comp-hp .bx3 { grid-template-columns: 1fr; }
    .comp-hp .hp-col .v { font-size: 16pt; }
    .comp-vital .v { font-size: 13pt; padding: 0 7mm; line-height: 1.15; }
    .comp-abil { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; flex-shrink: 0; }
    .comp-ab .bx3 { padding-bottom: 1.4mm; }
    .comp-bottom { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 62mm; gap: 2.5mm; }
    .comp-traits { min-height: 0; }
    .comp-cols { column-count: 2; column-gap: 4mm; column-fill: auto; height: 100%; padding: 0 0.5mm; }
    .comp-d { -webkit-line-clamp: 8 !important; font-size: 6.4pt !important; }
    .comp-side { display: flex; flex-direction: column; gap: 2.5mm; min-height: 0; }
    .comp-small { flex: 1 1 0; min-height: 0; }
    .comp-notes { flex: 1.6 1 0; min-height: 0; }
    .comp-text { font-size: 6.6pt; line-height: 1.3; }
    .comp-item { margin-bottom: 2mm; font-size: 7.2pt; line-height: 1.3; border-bottom: 0.18mm solid #9a9a9a; padding-bottom: 1mm; }

    @media print {
        html, body { background: #fff !important; margin: 0; padding: 0; }
        .dnd-sheet-wrapper { background: #fff; padding: 0; gap: 0; display: block; min-height: 0; overflow: visible; }
        .print-controls { display: none !important; }
        .page { box-shadow: none; margin: 0; height: 296.6mm; }
        .page:last-of-type { break-after: auto; page-break-after: auto; }
    }
  `}</style>
);

const dia = { width: '2.8mm', height: '2.8mm', flexShrink: 0 } as const;

export const SVGs = {
    diamond: (
        <svg viewBox="0 0 20 20" style={dia}>
            <rect x="4.5" y="4.5" width="11" height="11" fill="none" stroke="#111" strokeWidth="1.7" transform="rotate(45 10 10)" />
        </svg>
    ),
    diamondFilled: (
        <svg viewBox="0 0 20 20" style={dia}>
            <rect x="4.5" y="4.5" width="11" height="11" fill="#111" stroke="#111" strokeWidth="1.7" transform="rotate(45 10 10)" />
        </svg>
    ),
};
