import { useState, useEffect, useRef, Suspense, lazy, FC, createElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as characterRepository from './characterRepository';
import { useCharacter } from './CharacterProvider';
import { useCampaigns } from '../../providers/CampaignProvider';
import { resolveCampaignName } from './rules/campaign';
import { describeDataError } from '../../lib/errors';
import { BackIcon, EditIcon, SparklesIcon, MoonIcon, SunIcon, PrinterIcon, DiceIcon, EllipsisVerticalIcon, UserGroupIcon, HeartIcon, StarIcon, SwordIcon, UserCircleIcon, ShieldIcon } from '../../components/ui/icons';
import { Button } from '../../components/ui/Button';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { AbilitiesDisplay } from './components/AbilitiesDisplay';
import { ImageModal } from '../../components/ui/ImageModal';
import { CompanionTab } from './components/play-view/CompanionTab';
import { DiceRoller } from './components/play-view/DiceRoller';
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { longRestUpdate, shortRestUpdate } from './rules/rest';
import { usePlayViewAutosave } from './hooks/usePlayViewAutosave';
import { useDiceMode } from './hooks/useDiceMode';
import { TabButton } from '../../components/ui/TabButton';

type PlayTab = 'main' | 'stats' | 'combat' | 'bio' | 'inventory' | 'spells' | 'companions';

const MainTabView = lazy(() => import('./components/play-view/MainTabView'));
const CombatTabView = lazy(() => import('./components/play-view/CombatTabView'));
const SpellsTabView = lazy(() => import('./components/play-view/SpellsTabView'));
const InventoryTabView = lazy(() => import('./components/play-view/InventoryTabView'));
const BioTabView = lazy(() => import('./components/play-view/InfoTabView'));

const TabLoadingSpinner = () => <div className="flex h-64 items-center justify-center" role="status" aria-label="Caricamento"><div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-accent" /></div>;


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
    const { campaignNames } = useCampaigns();
    const [error, setError] = useState<string | null>(null);
    
    const tabParam = searchParams.get('tab') as PlayTab | null;
    const initialTab: PlayTab = tabParam && tabParam in tabComponents ? tabParam : 'main';
    const [activeTab, setActiveTab] = useState<PlayTab>(initialTab);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
    const diceMode = useDiceMode();

    const handleTabChange = (tab: PlayTab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

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

    usePlayViewAutosave(character);

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
        ...(diceMode === 'modal' ? [{ label: 'Apri dadiera', icon: <DiceIcon />, onSelect: () => setIsDiceModalOpen(true) }] : []),
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-4 p-4 pb-28 sm:space-y-6 sm:p-6 sm:pb-28">
            {/* Identity header */}
            <header className="surface hero-glow rounded-2xl p-3 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                        <Button variant="ghost" size="icon-lg" onClick={() => navigate('/')} aria-label="Torna ai tuoi eroi" className="-ml-1 sm:ml-0">
                            <BackIcon className="h-5 w-5" />
                        </Button>
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
                                    className="h-14 w-14 rounded-2xl border border-border-strong/60 object-cover transition-colors duration-150 hover:border-accent sm:h-16 sm:w-16"
                                />
                            </button>
                        ) : (
                            <div className="portrait-rune monogram flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border-strong/40 text-xl sm:h-16 sm:w-16 sm:text-2xl">
                                {(character.name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="line-clamp-2 break-words font-cinzel text-xl font-bold leading-tight text-foreground sm:line-clamp-1 sm:text-3xl">{character.name || 'Senza nome'}</h1>
                            <p className="mt-0.5 line-clamp-2 text-sm capitalize text-muted-foreground sm:line-clamp-1">{subtitle}</p>
                            {resolveCampaignName(character, campaignNames) && (
                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                                    <UserGroupIcon className="h-3.5 w-3.5" />
                                    {resolveCampaignName(character, campaignNames)}
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
                            triggerClassName="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong/60 text-muted-foreground transition-colors duration-150 hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </div>
            </header>

            {/* Sticky section navigation (sits under the app header: --header-offset) */}
            <nav className="sticky top-header z-40 py-2">
                <div ref={tabContainerRef} role="tablist" aria-label="Sezioni della scheda" className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-foreground/10 bg-card/95 p-1 shadow-raised backdrop-blur-xl sm:inline-flex sm:max-w-full">
                    {PLAY_TABS.map(tab => (
                        <TabButton
                            key={tab.key}
                            variant="pill"
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
