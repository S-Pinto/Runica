import React, { useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { PhotoIcon } from '../../../../components/ui/icons';
import { ImageModal } from '../../../../components/ui/ImageModal';

const InfoTabView = () => {
    const { character, updateCharacter } = useCharacter();
    const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

    if (!character) return null;

    const DisplayField = ({ label, value, className = '' }: { label: string, value: React.ReactNode, className?: string }) => (
        <div className={`space-y-1 ${className}`}>
            <label className="block text-xs font-bold text-accent uppercase tracking-widest opacity-80">{label}</label>
            <div className="text-foreground font-medium text-sm sm:text-base border-b border-border/50 pb-1 min-h-[1.5em]">{value || <span className="text-muted-foreground/40 italic">--</span>}</div>
        </div>
    );

    const InfoBlock = ({ title, content }: { title: string; content: string }) => (
        <div className="bg-card/30 p-5 rounded-xl border border-accent/10 shadow-sm hover:border-accent/30 transition-colors flex max-h-[400px] flex-col overflow-hidden">
            <h3 className="text-lg font-cinzel font-bold text-accent mb-3 border-b border-border/30 pb-2">{title}</h3>
            <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed overflow-y-auto pr-2 custom-scrollbar flex-1">{content || <span className="text-muted-foreground/50 italic">No information available.</span>}</div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8">
            <ImageModal
                imageUrl={selectedImage?.url || ''}
                altText={selectedImage?.alt || ''}
                onClose={() => setSelectedImage(null)}
            />
            {/* Identity Header Card */}
            <div className="bg-card/40 backdrop-blur-sm p-6 rounded-2xl border border-accent/20 shadow-lg">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Portrait Section */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-accent/30 shadow-[0_0_15px_rgba(var(--color-accent),0.2)] overflow-hidden bg-muted relative group cursor-pointer transition-transform hover:scale-105"
                            onClick={() => character.imageUrl && setSelectedImage({ url: character.imageUrl, alt: character.name })}
                        >
                            {character.imageUrl ? (
                                <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-accent/5">
                                    <PhotoIcon className="w-16 h-16 text-accent/20" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                        <DisplayField label="Character Name" value={<span className="font-cinzel font-bold text-xl text-accent">{character.name}</span>} className="sm:col-span-2" />
                        <DisplayField label="Player Name" value={character.playerName} />
                        <DisplayField label="XP" value={`${character.experiencePoints?.toLocaleString() || 0}`} />

                        <DisplayField label="Class & Level" value={`${character.class} ${character.level} ${character.subclass ? `(${character.subclass})` : ''}`} className="sm:col-span-2" />
                        <DisplayField label="Race" value={character.race} />
                        <DisplayField label="Background" value={character.background} />

                        <DisplayField label="Alignment" value={character.alignment} />
                        <DisplayField label="Languages" value={character.languages} className="sm:col-span-3" />
                    </div>
                </div>
            </div>

            {/* Content Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                {/* Left Column: Personality */}
                <div className="space-y-6 flex flex-col h-full">
                    <InfoBlock title="Personality Traits" content={character.personalityTraits} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
                        <InfoBlock title="Ideals" content={character.ideals} />
                        <InfoBlock title="Bonds" content={character.bonds} />
                        <InfoBlock title="Flaws" content={character.flaws} />
                    </div>
                </div>

                {/* Right Column: Notes */}
                <div className="space-y-6 flex flex-col h-full">
                    <InfoBlock title="Character Notes" content={character.notes} />
                    <InfoBlock title="Campaign Info" content={character.dmNotes} />
                    <div className="bg-card/30 p-5 rounded-xl border border-accent/10 shadow-sm hover:border-accent/30 transition-colors flex flex-col overflow-hidden h-full min-h-[300px]">
                        <h3 className="text-lg font-cinzel font-bold text-accent mb-3 border-b border-border/30 pb-2 flex justify-between items-center">
                            Biography
                        </h3>
                        <textarea
                            className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-foreground/90 leading-relaxed custom-scrollbar p-0 placeholder:text-muted-foreground/30"
                            placeholder="Write your character's biography here..."
                            defaultValue={character.biography || ''}
                            onBlur={(e) => {
                                if (character.biography !== e.target.value) {
                                    updateCharacter({ biography: e.target.value });
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoTabView;