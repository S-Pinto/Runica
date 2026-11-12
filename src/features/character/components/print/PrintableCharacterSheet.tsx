import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCharacter } from '../../characterRepository';
import { ICharacter } from '../../characterTypes';
import { generateCharacterPDF } from '../../../../api/characterApi';
import { toast } from '../../../../components/ui/Dialogs';
import { SharedStyles } from './printStyles';
import { PrintPageCore } from './PrintPageCore';
import { PrintPageSpells } from './PrintPageSpells';
import { PrintPageInventory } from './PrintPageInventory';
import { PrintPageCompanion } from './PrintPageCompanion';

export const PrintableCharacterSheet = () => {
    const { characterId } = useParams();
    const [character, setCharacter] = useState<ICharacter | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (characterId) {
            getCharacter(characterId).then(setCharacter).catch((error) => {
                console.error('Failed to load character for print', error);
                setCharacter(null);
            });
        }
    }, [characterId]);

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
            toast.error('Errore durante la generazione del PDF.');
        } finally {
            setDownloading(false);
        }
    };

    const hasSpells = character.spells && character.spells.length > 0;
    const hasCustomResources = character.customResources && character.customResources.length > 0;

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

            <PrintPageCore character={character} />
            {(hasSpells || hasCustomResources) && <PrintPageSpells character={character} />}
            <PrintPageInventory character={character} />
            {character.companions?.map((comp, i) => <PrintPageCompanion key={i} companion={comp} />)}
        </div>
    );
};
