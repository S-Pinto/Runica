import React from 'react';
import { useCharacter } from '../../CharacterProvider';

const InfoTabView = () => {
    const { character } = useCharacter();
    const InfoBlock = ({ title, content }: { title: string; content: string }) => (
        <div className="bg-card p-4 rounded-lg border border-border flex-grow">
            <h3 className="text-lg font-cinzel text-accent mb-2">{title}</h3>
            <p className="text-foreground whitespace-pre-wrap">{content || 'Not set.'}</p>
        </div>
    );
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6 flex flex-col">
                <InfoBlock title="Personality Traits" content={character.personalityTraits} />
                <InfoBlock title="Ideals" content={character.ideals} />
                <InfoBlock title="Bonds" content={character.bonds} />
                <InfoBlock title="Flaws" content={character.flaws} />
            </div>
             <div className="space-y-6 flex flex-col">
                <InfoBlock title="Character Notes" content={character.notes} />
                <InfoBlock title="Campaign Info" content={character.dmNotes} />
            </div>
        </div>
    );
};

export default InfoTabView;