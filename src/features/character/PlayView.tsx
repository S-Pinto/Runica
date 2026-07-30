import { useState, useEffect, useRef, Suspense, lazy, FC, useCallback, createElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as characterService from './characterService';
import { useCharacter } from './CharacterProvider';
import { BackIcon, EditIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, MoonIcon, PrinterIcon } from '../../components/ui/icons';
import { AbilitiesDisplay } from './components/AbilitiesDisplay';
import { ImageModal } from '../../components/ui/ImageModal';
import { CompanionTab } from './components/play-view/CompanionTab';
import { DiceRoller } from './components/play-view/DiceRoller';

type PlayTab = 'main' | 'stats' | 'combat' | 'bio' | 'inventory' | 'spells' | 'companions';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const { character, setCharacter, updateCharacter } = useCharacter();
    const [error, setError] = useState<string | null>(null);
    
    const initialTab = (searchParams.get('tab') as PlayTab) || 'main';
    const [activeTab, setActiveTab] = useState<PlayTab>(initialTab);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
    const [diceMode, setDiceMode] = useState<'dock' | 'modal'>('dock');
    const isInitialMount = useRef(true);

    const handleTabChange = (tab: PlayTab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    useEffect(() => {
        const storedMode = (localStorage.getItem('runica_dice_mode') as 'dock' | 'modal') || 'dock';
        setDiceMode(storedMode);

        const handleStorageChange = () => {
            setDiceMode((localStorage.getItem('runica_dice_mode') as 'dock' | 'modal') || 'dock');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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

    const handleLongRest = () => {
        if (!character) return;
        if (window.confirm('Eseguire un Riposo Lungo? Questo ripristinerà tutti i Punti Vita, gli Slot Incantesimo e le Cariche degli Oggetti Magici.')) {
            const resetSlots = { ...character.spellSlots };
            Object.keys(resetSlots).forEach(level => {
                resetSlots[Number(level)] = { ...resetSlots[Number(level)], used: 0 };
            });

            const resetEquipment = (character.equipment || []).map(item => {
                if (item.charges && (item.charges.resetType === 'longRest' || item.charges.resetType === 'shortRest')) {
                    return {
                        ...item,
                        charges: {
                            ...item.charges,
                            current: item.charges.max,
                        },
                    };
                }
                return item;
            });

            updateCharacter({
                hp: { ...character.hp, current: character.hp.max, temporary: 0 },
                spellSlots: resetSlots,
                equipment: resetEquipment,
                deathSaves: { successes: 0, failures: 0 },
            });
        }
    };

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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:pt-6 space-y-6 pb-24">
            {/* Top Interactive Session Header */}
            <header className="bg-card/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-border/60 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-xl bg-secondary/60 hover:bg-accent hover:text-accent-foreground transition-all"
                            title="Torna alla Lista"
                        >
                            <BackIcon className="w-5 h-5" />
                        </button>
                        {character.imageUrl && (
                            <img
                                src={character.imageUrl}
                                alt={character.name}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-accent shadow-md cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setIsImageModalOpen(true)}
                            />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-accent">{character.name}</h1>
                                {character.campaignName && (
                                    <span className="text-[10px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full border border-accent/30">
                                        {character.campaignName}
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground capitalize text-xs sm:text-sm mt-1">
                                {character.race} &bull; {character.class} {character.subclass && `(${character.subclass})`} &bull; Livello {character.level || 1}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        {diceMode === 'modal' && (
                            <button
                                onClick={() => setIsDiceModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-xl hover:bg-accent/30 transition-all"
                            >
                                <SparklesIcon className="w-4 h-4" /> Dadiere
                            </button>
                        )}
                        <button
                            onClick={handleLongRest}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl hover:bg-indigo-900/60 transition-all"
                            title="Riposo Lungo (Reset HP e Slot)"
                        >
                            <MoonIcon className="w-4 h-4" /> Riposo Lungo
                        </button>
                        <button
                            onClick={() => window.open(`/character/${characterId}/print`, '_blank')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-secondary/60 hover:bg-secondary border border-border/50 text-foreground font-bold text-xs rounded-xl transition-all"
                            title="Stampa Scheda"
                        >
                            <PrinterIcon className="w-4 h-4" /> Stampa
                        </button>
                        <button
                            onClick={() => navigate(`/character/${characterId}/edit?tab=${activeTab}`)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent text-accent-foreground font-bold text-xs rounded-xl shadow-md hover:bg-accent-light transition-all"
                        >
                            <EditIcon className="w-4 h-4" /> Modifica
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs Bar */}
            <div className="relative">
                <div
                    ref={tabContainerRef}
                    role="tablist"
                    className="flex space-x-1 border-b border-border overflow-x-auto no-scrollbar"
                >
                    {PLAY_TABS.map(tab => (
                        <TabButton
                            key={tab.key}
                            id={`play-tab-${tab.key}`}
                            controls={`play-panel-${tab.key}`}
                            label={tab.label}
                            isActive={activeTab === tab.key}
                            onClick={() => handleTabChange(tab.key)}
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

            {/* Active Tab View Panel */}
            <main id={`play-panel-${activeTab}`} role="tabpanel" className="py-2">
                <Suspense fallback={<TabLoadingSpinner />}>
                    {createElement(tabComponents[activeTab], { readOnly: true })}
                </Suspense>
            </main>

            {/* Dice Roller Integration */}
            {diceMode === 'dock' && <DiceRoller mode="dock" />}
            {diceMode === 'modal' && (
                <DiceRoller
                    mode="modal"
                    isOpen={isDiceModalOpen}
                    onClose={() => setIsDiceModalOpen(false)}
                />
            )}

            {/* Image Modal */}
            {isImageModalOpen && character.imageUrl && (
                <ImageModal
                    imageUrl={character.imageUrl}
                    altText={`Profile image for ${character.name}`}
                    onClose={() => setIsImageModalOpen(false)}
                />
            )}
        </div>
    );
};