import { useState, useEffect, useRef, Suspense, lazy, FC, useCallback, createElement } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as characterService from './characterService';
import { useCharacter } from './CharacterProvider';
import { BackIcon, EditIcon, ChevronLeftIcon, ChevronRightIcon, PrinterIcon } from '../../components/ui/icons';
import { AbilitiesDisplay } from './components/AbilitiesDisplay';
import { ImageModal } from '../../components/ui/ImageModal';
import { CompanionTab } from './components/play-view/CompanionTab';

type PlayTab = 'main' | 'stats' | 'combat' | 'bio' | 'inventory' | 'spells' | 'companions';

// --- Lazy Loading dei Componenti delle Tab ---
const MainTabView = lazy(() => import('./components/play-view/MainTabView'));
const CombatTabView = lazy(() => import('./components/play-view/CombatTabView'));
const SpellsTabView = lazy(() => import('./components/play-view/SpellsTabView'));
const InventoryTabView = lazy(() => import('./components/play-view/InventoryTabView'));
const BioTabView = lazy(() => import('./components/play-view/InfoTabView'));

const TabLoadingSpinner = () => <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div></div>;

const TabButton = ({ label, isActive, onClick, id, controls }: { label: string, isActive: boolean, onClick: () => void, id: string, controls: string }) => (
    <button
        id={id}
        role="tab"
        aria-selected={isActive}
        aria-controls={controls}
        onClick={onClick}
        className={`px-6 py-2.5 text-sm sm:text-base font-semibold transition-all duration-300 whitespace-nowrap relative group ${isActive
            ? 'text-accent'
            : 'text-muted-foreground hover:text-foreground'
            }`}
    >
        {label}
        {isActive ? (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_0_8px_rgba(var(--color-accent),0.6)] rounded-full" />
        ) : (
            <div className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-accent/30 rounded-full transition-all duration-300 group-hover:left-0 group-hover:right-0" />
        )}
    </button>
);

const PLAY_TABS: { key: PlayTab; label: string }[] = [
    { key: 'main', label: 'Main' },
    { key: 'stats', label: 'Stats & Skills' },
    { key: 'combat', label: 'Combat & Features' },
    { key: 'bio', label: 'Biography & Notes' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'spells', label: 'Spells' },
    { key: 'companions', label: 'Companions' },
];

const tabComponents: Record<PlayTab, React.ComponentType<any>> = {
    main: MainTabView,
    stats: AbilitiesDisplay,
    combat: CombatTabView,
    bio: BioTabView,
    inventory: InventoryTabView,
    spells: SpellsTabView,
    companions: CompanionTab,
};

export const PlayView: FC = () => {
    const { characterId } = useParams<{ characterId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { character, setCharacter } = useCharacter();
    const [activeTab, setActiveTab] = useState<PlayTab>('main');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const isInitialMount = useRef(true);

    const [error, setError] = useState<string | null>(null);

    // Sync active tab from URL query param
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam && PLAY_TABS.some(t => t.key === tabParam)) {
            setActiveTab(tabParam as PlayTab);
        }
    }, [location.search]);

    useEffect(() => {
        if (!characterId) return;
        const loadCharacter = async () => {
            try {
                setError(null);
                const charData = await characterService.getCharacter(characterId);
                if (charData) {
                    setCharacter(charData);
                } else {
                    setError('Character not found');
                }
            } catch (err) {
                console.error("Failed to load character:", err);
                setError('Failed to load character');
            }
        };
        loadCharacter();
    }, [characterId, setCharacter]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (character) {
            const handler = setTimeout(() => {
                characterService.saveCharacter(character);
            }, 1500);

            return () => clearTimeout(handler);
        }
    }, [character]);

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
    }, [character, checkScroll]);

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <div className="text-destructive text-xl font-bold">{error}</div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg transition-colors border border-accent/20"
                >
                    <BackIcon className="w-5 h-5" />
                    Back to List
                </button>
            </div>
        );
    }

    if (!character) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:pt-8">
            <header className="grid grid-cols-2 sm:flex sm:justify-between items-center gap-y-4 gap-x-2 mb-6 border-b border-border pb-4">
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

                <button
                    onClick={() => navigate('/')}
                    className="justify-self-start flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-muted-foreground transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] sm:order-1"
                >
                    <BackIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Back to List</span>
                    <span className="sm:hidden">Back</span>
                </button>

                <div className="justify-self-end flex items-center gap-2 sm:order-3">
                    <button
                        onClick={() => window.open(`/character/${characterId}/print`, '_blank')}
                        className="flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-muted-foreground transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
                        aria-label="Print Character"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Print</span>
                    </button>
                    <button
                        onClick={() => navigate(`/character/${characterId}/edit?tab=${activeTab}`)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 font-bold text-primary transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
                    >
                        <EditIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Edit Sheet</span>
                        <span className="sm:hidden">Edit</span>
                    </button>
                </div>
            </header>

            <div className="relative">
                <div
                    ref={tabContainerRef}
                    role="tablist"
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
                {showLeftArrow && (
                    <div className="absolute left-0 top-0 bottom-0 flex items-center bg-gradient-to-r from-background to-transparent pr-8 pointer-events-none">
                        <button onClick={() => tabContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })} className="p-1 rounded-full bg-card/50 hover:bg-accent text-foreground hover:text-accent-foreground transition-colors pointer-events-auto"><ChevronLeftIcon className="w-5 h-5" /></button>
                    </div>
                )}
                {showRightArrow && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-background to-transparent pl-8 pointer-events-none">
                        <button onClick={() => tabContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="p-1 rounded-full bg-card/50 hover:bg-accent text-foreground hover:text-accent-foreground transition-colors pointer-events-auto"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                )}
            </div>

            <main id={`play-panel-${activeTab}`} role="tabpanel" className="py-6 sm:py-8">
                <Suspense fallback={<TabLoadingSpinner />}>
                    {createElement(tabComponents[activeTab], { readOnly: true })}
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