import { ReactNode, useState } from 'react';
import { useCharacter } from '../../CharacterProvider';
import { PhotoIcon } from '../../../../components/ui/icons';
import { ImageModal } from '../../../../components/ui/ImageModal';
import { fieldInputClass } from '../../../../components/ui/field';
import { PlaySection, playLabelClass } from './PlaySection';

const DisplayField = ({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) => (
    <div className={`min-w-0 ${className}`}>
        <dt className={playLabelClass}>{label}</dt>
        <dd className="mt-1 break-words text-base text-foreground">{value || <span className="text-muted-foreground">–</span>}</dd>
    </div>
);

/** Testo libero con la sua etichetta, dentro un pannello che ne raccoglie più d'uno. */
const TextBlock = ({ label, content }: { label: string; content: string }) => (
    <div>
        <dt className={playLabelClass}>{label}</dt>
        <dd className="mt-1.5 max-w-[70ch] whitespace-pre-wrap text-sm leading-relaxed text-text">
            {content || <span className="text-muted-foreground">Nessuna informazione.</span>}
        </dd>
    </div>
);

const InfoTabView = () => {
    const { character, updateCharacter } = useCharacter();
    const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

    if (!character) return null;

    const classLine = [character.class, character.level, character.subclass && `(${character.subclass})`].filter(Boolean).join(' ');

    return (
        <div className="space-y-4 sm:space-y-6">
            <ImageModal
                imageUrl={selectedImage?.url || ''}
                altText={selectedImage?.alt || ''}
                onClose={() => setSelectedImage(null)}
            />

            <PlaySection title="Identità">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    {character.imageUrl ? (
                        <button
                            type="button"
                            onClick={() => setSelectedImage({ url: character.imageUrl ?? '', alt: character.name })}
                            aria-label="Ingrandisci ritratto"
                            className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border-strong/60 transition-colors duration-150 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-32 sm:w-32"
                        >
                            <img src={character.imageUrl} alt="" className="h-full w-full object-cover" />
                        </button>
                    ) : (
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-input text-muted-foreground sm:h-32 sm:w-32">
                            <PhotoIcon className="h-10 w-10" />
                        </div>
                    )}

                    <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
                        <DisplayField label="Nome" value={character.name} className="col-span-2" />
                        <DisplayField label="Giocatore" value={character.playerName} />
                        <DisplayField label="Punti esperienza" value={<span className="font-mono tabular-nums">{(character.experiencePoints || 0).toLocaleString('it-IT')}</span>} />
                        <DisplayField label="Classe e livello" value={classLine} className="col-span-2" />
                        <DisplayField label="Razza" value={character.race} />
                        <DisplayField label="Background" value={character.background} />
                        <DisplayField label="Allineamento" value={character.alignment} />
                        <DisplayField label="Lingue" value={character.languages} className="col-span-2 lg:col-span-3" />
                    </dl>
                </div>
            </PlaySection>

            <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2">
                <PlaySection title="Personalità">
                    <dl className="space-y-5">
                        <TextBlock label="Tratti caratteriali" content={character.personalityTraits} />
                        <TextBlock label="Ideali" content={character.ideals} />
                        <TextBlock label="Legami" content={character.bonds} />
                        <TextBlock label="Difetti" content={character.flaws} />
                    </dl>
                </PlaySection>

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <PlaySection title="Note">
                        <dl className="space-y-5">
                            <TextBlock label="Personali" content={character.notes} />
                            <TextBlock label="Di campagna" content={character.dmNotes} />
                        </dl>
                    </PlaySection>
                    <PlaySection title="Biografia">
                        <textarea
                            aria-label="Biografia"
                            className={`${fieldInputClass} min-h-48 resize-y bg-background leading-relaxed`}
                            placeholder="Scrivi qui la storia del personaggio"
                            defaultValue={character.biography || ''}
                            onBlur={(e) => {
                                if (character.biography !== e.target.value) {
                                    updateCharacter({ biography: e.target.value });
                                }
                            }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">Si salva quando esci dal campo.</p>
                    </PlaySection>
                </div>
            </div>
        </div>
    );
};

export default InfoTabView;
