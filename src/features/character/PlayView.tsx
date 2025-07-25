import React, { useState, useEffect, useMemo, useRef, Suspense, lazy, FC, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICharacter } from './characterTypes';
import * as characterService from './characterService';
import { useCharacter } from './CharacterProvider'; 
import { BackIcon, EditIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/ui/icons';
import { AbilitiesDisplay } from './components/AbilitiesDisplay'; 
import { ImageModal } from '../../components/ui/ImageModal';
import { CompanionTab } from './components/play-view/CompanionTab';

type PlayTab = 'main' | 'abilities' | 'combat' | 'spells' | 'inventory' | 'companions' | 'info';

// --- Lazy Loading dei Componenti delle Tab ---
// Questo approccio migliora drasticamente le performance iniziali,
// caricando il codice di ogni tab solo quando l'utente la seleziona.
const MainTabView = lazy(() => import('./components/play-view/MainTabView'));
const CombatTabView = lazy(() => import('./components/play-view/CombatTabView'));
const SpellsTabView = lazy(() => import('./components/play-view/SpellsTabView'));
const InventoryTabView = lazy(() => import('./components/play-view/InventoryTabView'));
const InfoTabView = lazy(() => import('./components/play-view/InfoTabView'));

// Componente di fallback per Suspense
const TabLoadingSpinner = () => <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div></div>;

const TabButton = ({ label, isActive, onClick, id, controls }: { label: string, isActive: boolean, onClick: () => void, id: string, controls: string }) => (
    <button
        id={id}
        role="tab"
        aria-selected={isActive}
        aria-controls={controls}
        onClick={onClick}
        className={`px-4 py-2 text-sm sm:text-base font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            isActive
                ? 'bg-card text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:bg-muted border-b-2 border-transparent'
        }`}
    >
        {label}
    </button>
);


const PLAY_TABS: { key: PlayTab; label: string }[] = [
    { key: 'main', label: 'Main' },
    { key: 'abilities', label: 'Abilities' },
    { key: 'combat', label: 'Combat' },
    { key: 'spells', label: 'Spells' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'info', label: 'Info' },
    { key: 'companions', label: 'Companions' },
];

// --- Mappa per un rendering pulito e scalabile delle tab ---
const tabComponents: Record<PlayTab, React.ComponentType<any>> = {
    main: MainTabView,
    abilities: AbilitiesDisplay,
    combat: CombatTabView,
    spells: SpellsTabView,
    inventory: InventoryTabView,
    info: InfoTabView,
    companions: CompanionTab,
};

// --- WRAPPER & MAIN RENDER ---
export const PlayView: FC = () => {
    const { characterId } = useParams<{ characterId: string }>();
    const navigate = useNavigate();
    const { character, setCharacter, updateCharacter } = useCharacter();
    const [activeTab, setActiveTab] = useState<PlayTab>('main');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (!characterId) {
            return;
        }
        const loadCharacter = async () => {
            const charData = await characterService.getCharacter(characterId);
            setCharacter(charData);
        };
        loadCharacter();
    }, [characterId, setCharacter]);

    // Auto-save character on changes, with debounce
    useEffect(() => {
        // Don't save on the initial load, only on subsequent updates
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (character) {
            const handler = setTimeout(() => {
                characterService.saveCharacter(character);
            }, 1500); // Debounce save for 1.5 seconds

            return () => {
                clearTimeout(handler);
            };
        }
    }, [character]); // This effect runs whenever the character object changes.
    
    const tabContainerRef = useRef<HTMLDivElement>(null);

    const checkScroll = useCallback(() => {
        const container = tabContainerRef.current;
        if (!container) return;

        const isScrollable = container.scrollWidth > container.clientWidth;
        setShowLeftArrow(isScrollable && container.scrollLeft > 0);
        setShowRightArrow(isScrollable && container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
    }, []);

    useEffect(() => {
        const container = tabContainerRef.current;
        if (!container) return;

        checkScroll();
        window.addEventListener('resize', checkScroll);
        container.addEventListener('scroll', checkScroll);

        return () => {
            window.removeEventListener('resize', checkScroll);
            container.removeEventListener('scroll', checkScroll);
        };
    }, [character, checkScroll]); // Ricalcola quando il personaggio (e quindi le tab) cambiano


    if (!character) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div></div>;
    }
    
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:pt-8">
            <header className="grid grid-cols-2 sm:flex sm:justify-between items-center gap-y-4 gap-x-2 mb-6 border-b border-border pb-4">
                {/* Character Info - Spans both columns on mobile, centered. Is the second element in flex for desktop. */}
                <div className="col-span-2 flex items-center gap-4 text-center justify-center sm:order-2">
                    {character.imageUrl && (
                        <img 
                            src={character.imageUrl}
                            alt={character.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-border shadow-md cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => setIsImageModalOpen(true)}
                        />
                    )}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-cinzel text-accent">{character.name}</h1>
                        <p className="text-muted-foreground capitalize text-sm">
                            {character.race} {character.class} {character.subclass && `(${character.subclass})`} &bull; Level {character.level} &bull; {character.alignment}
                        </p>
                    </div>
                </div>

                {/* Back Button - First element in flex for desktop, first column on mobile */}
                <button
                    onClick={() => navigate('/')}
                    className="justify-self-start flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-muted-foreground transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] sm:order-1"
                    aria-label="Back to character list"
                >
                    <BackIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Back to List</span>
                    <span className="sm:hidden">Back</span>
                </button>

                {/* Edit Button - Third element in flex for desktop, second column on mobile */}
                <button
                    onClick={() => navigate(`/character/${characterId}/edit`)}
                    className="justify-self-end flex items-center gap-2 rounded-md px-3 py-2 font-bold text-primary transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] sm:order-3"
                    aria-label="Edit character sheet"
                >
                    <EditIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Edit Sheet</span>
                    <span className="sm:hidden">Edit</span>
                </button>
            </header>

            {/* Wrapper per frecce e tab */}
            <div className="relative">
                <div 
                    ref={tabContainerRef}
                    role="tablist" 
                    aria-label="Character View Sections" 
                    className="flex space-x-1 mb-6 border-b border-border overflow-x-auto no-scrollbar"
                >
                    {PLAY_TABS.map(tab => (
                        <TabButton
                            key={tab.key}
                            id={`play-tab-${tab.key}`}
                            controls={`play-panel-${tab.key}`}
                            label={tab.label}
                            isActive={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                        />
                    ))}
                </div>
                {/* Freccia Sinistra */}
                {showLeftArrow && (
                    <div className="absolute left-0 top-0 bottom-0 flex items-center bg-gradient-to-r from-background to-transparent pr-8 pointer-events-none">
                        <button onClick={() => tabContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })} className="p-1 rounded-full bg-card/50 hover:bg-accent text-foreground hover:text-accent-foreground transition-colors pointer-events-auto" aria-label="Scroll left"><ChevronLeftIcon className="w-5 h-5" /></button>
                    </div>
                )}
                {/* Freccia Destra */}
                {showRightArrow && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-background to-transparent pl-8 pointer-events-none">
                        <button onClick={() => tabContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="p-1 rounded-full bg-card/50 hover:bg-accent text-foreground hover:text-accent-foreground transition-colors pointer-events-auto" aria-label="Scroll right"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                )}
            </div>
            
            <main
                id={`play-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`play-tab-${activeTab}`}
                className="bg-muted/50 p-4 sm:p-6 rounded-b-lg rounded-tr-lg"
            >
                <Suspense fallback={<TabLoadingSpinner />}>
                    {/* Renderizza dinamicamente il componente della tab attiva.
                        La prop `readOnly` viene passata per coerenza; i componenti che non la usano la ignoreranno. */}
                    {React.createElement(tabComponents[activeTab], { readOnly: true })}
                </Suspense>
            </main>

            {isImageModalOpen && character.imageUrl && (
                <ImageModal 
                    imageUrl={character.imageUrl} 
                    altText={`Profile image for ${character.name}`} 
                    onClose={() => setIsImageModalOpen(false)} />
            )}
        </div>
    );
};