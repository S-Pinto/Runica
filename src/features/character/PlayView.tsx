import { useState, useEffect, useRef, useCallback, Suspense, lazy, FC, createElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as characterRepository from './characterRepository';
import { useCharacter } from './CharacterProvider';
import type { ICharacter } from './characterTypes';
import { describeDataError } from '../../lib/errors';
import { BackIcon, EditIcon, SparklesIcon, MoonIcon, SunIcon, PrinterIcon, EllipsisVerticalIcon, UserGroupIcon, HeartIcon, StarIcon, SwordIcon, UserCircleIcon, ShieldIcon } from '../../components/ui/icons';
import { Button } from '../../components/ui/Button';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { AbilitiesDisplay } from './components/AbilitiesDisplay';
import { ImageModal } from '../../components/ui/ImageModal';
import { CompanionTab } from './components/play-view/CompanionTab';
import { DiceRoller } from './components/play-view/DiceRoller';
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { longRestUpdate, shortRestUpdate } from './rules/rest';
import { TabButton } from '../../components/ui/TabButton';

type PlayTab = 'main' | 'stats' | 'combat' | 'bio' | 'inventory' | 'spells' | 'companions';

const MainTabView = lazy(() => import('./components/play-view/MainTabView'));
const CombatTabView = lazy(() => import('./components/play-view/CombatTabView'));
const SpellsTabView = lazy(() => import('./components/play-view/SpellsTabView'));
const InventoryTabView = lazy(() => import('./components/play-view/InventoryTabView'));
const BioTabView = lazy(() => import('./components/play-view/InfoTabView'));

const TabLoadingSpinner = () => <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div></div>;


const PLAY_TABS: { key: PlayTab; label: string; icon: FC<{ className?: string }> }[] = [
    { key: 'main', label: 'Panoramica', icon: HeartIcon },
    { key: 'stats', label: 'Caratteristiche', icon: StarIcon },
    { key: 'combat', label: 'Combattimento', icon: SwordIcon },
    { key: 'spells', label: 'Incantesimi', icon: SparklesIcon },
    { key: 'inventory', label: 'Inventario', icon: ShieldIcon },
    { key: 'bio', label: 'Biografia', icon: UserCircleIcon },
    { key: 'companions', label: 'Compagni', icon: UserGroupIcon },
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
    
    const tabParam = searchParams.get('tab') as PlayTab | null;
    const initialTab: PlayTab = tabParam && tabParam in tabComponents ? tabParam : 'main';
    const [activeTab, setActiveTab] = useState<PlayTab>(initialTab);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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
                const charData = await characterRepository.getCharacter(characterId);
                if (charData) {
                    setCharacter(charData);
                } else {
                    setError('Personaggio non trovato');
                }
            } catch (err) {
                console.error("Failed to load character:", err);
                setError(describeDataError(err, 'Impossibile caricare il personaggio'));
            }
        };
        loadCharacter();
    }, [characterId, setCharacter]);

    const pendingSave = useRef<ICharacter | null>(null);
    const saveFailed = useRef(false);
    const flushSave = useCallback(() => {
        const toSave = pendingSave.current;
        if (!toSave) return;
        pendingSave.current = null;
        characterRepository.saveCharacter(toSave).then(
            () => { saveFailed.current = false; },
            (error) => {
                console.error('Autosave failed', error);
                // Un solo avviso per serie di fallimenti, per non spammare ogni 1,5 s.
                if (!saveFailed.current) {
                    toast.error(describeDataError(error, 'Salvataggio automatico non riuscito.'));
                }
                saveFailed.current = true;
            },
        );
    }, []);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (character) {
            pendingSave.current = character;
            const handler = setTimeout(() => flushSave(), 1500);
            return () => clearTimeout(handler);
        }
    }, [character, flushSave]);

    // Se si lascia la pagina entro il debounce, l'ultima modifica non va persa.
    useEffect(() => () => flushSave(), [flushSave]);

    const tabContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = tabContainerRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
        el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [activeTab, character?.id]);

    const handleLongRest = async () => {
        if (!character) return;
        const ok = await confirmDialog({
            title: 'Riposo lungo?',
            message: 'Ripristina Punti Vita, dadi vita, slot incantesimo, usi dei privilegi, cariche degli oggetti e risorse. Azzera PV temporanei e tiri contro la morte.',
            confirmLabel: 'Riposa',
        });
        if (!ok) return;
        updateCharacter(longRestUpdate(character));
        toast.success('Riposo lungo completato.');
    };

    const handleShortRest = async () => {
        if (!character) return;
        const ok = await confirmDialog({
            title: 'Riposo breve?',
            message: 'Ripristina gli usi e le cariche che si ricaricano con un riposo breve. Puoi spendere dadi vita dalla Panoramica.',
            confirmLabel: 'Riposa',
        });
        if (!ok) return;
        updateCharacter(shortRestUpdate(character));
        handleTabChange('main');
        toast.success('Riposo breve completato.');
    };

    if (error) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
                <p className="font-cinzel text-2xl font-bold text-foreground">{error}</p>
                <p className="text-sm text-muted-foreground">Il personaggio potrebbe essere stato eliminato o non essere ancora sincronizzato.</p>
                <Button variant="secondary" onClick={() => navigate('/')}>
                    <BackIcon className="h-4 w-4" /> Torna ai tuoi eroi
                </Button>
            </div>
        );
    }

    if (!character) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Caricamento personaggio">
                <div className="h-28 animate-pulse rounded-2xl bg-muted/30" />
                <div className="h-12 animate-pulse rounded-xl bg-muted/20" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/20" />
                    ))}
                </div>
            </div>
        );
    }

    const subtitle = [
        character.race,
        character.class && (character.subclass ? `${character.class} (${character.subclass})` : character.class),
        `Livello ${character.level || 1}`,
    ].filter(Boolean).join(' · ');

    const menuItems: MenuItem[] = [
        { label: 'Riposo breve', icon: <SunIcon />, onSelect: handleShortRest },
        { label: 'Stampa scheda', icon: <PrinterIcon />, onSelect: () => window.open(`/character/${characterId}/print`, '_blank') },
        ...(diceMode === 'modal' ? [{ label: 'Apri dadiera', icon: <SparklesIcon />, onSelect: () => setIsDiceModalOpen(true) }] : []),
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28">
            {/* Identity header */}
            <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgb(var(--color-accent)/0.14),transparent_55%)]" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            aria-label="Torna ai tuoi eroi"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <BackIcon className="h-5 w-5" />
                        </button>
                        {character.imageUrl ? (
                            <button
                                type="button"
                                onClick={() => setIsImageModalOpen(true)}
                                aria-label="Ingrandisci ritratto"
                                className="shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <img
                                    src={character.imageUrl}
                                    alt=""
                                    className="h-14 w-14 rounded-2xl border border-accent/50 object-cover shadow-[0_0_20px_rgb(var(--color-accent)/0.25)] transition-transform hover:scale-105 sm:h-16 sm:w-16"
                                />
                            </button>
                        ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 font-cinzel text-xl font-bold text-accent sm:h-16 sm:w-16 sm:text-2xl">
                                {(character.name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="truncate font-cinzel text-2xl font-bold text-foreground sm:text-3xl">{character.name || 'Senza nome'}</h1>
                            <p className="truncate text-sm capitalize text-muted-foreground">{subtitle}</p>
                            {character.campaignName && (
                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                                    <UserGroupIcon className="h-3.5 w-3.5" />
                                    {character.campaignName}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleLongRest} className="flex-1 sm:flex-none" title="Ripristina PV, slot e cariche">
                            <MoonIcon className="h-4 w-4" /> <span>Riposo<span className="hidden sm:inline"> lungo</span></span>
                        </Button>
                        <Button onClick={() => navigate(`/character/${characterId}/edit?tab=${activeTab}`)} className="flex-1 sm:flex-none">
                            <EditIcon className="h-4 w-4" /> Modifica
                        </Button>
                        <Menu
                            label="Altre azioni"
                            trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
                            items={menuItems}
                            triggerClassName="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </div>
            </header>

            {/* Sticky section navigation (sits under the 5rem app header) */}
            <nav className="sticky top-20 z-40 -mx-4 border-b border-border bg-background/85 px-2 backdrop-blur-xl sm:mx-0 sm:rounded-xl sm:border sm:px-1">
                <div ref={tabContainerRef} role="tablist" aria-label="Sezioni della scheda" className="no-scrollbar flex overflow-x-auto">
                    {PLAY_TABS.map(tab => (
                        <TabButton
                            key={tab.key}
                            id={`play-tab-${tab.key}`}
                            controls={`play-panel-${tab.key}`}
                            label={tab.label}
                            icon={tab.icon}
                            isActive={activeTab === tab.key}
                            onClick={() => handleTabChange(tab.key)}
                        />
                    ))}
                </div>
            </nav>

            <main id={`play-panel-${activeTab}`} role="tabpanel" aria-labelledby={`play-tab-${activeTab}`} key={activeTab} className="animate-fadeIn">
                <Suspense fallback={<TabLoadingSpinner />}>
                    {createElement(tabComponents[activeTab], { readOnly: true })}
                </Suspense>
            </main>

            {diceMode === 'dock' && <DiceRoller mode="dock" />}
            {diceMode === 'modal' && (
                <DiceRoller mode="modal" isOpen={isDiceModalOpen} onClose={() => setIsDiceModalOpen(false)} />
            )}

            {isImageModalOpen && character.imageUrl && (
                <ImageModal
                    imageUrl={character.imageUrl}
                    altText={`Ritratto di ${character.name}`}
                    onClose={() => setIsImageModalOpen(false)}
                />
            )}
        </div>
    );
};
