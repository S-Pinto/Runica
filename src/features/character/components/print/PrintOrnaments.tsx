// Filigrane e fregi SVG della scheda stampabile: tratto sottile, solo grigi/neri (stampa B/N).
import type { CSSProperties } from 'react';

const S = '#3a3a3a';
const P = '#9a9a9a'; // grigio perla

const bg: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' };

/** Cerchio inciso con punta a freccia in basso (modificatore) e targhetta sagomata laterale (punteggio). */
export const AbilityEmblem = ({ mod, score }: { mod: string; score: number | string }) => (
    <div className="ab-emblem">
        <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" style={bg} fill="none">
            <path d="M42 15 L90 11 L98 16 L98 33 L90 38 L42 36" stroke={S} strokeWidth="0.9" fill="#fff" />
            <path d="M46 18 L88 14.5 L94 18 L94 31 L88 34.5 L46 33" stroke={P} strokeWidth="0.7" />
            <path d="M36 38 A18 18 0 1 0 16 38 L26 48 Z" stroke={S} strokeWidth="1" fill="#fff" />
            <path d="M33.5 36 A15 15 0 1 0 18.5 36" stroke={P} strokeWidth="0.7" />
        </svg>
        <div className="ab-mod"><b>{mod}</b></div>
        <div className="ab-score"><b>{score}</b></div>
        <small className="ab-cap-m">MOD.</small>
        <small className="ab-cap-s">PUNTEGGIO</small>
    </div>
);

/** Pilastri architettonici laterali dietro i valori (competenza, iniziativa, velocità…). */
export const Pillars = () => (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={bg} fill="none" aria-hidden>
        <path d="M5 0 C5 16 14 22 14 40" stroke={P} strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        <path d="M95 0 C95 16 86 22 86 40" stroke={P} strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        <path d="M10 0 C10 14 18 22 18 40" stroke={P} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <path d="M90 0 C90 14 82 22 82 40" stroke={P} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
    </svg>
);

/** Contorno a scudo araldico a doppia linea per la Classe Armatura. */
export const ShieldFrame = () => (
    <svg viewBox="0 0 60 70" preserveAspectRatio="xMidYMid meet" style={bg} fill="none" aria-hidden>
        <path d="M6 6 L54 6 L54 38 C54 54 40 62 30 67 C20 62 6 54 6 38 Z" stroke={S} strokeWidth="1.5" fill="#fff" />
        <path d="M11 11 L49 11 L49 37 C49 50 38 57 30 61 C22 57 11 50 11 37 Z" stroke={P} strokeWidth="1" />
        <path d="M6 6 L12 11 M54 6 L48 11" stroke={S} strokeWidth="0.8" />
    </svg>
);

/** Cerchio con stella runica a 4 punte per l'Ispirazione eroica. */
export const InspirationStar = () => (
    <svg viewBox="0 0 40 40" style={{ width: '10mm', height: '10mm', display: 'block' }} fill="none" aria-hidden>
        <circle cx="20" cy="20" r="17" stroke={S} strokeWidth="1.3" />
        <circle cx="20" cy="20" r="13.5" stroke={P} strokeWidth="0.8" />
        <path d="M20 6 L23 17 L34 20 L23 23 L20 34 L17 23 L6 20 L17 17 Z" stroke={S} strokeWidth="1" fill="#fff" />
        <path d="M20 12 L20 28 M12 20 L28 20" stroke={P} strokeWidth="0.7" />
    </svg>
);

/** Medaglione doppio (scudo ovale) per Livello / PE. */
export const LevelMedallion = () => (
    <svg viewBox="0 0 60 70" preserveAspectRatio="xMidYMid meet" style={bg} fill="none" aria-hidden>
        <ellipse cx="30" cy="35" rx="27" ry="32" stroke={S} strokeWidth="1.6" fill="#fff" />
        <ellipse cx="30" cy="35" rx="23" ry="28" stroke={P} strokeWidth="1" />
        <path d="M3 35 L8 32 M3 35 L8 38 M57 35 L52 32 M57 35 L52 38" stroke={S} strokeWidth="0.8" />
    </svg>
);

/** Filetto ornamentale orizzontale (doppia linea che si assottiglia verso il centro). */
export const RuleOrnament = ({ flip = false }: { flip?: boolean }) => (
    <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ flex: 1, height: '3mm', minWidth: 0, transform: flip ? 'scaleX(-1)' : undefined }} fill="none" aria-hidden>
        <path d="M0 6 L4 2 L100 2" stroke={S} strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        <path d="M0 6 L4 10 L100 10" stroke={S} strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        <path d="M8 6 L100 6" stroke={P} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
    </svg>
);

/** Fregio runico/fantasy centrato sopra gli slot incantesimo (pagina 2). */
export const RunicFrieze = () => {
    // rune stilizzate come tratti (font indipendenti): ogni voce è un percorso 10x14
    const runes = [
        'M2 0 V14 M2 3 L8 7 L2 10', 'M2 0 V14 M2 4 L9 0 M2 8 L9 4', 'M1 0 V14 M1 4 L9 8 L1 12', 'M5 0 V14 M5 3 L1 7 M5 7 L9 11',
        'M1 0 V14 M9 0 V14 M1 3 L9 11', 'M2 0 L8 7 L2 14 M8 0 L2 7 L8 14', 'M5 0 V14 M1 4 L5 0 L9 4',
    ];
    return (
        <svg viewBox="0 0 300 36" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '7.5mm', display: 'block' }} fill="none" aria-hidden>
            <path d="M0 18 L40 18 L48 10 L120 10" stroke={S} strokeWidth="1" />
            <path d="M0 18 L40 18 L48 26 L120 26" stroke={S} strokeWidth="1" />
            <path d="M300 18 L260 18 L252 10 L180 10" stroke={S} strokeWidth="1" />
            <path d="M300 18 L260 18 L252 26 L180 26" stroke={S} strokeWidth="1" />
            <path d="M56 18 L120 18 M180 18 L244 18" stroke={P} strokeWidth="0.8" />
            <path d="M150 2 L168 18 L150 34 L132 18 Z" stroke={S} strokeWidth="1.2" fill="#fff" />
            <path d="M150 8 L162 18 L150 28 L138 18 Z" stroke={P} strokeWidth="0.8" />
            <circle cx="150" cy="18" r="2.2" fill={S} />
            {runes.map((d, i) => {
                const x = i < 3 ? 62 + i * 18 : 188 + (i - 3) * 14;
                return <path key={i} d={d} transform={`translate(${x} 11)`} stroke={S} strokeWidth="1.1" strokeLinecap="round" />;
            })}
        </svg>
    );
};

