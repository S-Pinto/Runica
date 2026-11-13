import { useState, useEffect, Suspense, lazy, FC, createElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as characterRepository from './characterRepository';
import { useCharacter } from './CharacterProvider';
import { useCampaigns } from '../../providers/CampaignProvider';
import { resolveCampaignName } from './rules/campaign';
import { describeDataError } from '../../lib/errors';
import { BackIcon, EditIcon, SparklesIcon, MoonIcon, SunIcon, PrinterIcon, DiceIcon, UserGroupIcon, HeartIcon, StarIcon, SwordIcon, UserCircleIcon, ShieldIcon } from '../../components/ui/icons';
import { Button } from '../../components/ui/Button';
import { AbilitiesDisplay } from './components/AbilitiesDisplay';
import { ImageModal } from '../../components/ui/ImageModal';
import { CompanionTab } from './components/play-view/CompanionTab';
import { DiceRoller } from './components/play-view/DiceRoller';
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { longRestUpdate, shortRestUpdate } from './rules/rest';
import { usePlayViewAutosave } from './hooks/usePlayViewAutosave';
import { useDiceMode } from './hooks/useDiceMode';
import { HeroHeader } from './components/play-view/HeroHeader';
import { PillTabBar } from './components/play-view/PillTabBar';
import { openPrintSheet } from './utils/printSheet';

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
    const campaignName = resolveCampaignName(character, campaignNames);

    return (
        <div className="mx-auto max-w-7xl space-y-3 p-3 pb-28 sm:space-y-4 sm:p-6 sm:pb-28">
            <HeroHeader
                name={character.name}
                subtitle={subtitle}
                imageUrl={character.imageUrl}
                onPortraitClick={() => setIsImageModalOpen(true)}
                onBack={() => navigate('/')}
                backLabel="Torna ai tuoi eroi"
                badge={campaignName && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                        <UserGroupIcon className="h-3.5 w-3.5" />
                        {campaignName}
                    </span>
                )}
                actions={<>
                    {/* Tutte le azioni sono a vista (niente menu "⋯"). Su telefono: riposi solo icona e "Combatti" nascosto, la tab Combattimento è subito sotto. */}
                    <Button variant="secondary" onClick={() => handleTabChange('combat')} className="hidden sm:inline-flex" title="Vai al combattimento">
                        <SwordIcon className="h-4 w-4" /> Combatti
                    </Button>
                    <Button variant="secondary" onClick={handleShortRest} className="flex-1 sm:flex-none" title="Riposo breve: spendi dadi vita e recupera le cariche a riposo breve" aria-label="Riposo breve">
                        <SunIcon className="h-4 w-4" /> <span className="hidden lg:inline">Riposo breve</span>
                    </Button>
                    <Button variant="secondary" onClick={handleLongRest} className="flex-1 sm:flex-none" title="Riposo lungo: ripristina PV, slot e cariche" aria-label="Riposo lungo">
                        <MoonIcon className="h-4 w-4" /> <span className="hidden lg:inline">Riposo lungo</span>
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => characterId && openPrintSheet(characterId, navigate)}
                        className="flex-1 sm:flex-none"
                        aria-label="Stampa scheda o salva PDF"
                        title="Stampa scheda / PDF"
                    >
                        <PrinterIcon className="h-4 w-4" />
                    </Button>
                    {diceMode === 'modal' && (
                        <Button variant="secondary" onClick={() => setIsDiceModalOpen(true)} className="flex-1 sm:flex-none" aria-label="Apri dadiera" title="Apri dadiera">
                            <DiceIcon className="h-4 w-4" />
                        </Button>
                    )}
                    <Button onClick={() => navigate(`/character/${characterId}/edit?tab=${activeTab}`)} className="flex-[2] sm:flex-none">
                        <EditIcon className="h-4 w-4" /> Modifica
                    </Button>
                </>}
            />

            {/* Navigazione sticky sotto l'header dell'app (--header-offset). */}
            <PillTabBar
                tabs={PLAY_TABS}
                activeTab={activeTab}
                onChange={handleTabChange}
                tabId={key => `play-tab-${key}`}
                panelId={key => `play-panel-${key}`}
                measureKey={character.id}
            />

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
