import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCharacter } from '../../characterRepository';
import { ICharacter } from '../../characterTypes';
import { SharedStyles } from './printStyles';
import { PrintPageCore } from './PrintPageCore';
import { PrintPageSpells } from './PrintPageSpells';
import { PrintPageNotes, PrintPageSpellsContinuation } from './PrintPageOverflow';
import { PrintPageCompanion } from './PrintPageCompanion';
import {
    EQUIPMENT_ROWS_PAGE2, SPELL_ROWS_CONTINUATION, SPELL_ROWS_PAGE2, STORY_CHARS_PAGE2,
    getPrintSpells, getStoryText, splitChunks,
} from './printUtils';

/** Scheda stampabile: 2 pagine A4 standard, più continuazioni e compagni solo se servono. */
export const PrintableCharacterSheet = () => {
    const { characterId } = useParams();
    const navigate = useNavigate();
    const [character, setCharacter] = useState<ICharacter | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!characterId) return;
        getCharacter(characterId).then((c) => (c ? setCharacter(c) : setFailed(true))).catch((error) => {
            console.error('Failed to load character for print', error);
            setFailed(true);
        });
    }, [characterId]);

    useEffect(() => {
        if (!character?.name) return;
        const previous = document.title;
        document.title = `${character.name} – scheda`;
        return () => { document.title = previous; };
    }, [character?.name]);

    const spellChunks = useMemo(
        () => (character ? splitChunks(getPrintSpells(character), SPELL_ROWS_PAGE2, SPELL_ROWS_CONTINUATION).slice(1).filter((c) => c.length > 0) : []),
        [character],
    );

    /** Aperta in una nuova scheda: la chiude; aperta nella stessa finestra (PWA, popup bloccato): torna al personaggio. */
    const handleClose = () => {
        if (window.opener) window.close();
        else navigate(characterId ? `/character/${characterId}` : '/');
    };

    if (failed) return <div style={{ padding: 24 }}>Impossibile caricare il personaggio.</div>;
    if (!character) return <div style={{ padding: 24 }}>Caricamento…</div>;

    const showEquipment = (character.equipment?.length || 0) > EQUIPMENT_ROWS_PAGE2;
    const showStory = getStoryText(character).length > STORY_CHARS_PAGE2;
    const showNotes = showEquipment || showStory || !!character.notes?.trim();

    return (
        <div className="dnd-sheet-wrapper">
            <SharedStyles />
            <div className="print-controls">
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{character.name || 'Scheda personaggio'}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>A4 · in stampa scegli "Salva come PDF" per esportarla</p>
                </div>
                <button type="button" className="print-btn secondary" onClick={handleClose}>Chiudi</button>
                <button type="button" className="print-btn" onClick={() => window.print()}>Stampa / Salva PDF</button>
            </div>

            <PrintPageCore character={character} />
            <PrintPageSpells character={character} />
            {spellChunks.map((chunk, i) => <PrintPageSpellsContinuation key={i} character={character} spells={chunk} part={i + 1} />)}
            {showNotes && <PrintPageNotes character={character} showEquipment={showEquipment} showStory={showStory} />}
            {character.companions?.map((comp) => <PrintPageCompanion key={comp.id} companion={comp} />)}
        </div>
    );
};
