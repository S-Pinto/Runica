import { ICharacter, Spell } from '../../characterTypes';
import { SpellTable } from './PrintPageSpells';
import { SPELL_ROWS_CONTINUATION } from './printUtils';

/** Continuazione degli incantesimi: compare solo se non entrano nella pagina 2. */
export const PrintPageSpellsContinuation = ({ character, spells, part }: { character: ICharacter; spells: Spell[]; part: number }) => (
    <section className="page">
        <SpellTable spells={spells} rows={SPELL_ROWS_CONTINUATION} title={`Incantesimi (continua ${part})`} />
        <div className="p-foot"><span>Runica · {character.name}</span><span>Continuazione</span></div>
    </section>
);

/** Continuazione di equipaggiamento, storia e note: compare solo se non entrano nella pagina 2. */
export const PrintPageNotes = ({ character, showEquipment, showStory }: { character: ICharacter; showEquipment: boolean; showStory: boolean }) => (
    <section className="page">
        {showEquipment && (
            <>
                <div className="cont-title">Equipaggiamento</div>
                <div className="cont-cols" style={{ marginBottom: '4mm' }}>
                    {(character.equipment || []).map((it) => (
                        <div key={it.id} className="comp-item"><b>{it.quantity > 1 ? `${it.quantity}× ` : ''}{it.name}</b>{it.description ? ` — ${it.description}` : ''}</div>
                    ))}
                </div>
            </>
        )}
        {showStory && (
            <>
                <div className="cont-title">Storia e personalità</div>
                {([['Tratti', character.personalityTraits], ['Ideali', character.ideals], ['Legami', character.bonds], ['Difetti', character.flaws], ['Storia', character.biography]] as const).map(([l, v]) => v ? (
                    <div key={l}><div className="lbl">{l}</div><div className="cont-text">{v}</div></div>
                ) : null)}
            </>
        )}
        {character.notes?.trim() && (
            <>
                <div className="cont-title">Note</div>
                <div className="cont-text">{character.notes}</div>
            </>
        )}
        <div className="p-foot"><span>Runica · {character.name}</span><span>Continuazione</span></div>
    </section>
);
