import { ICharacter, Spell, Currency } from '../../characterTypes';
import { calculateSpellAttackBonus, calculateSpellSaveDC } from '../../rules/combat';
import { formatSense, getItemLanguages, getItemSenses } from '../../rules/itemEffects';
import { ABILITY_LABELS, schoolLabel } from '../../../../lib/labels';
import { SVGs } from './printStyles';
import { Box } from './PrintBox';
import { RunicFrieze } from './PrintOrnaments';
import {
    EQUIPMENT_ROWS_PAGE2, SPELL_ROWS_PAGE2, fmtMod, getAttunedItems, getMod, getPrintSpells, getStoryText,
    hasMaterialComponent, STORY_CHARS_PAGE2,
} from './printUtils';

const CURRENCY_KEYS: (keyof Currency)[] = ['cp', 'sp', 'ep', 'gp', 'pp'];
const SLOT_COLUMNS = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
/** Caselle mostrate per i livelli senza slot, da compilare a mano (come nel modulo ufficiale). */
const DEFAULT_SLOTS: Record<number, number> = { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 };

const spellNote = (s: Spell) => [schoolLabel(s.school), s.damage && `${s.damage} ${s.damageType || ''}`.trim()].filter(Boolean).join(' · ');

/** Tabella incantesimi con un numero fisso di righe (le righe in più restano vuote, da compilare a mano). */
export const SpellTable = ({ spells, rows, title }: { spells: Spell[]; rows: number; title: string }) => (
    <Box title={title} className="spells-box">
        <div className="sp-head">
            <span>Liv.</span><span>Nome</span><span>Lancio</span><span>Gittata</span><span>Conc. · Rit. · Mat.</span><span>Note</span>
        </div>
        <div className="sp-rows">
            {Array.from({ length: rows }).map((_, i) => {
                const s = spells[i];
                return (
                    <div key={i} className="sp-row">
                        <span className="lv">{s ? s.level : ''}</span>
                        <span className="nm">{s?.name}</span>
                        <span>{s?.castingTime}</span>
                        <span>{s?.range}</span>
                        <span className="crm">
                            <span className={s?.concentration ? 'on' : ''}>{s?.concentration ? SVGs.diamondFilled : SVGs.diamond}C</span>
                            <span className={s?.ritual ? 'on' : ''}>{s?.ritual ? SVGs.diamondFilled : SVGs.diamond}R</span>
                            <span className={s && hasMaterialComponent(s.components) ? 'on' : ''}>{s && hasMaterialComponent(s.components) ? SVGs.diamondFilled : SVGs.diamond}M</span>
                        </span>
                        <span className="note">{s && spellNote(s)}</span>
                    </div>
                );
            })}
        </div>
    </Box>
);

interface PrintPageSpellsProps {
    character: ICharacter;
    /** Riporta slot spesi e monete correnti; altrimenti i campi variabili restano vuoti. */
    filled: boolean;
    /** Riporta nella tabella gli incantesimi della scheda; altrimenti le righe restano vuote, da compilare a mano. */
    insertSpells: boolean;
    /** La colonna sinistra diventa il riquadro "Note e appunti di campagna" al posto della sezione incantesimi. */
    notesColumn: boolean;
}

/** Grande riquadro a quadretti per note e appunti di campagna (colonna di pagina 2 o pagina dedicata). */
export const CampaignNotesBox = () => (
    <Box title="Note e appunti di campagna" style={{ flex: 1 }}><div className="box-body grid-paper" /></Box>
);

/** Pagina 2: incantesimi, slot, aspetto, storia, linguaggi, equipaggiamento e monete. */
export const PrintPageSpells = ({ character, filled, insertSpells, notesColumn }: PrintPageSpellsProps) => {
    const spells = insertSpells ? getPrintSpells(character).slice(0, SPELL_ROWS_PAGE2) : [];
    const ability = character.spellcastingAbility;
    const abilityMod = ability ? getMod(character.abilityScores[ability]) : 0;
    const equipment = (character.equipment || []).slice(0, EQUIPMENT_ROWS_PAGE2);
    const attuned = getAttunedItems(character).slice(0, 3);
    const story = getStoryText(character);
    const storyFits = story.length <= STORY_CHARS_PAGE2;

    return (
        <section className="page">
            <div className="p2-grid">
                {!notesColumn ? <div className="col" style={{ gap: '2.5mm' }}>
                    <div className="p2-top">
                        <Box className="sc-box">
                            <div className="sc-head">
                                <div className="lbl">Caratteristica da incantatore</div>
                                <div className="nm">{ability ? ABILITY_LABELS[ability] : ''}</div>
                            </div>
                            <div className="sc-rows">
                                <div className="sc-row"><div className="num">{ability ? fmtMod(abilityMod) : ''}</div><div className="t">Modificatore da incantatore</div></div>
                                <div className="sc-row"><div className="num">{ability ? calculateSpellSaveDC(character) : ''}</div><div className="t">CD salvezza</div></div>
                                <div className="sc-row"><div className="num">{ability ? fmtMod(calculateSpellAttackBonus(character)) : ''}</div><div className="t">Bonus attacco</div></div>
                            </div>
                        </Box>
                        <div className="p2-right">
                            <RunicFrieze />
                            <Box title="Slot incantesimo" className="slots-box">
                                <div className="slots-cols">
                                    {SLOT_COLUMNS.map((levels) => (
                                        <div key={levels[0]} className="slots-col">
                                            <div className="slots-hd"><span className="a" /><span className="b">Totale</span><span className="c">Spesi</span></div>
                                            {levels.map((lv) => {
                                                const max = character.spellSlots?.[lv]?.max || 0;
                                                const diamonds = max > 0 ? Math.min(max, 6) : DEFAULT_SLOTS[lv];
                                                const spent = filled ? Math.min(character.spellSlots?.[lv]?.used || 0, diamonds) : 0;
                                                return (
                                                    <div key={lv} className="slot-line">
                                                        <span className="lv">Liv. {lv}</span>
                                                        <span className="tot">{max || ''}</span>
                                                        <span className="dm">{Array.from({ length: diamonds }).map((_, i) => <span key={i}>{i < spent ? SVGs.diamondFilled : SVGs.diamond}</span>)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </Box>
                        </div>
                    </div>
                    <SpellTable spells={spells} rows={SPELL_ROWS_PAGE2} title="Trucchetti e incantesimi preparati" />
                </div> : (
                    <div className="col" style={{ gap: '2.5mm' }}>
                        <RunicFrieze />
                        <CampaignNotesBox />
                    </div>
                )}

                <div className="side-col">
                    <Box title="Aspetto" style={{ flex: '1.1 1 0' }}><div className="box-body grid-paper" /></Box>
                    <Box title="Storia e personalità" style={{ flex: '2.1 1 0' }}>
                        <div className="box-body grid-paper">
                            {([['Tratti', character.personalityTraits], ['Ideali', character.ideals], ['Legami', character.bonds], ['Difetti', character.flaws]] as const).map(([l, v]) => v ? (
                                <div key={l} className="story-item"><div className="lbl">{l}</div><div className="t">{v}</div></div>
                            ) : null)}
                            {character.biography && <div className="story-bio">{storyFits ? character.biography : `${character.biography.slice(0, 260)}… (continua)`}</div>}
                        </div>
                        <div className="lbl" style={{ marginTop: '1mm', borderBottom: '0.25mm solid var(--ink-soft)', paddingBottom: '0.6mm' }}>Allineamento: <span style={{ color: 'var(--ink)', fontSize: '6.4pt' }}>{character.alignment}</span></div>
                    </Box>
                    <Box title="Linguaggi" style={{ flex: '0.7 1 0' }}>
                        <div className="box-body grid-paper" style={{ whiteSpace: 'pre-wrap', fontSize: '6.4pt' }}>{[character.languages?.trim(), getItemLanguages(character).map(l => l.name).join(', '), getItemSenses(character).map(formatSense).join(', ')].filter(Boolean).join('\n')}</div>
                    </Box>
                    <Box title="Equipaggiamento" style={{ flex: '2.7 1 0' }}>
                        <div className="box-body grid-paper">
                            <ul className="equip-list">
                                {equipment.map((it) => <li key={it.id}><span className="q">{it.quantity > 1 ? `${it.quantity}×` : ''}</span><span className="ell">{it.name}</span></li>)}
                            </ul>
                            {(character.equipment?.length || 0) > EQUIPMENT_ROWS_PAGE2 && <div className="lbl" style={{ marginTop: '0.8mm' }}>… elenco completo nella pagina di continuazione</div>}
                        </div>
                        <div className="attune">
                            <div className="lbl">Sintonia con oggetti magici</div>
                            {[0, 1, 2].map((i) => <div key={i} className="attune-row">{attuned[i] ? SVGs.diamondFilled : SVGs.diamond}<span className="ell">{attuned[i]?.name}</span></div>)}
                        </div>
                    </Box>
                    <Box title="Monete" className="coins">
                        <div className="coin-grid">
                            {CURRENCY_KEYS.map((k) => <div key={k} className="coin"><div className="lbl">{k.toUpperCase()}</div><div className="coin-c"><div>{filled ? character.currency?.[k] || '' : ''}</div></div></div>)}
                        </div>
                    </Box>
                </div>
            </div>
            <div className="p-foot"><span>Runica · {character.name}</span><span>Pagina 2</span></div>
        </section>
    );
};
