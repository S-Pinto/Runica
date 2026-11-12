import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useBlocker } from 'react-router-dom';
import { ICharacter, AbilityScores } from './characterTypes';
import { useCharacter } from './CharacterProvider';
import * as characterService from './characterService';
import * as storageService from '../../services/storageService';
import * as geminiService from '../../services/geminiService';
import { SparklesIcon, BackIcon, SaveIcon, TrashIcon, PhotoIcon, UserGroupIcon, PrinterIcon, EllipsisVerticalIcon, HeartIcon, StarIcon, SwordIcon, ShieldIcon, UserCircleIcon } from '../../components/ui/icons';
import { Button } from '../../components/ui/Button';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { StyledInput, StyledTextArea, StyledSection } from './components/ui/StyledInputs';
import { ImageUploader } from './components/ImageUploader';
import { Spellbook } from './components/Spellbook';
import { CategorizedFeatureList } from './components/CategorizedFeatureList';
import { EquipmentList } from './components/EquipmentList';
import { AttackList } from './components/AttackList';
import { CustomResourceEditor } from './components/CustomResourceEditor';
import { useAuth } from '../../providers/AuthProvider';
import { StatBox } from './components/ui/StatBox';
import { CompanionTab } from './components/play-view/CompanionTab';
import { StatInput } from './components/StatInput';
import { getModifier, formatModifier } from './utils/characterUtils';
import * as campaignService from '../../services/campaignService';
import { CampaignManagerModal } from './components/CampaignManagerModal';
import { confirmDialog, toast } from '../../components/ui/Dialogs';
import { TabButton } from '../../components/ui/TabButton';
import { ABILITY_LABELS, ABILITY_SHORT, skillLabel } from '../../lib/labels';

type Tab = 'main' | 'stats' | 'combat' | 'bio' | 'spells' | 'inventory' | 'companions';
const ABILITIES: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];


const TABS: { key: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'main', label: 'Generale', icon: HeartIcon },
    { key: 'stats', label: 'Caratteristiche', icon: StarIcon },
    { key: 'combat', label: 'Combattimento', icon: SwordIcon },
    { key: 'spells', label: 'Incantesimi', icon: SparklesIcon },
    { key: 'inventory', label: 'Inventario', icon: ShieldIcon },
    { key: 'bio', label: 'Biografia', icon: UserCircleIcon },
    { key: 'companions', label: 'Compagni', icon: UserGroupIcon },
];

export const CharacterSheet: React.FC = () => {
    const { characterId } = useParams<{ characterId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { character, setCharacter, updateCharacter, deleteCharacter, saveCharacter } = useCharacter();
    const { currentUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [personalityPrompt, setPersonalityPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    
    const tabParam = searchParams.get('tab') as Tab | null;
    const initialTab: Tab = tabParam && TABS.some(t => t.key === tabParam) ? tabParam : 'main';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const isNewCharacter = window.location.pathname.endsWith('/character/new');
    const savedSnapshot = useRef<string | null>(null);
    const isDirty = !!character && savedSnapshot.current !== null && JSON.stringify(character) !== savedSnapshot.current;

    // Warn before closing the tab with unsaved edits.
    useEffect(() => {
        if (!isDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    // Ask before leaving the editor (back button, header logo, browser Back) with unsaved edits.
    const dirtyRef = useRef(false);
    dirtyRef.current = isDirty;
    const bypassGuard = useRef(false);
    const blocker = useBlocker(({ currentLocation, nextLocation }) =>
        !bypassGuard.current && dirtyRef.current && currentLocation.pathname !== nextLocation.pathname);
    useEffect(() => {
        if (blocker.state !== 'blocked') return;
        confirmDialog({
            title: 'Uscire senza salvare?',
            message: 'Le modifiche a questa scheda andranno perse.',
            confirmLabel: 'Esci senza salvare',
            cancelLabel: 'Continua a modificare',
            destructive: true,
        }).then((leave) => (leave ? blocker.proceed() : blocker.reset()));
    }, [blocker]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    useEffect(() => {
        let isMounted = true;
        const loadCharacter = async () => {
            try {
                if (isMounted) setError(null);
                let loadedData;
                if (!characterId) { // Route is /character/new
                    loadedData = characterService.createNewCharacter();
                } else {
                    loadedData = await characterService.getCharacter(characterId);
                }

                if (!loadedData && characterId) {
                    if (isMounted) setError('Personaggio non trovato');
                    return;
                }

                // **MIGRAZIONE DATI**: Assicura che i personaggi vecchi abbiano le nuove proprietà.
                // Unisce i dati caricati con un personaggio "vuoto" per riempire i campi mancanti.
                const charData = { ...characterService.createNewCharacter(), ...loadedData };

                if (isMounted) {
                    savedSnapshot.current = JSON.stringify(charData);
                    setCharacter(charData);
                }
            } catch (err) {
                console.error("Failed to load character:", err);
                if (isMounted) setError('Impossibile caricare il personaggio');
            }
        };
        loadCharacter();
        return () => {
            isMounted = false;
        };
    }, [characterId, setCharacter]);

    const proficiencyBonus = useMemo(() => {
        if (!character) return 0;
        return Math.ceil(character.level / 4) + 1;
    }, [character?.level]);



    const handleSaveClick = async () => {
        if (!character) return;
        setIsSaving(true);

        try {
            const id = isNewCharacter ? `char_${Date.now()}` : character.id;
            const charToSave: ICharacter = { ...character, id, proficiencyBonus, initiative: character.initiative || 0, lastUpdated: Date.now() };
            const savedChar = await saveCharacter(charToSave);
            savedSnapshot.current = JSON.stringify(character);
            bypassGuard.current = true;
            toast.success('Scheda salvata.');

            navigate(`/character/${savedChar.id}?tab=${activeTab}`, { replace: isNewCharacter });
        } catch (error) {
            console.error("Failed to save character:", error);
            toast.error('Salvataggio non riuscito. Riprova.');
        } finally {
            setIsSaving(false);
        }
    };

    const saveRef = useRef(handleSaveClick);
    saveRef.current = handleSaveClick;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveRef.current();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const handleDeleteClick = async () => {
        if (!character) return;
        const confirmMessage = isNewCharacter
            ? { title: 'Scartare questo personaggio?', message: 'Le modifiche non verranno salvate.', confirmLabel: 'Scarta', destructive: true }
            : { title: `Eliminare ${character.name}?`, message: "L'azione non può essere annullata.", confirmLabel: 'Elimina', destructive: true };

        if (await confirmDialog(confirmMessage)) {
            try {
                await deleteCharacter(character.id);
                bypassGuard.current = true;
                navigate('/');
            } catch (error) {
                console.error("Failed to delete character:", error);
                toast.error('Eliminazione non riuscita.');
            }
        }
    };

    const handleBackClick = () => {
        if (isNewCharacter) {
            navigate('/');
        } else if (character) {
            navigate(`/character/${character.id}?tab=${activeTab}`);
        } else {
            navigate(-1);
        }
    };

    const handleCharacterImageUpload = async (dataUrl: string) => {
        if (!currentUser || !character) return;
        try {
            const imageUrl = await storageService.uploadCharacterImageFromDataUrl(dataUrl, currentUser.uid, character.id);
            updateCharacter({ imageUrl });
        } catch (error) {
            console.error("Failed to upload character portrait:", error);
            toast.error('Caricamento immagine non riuscito. Riprova.');
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!character) return;
        const { name, value, type } = e.target;
        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = parseInt(value) || 0;
        }
        updateCharacter({ [name]: processedValue });
    };



    const handleHpChange = (field: 'current' | 'max' | 'temporary', value: number) => {
        if (!character) return;
        setCharacter(prev => ({ ...prev!, hp: { ...prev!.hp, [field]: value } }));
    };

    const handleHitDiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!character) return;
        const { value } = e.target;
        setCharacter(prev => ({ ...prev!, hitDice: { ...prev!.hitDice, total: value } }));
    };

    const handleAbilityScoreChange = (ability: keyof AbilityScores, value: number) => {
        if (!character) return;
        setCharacter(prev => ({ ...prev!, abilityScores: { ...prev!.abilityScores, [ability]: value } }));
    };

    const handleSavingThrowProficiencyChange = (ability: keyof AbilityScores) => {
        if (!character) return;
        const newSavingThrows = { ...character.savingThrows };
        newSavingThrows[ability].proficient = !newSavingThrows[ability].proficient;
        setCharacter(prev => ({ ...prev!, savingThrows: newSavingThrows }));
    };

    const handleSkillProficiencyChange = (skillName: string) => {
        if (!character) return;
        const newSkills = character.skills.map(s => {
            if (s.name === skillName) {
                const isNowProficient = !s.proficient;
                const isNowExpertise = isNowProficient ? s.expertise : false;
                return { ...s, proficient: isNowProficient, expertise: isNowExpertise };
            }
            return s;
        });
        setCharacter(prev => ({ ...prev!, skills: newSkills }));
    };

    const handleSkillExpertiseChange = (skillName: string) => {
        if (!character) return;
        const newSkills = character.skills.map(s => {
            if (s.name === skillName) {
                const isNowExpertise = !s.expertise;
                const isNowProficient = isNowExpertise || s.proficient;
                return { ...s, proficient: isNowProficient, expertise: isNowExpertise };
            }
            return s;
        });
        setCharacter(prev => ({ ...prev!, skills: newSkills }));
    };

    const handleUnarmoredAbilityToggle = (ability: keyof AbilityScores) => {
        if (!character) return;
        const currentAbilities = character.unarmoredDefense?.abilities || [];
        const newAbilities = currentAbilities.includes(ability)
            ? currentAbilities.filter(a => a !== ability)
            : [...currentAbilities, ability];
        updateCharacter({ unarmoredDefense: { base: character.unarmoredDefense?.base ?? 10, abilities: newAbilities } });
    };

    const handleSpellSlotChange = (level: number, value: number) => {
        if (!character) return;
        const newSlots = { ...character.spellSlots };
        newSlots[level] = { ...newSlots[level], max: value };
        setCharacter(prev => ({ ...prev!, spellSlots: newSlots }));
    }

    const handleDefensesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!character) return;
        const { name, value } = e.target;
        setCharacter(prev => ({
            ...prev!,
            defenses: { ...prev!.defenses, [name]: value }
        }));
    };

    const handleConditionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!character) return;
        const conditionsList = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
        setCharacter(prev => ({ ...prev!, conditions: conditionsList }));
    };

    const handleGeneratePersonality = async () => {
        if (!character) return;
        setIsGenerating(true);
        const personalityFields = await geminiService.generatePersonality(character, personalityPrompt);
        setCharacter(prev => ({ ...prev!, ...personalityFields }));
        setIsGenerating(false);
    };

    const initiative = useMemo(() => {
        if (!character) return 0;
        return getModifier(character.abilityScores.dexterity);
    }, [character?.abilityScores.dexterity]);


    const { spellSaveDC, spellAttackBonus } = useMemo(() => {
        if (!character || !character.spellcastingAbility) return { spellSaveDC: '-', spellAttackBonus: '-' };
        const mod = getModifier(character.abilityScores[character.spellcastingAbility]);
        return {
            spellSaveDC: 8 + proficiencyBonus + mod,
            spellAttackBonus: formatModifier(proficiencyBonus + mod),
        };
    }, [character?.spellcastingAbility, character?.abilityScores, proficiencyBonus]);

    if (error) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
                <p className="font-cinzel text-2xl font-bold text-foreground">{error}</p>
                <Button variant="secondary" onClick={() => navigate('/')}>
                    <BackIcon className="h-4 w-4" /> Torna ai tuoi eroi
                </Button>
            </div>
        );
    }

    if (!character) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Caricamento scheda">
                <div className="h-16 animate-pulse rounded-2xl bg-muted/30" />
                <div className="h-12 animate-pulse rounded-xl bg-muted/20" />
                <div className="h-96 animate-pulse rounded-2xl bg-muted/20" />
            </div>
        );
    }

    const editorMenu: MenuItem[] = [
        ...(!isNewCharacter ? [{ label: 'Stampa scheda', icon: <PrinterIcon />, onSelect: () => window.open(`/character/${character.id}/print`, '_blank') }] : []),
        { label: isNewCharacter ? 'Scarta personaggio' : 'Elimina personaggio', icon: <TrashIcon />, onSelect: handleDeleteClick, destructive: true },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 sm:p-6">
            {/* Sticky editor bar */}
            <header className="sticky top-20 z-40 -mx-4 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
                <button
                    type="button"
                    onClick={handleBackClick}
                    aria-label={isNewCharacter ? 'Annulla creazione' : 'Torna alla scheda'}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <BackIcon className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {isNewCharacter ? 'Nuovo eroe' : 'Modifica scheda'}
                    </p>
                    <h1 className="truncate font-cinzel text-lg font-bold text-foreground sm:text-xl">
                        {character.name || (isNewCharacter ? 'Senza nome' : 'Personaggio')}
                    </h1>
                </div>
                {isDirty && (
                    <span className="hidden items-center gap-1.5 text-xs font-medium text-warning sm:flex" role="status">
                        <span className="h-2 w-2 rounded-full bg-warning" /> Modifiche non salvate
                    </span>
                )}
                <Menu
                    label="Altre azioni"
                    trigger={<EllipsisVerticalIcon className="h-5 w-5" />}
                    items={editorMenu}
                    triggerClassName="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button onClick={handleSaveClick} disabled={isSaving} title="Salva (Ctrl+S)" className="relative">
                    <SaveIcon className="h-4 w-4" />
                    {isSaving ? 'Salvataggio…' : 'Salva'}
                    {isDirty && !isSaving && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-warning sm:hidden" aria-hidden />}
                </Button>
            </header>

            <div>
                <nav className="mb-6 border-b border-border">
                    <div role="tablist" aria-label="Sezioni della scheda" className="no-scrollbar flex overflow-x-auto">
                        {TABS.map(tab => (
                            <TabButton
                                key={tab.key}
                                id={`tab-${tab.key}`}
                                label={tab.label}
                                icon={tab.icon}
                                isActive={activeTab === tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                controls={`panel-${tab.key}`} />
                        ))}
                    </div>
                </nav>

                <div id="panel-main" role="tabpanel" aria-labelledby="tab-main" hidden={activeTab !== 'main'} className="space-y-6">
                    {/* Identity Overview Hero Block */}
                    <StyledSection title="Identità">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {/* Portrait */}
                            <div className="relative group self-center sm:self-start">
                                <div className="h-32 w-32 rounded-2xl overflow-hidden bg-muted border-2 border-accent/40 shadow-inner group-hover:border-accent transition-colors">
                                    {character.imageUrl ? (
                                        <img src={character.imageUrl} alt="Ritratto del personaggio" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <PhotoIcon className="h-full w-full text-muted-foreground/30 p-6" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsUploaderOpen(true)}
                                    disabled={isNewCharacter}
                                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm text-xs font-semibold text-foreground hover:text-accent transition-colors disabled:opacity-0"
                                    title="Carica o modifica il ritratto"
                                >
                                    <PhotoIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Main Character Identity Fields */}
                            <div className="flex-1 w-full space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StyledInput label="Nome del personaggio" className="text-lg font-bold" name="name" type="text" value={character.name} onChange={handleFieldChange} placeholder="Es. Eldrin" />
                                    <StyledInput label="Giocatore" name="playerName" type="text" value={character.playerName || ''} onChange={handleFieldChange} placeholder="Il tuo nome" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <StyledInput label="Razza" name="race" value={character.race} onChange={handleFieldChange} placeholder="Umano" />
                                    <StyledInput label="Background" name="background" value={character.background} onChange={handleFieldChange} placeholder="Sapiente" />
                                    <StyledInput label="Allineamento" name="alignment" value={character.alignment} onChange={handleFieldChange} placeholder="Legale Buono" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-border/30 items-end">
                                    <div className="col-span-1 sm:col-span-2">
                                        <StyledInput label="Classe e sottoclasse" name="class" value={character.class} onChange={handleFieldChange} placeholder="Mago (Evocazione)" />
                                    </div>
                                    <div className="col-span-1">
                                        <StatInput
                                            label="Livello (1-20)"
                                            value={character.level || 1}
                                            onChange={(val) => {
                                                const lvl = Math.max(1, Math.min(20, Number(val) || 1));
                                                const newProf = Math.ceil(lvl / 4) + 1;
                                                setCharacter(prev => prev ? { ...prev, level: lvl, proficiencyBonus: newProf } : null);
                                            }}
                                            showModifier={false}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/90 mb-1.5">
                                            Campagna
                                        </label>
                                        <div className="flex gap-1.5">
                                            <select
                                                value={character.campaignId || ''}
                                                onChange={(e) => {
                                                    const selectedId = e.target.value;
                                                    if (selectedId === 'NEW') {
                                                        setIsCampaignModalOpen(true);
                                                        return;
                                                    }
                                                    const campaigns = campaignService.getCampaigns();
                                                    const selectedCamp = campaigns.find(c => c.id === selectedId);
                                                    setCharacter(prev => prev ? {
                                                        ...prev,
                                                        campaignId: selectedCamp ? selectedCamp.id : undefined,
                                                        campaignName: selectedCamp ? selectedCamp.name : (selectedId ? e.target.value : undefined)
                                                    } : null);
                                                }}
                                                className="flex-1 min-w-0 bg-background/50 border border-border/70 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
                                            >
                                                <option value="">Nessuna campagna</option>
                                                {campaignService.getCampaigns().map(camp => (
                                                    <option key={camp.id} value={camp.id}>
                                                        {camp.name}
                                                    </option>
                                                ))}
                                                <option value="NEW">+ Gestisci campagne…</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setIsCampaignModalOpen(true)}
                                                className="p-2.5 bg-accent/20 border border-accent/40 text-accent font-bold rounded-xl hover:bg-accent/30 transition-all flex items-center justify-center flex-shrink-0"
                                                title="Gestisci o unisciti a una campagna"
                                            >
                                                <UserGroupIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </StyledSection>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Colonna 2: Statistiche Vitali e Difesa */}
                        <div className="space-y-6">
                            <StyledSection title="Vita e difesa">
                                <div className="space-y-6">
                                    {/* HP Section */}
                                    <div className="bg-background/30 rounded-xl p-4 border border-border/40">
                                        <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-3 text-center">Punti vita</label>
                                        {/* Changed from grid-cols-3 to flex-col to allow buttons and values to be seen clearly */}
                                        <div className="grid grid-cols-1 gap-3">
                                            <StatInput label="PV attuali" value={character.hp.current} onChange={(val) => handleHpChange('current', Number(val))} inputClassName="text-green-500" />
                                            <StatInput label="PV massimi" value={character.hp.max} onChange={(val) => handleHpChange('max', Number(val))} />
                                            <StatInput label="PV temporanei" value={character.hp.temporary} onChange={(val) => handleHpChange('temporary', Number(val))} inputClassName="text-blue-400" />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border/30">
                                            <StyledInput label="Dadi vita" subLabel="Total Available" name="hitDice" value={character.hitDice.total} onChange={handleHitDiceChange} placeholder="e.g. 1d8" className="w-1/2 mx-auto text-center" />
                                        </div>
                                    </div>

                                    {/* AC Section */}
                                    <div className="bg-background/30 rounded-xl p-4 border border-border/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-accent uppercase tracking-widest">Difesa senza armatura</label>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <div className="w-32 flex-shrink-0">
                                                <StatInput label="CA base" value={character.unarmoredDefense?.base ?? 10} onChange={(val) => updateCharacter({ unarmoredDefense: { base: Number(val), abilities: character.unarmoredDefense?.abilities || [] } })} />
                                            </div>
                                            <div className="text-muted-foreground font-cinzel text-xl">+</div>
                                            <div className="flex-grow flex flex-wrap justify-center sm:justify-start gap-2">
                                                {ABILITIES.map(ability => (
                                                    <label key={ability} className={`
                                                        cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all
                                                        ${character.unarmoredDefense?.abilities.includes(ability)
                                                            ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_rgb(var(--color-accent)/0.4)]'
                                                            : 'bg-background/50 text-muted-foreground border-border hover:border-accent/50'}
                                                    `}>
                                                        <input type="checkbox" className="hidden" checked={character.unarmoredDefense?.abilities.includes(ability)} onChange={() => handleUnarmoredAbilityToggle(ability)} />
                                                        {ABILITY_SHORT[ability]}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Defenses */}
                                    <div className="space-y-4 pt-2">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <StyledTextArea label="Resistenze" subLabel="Half Damage" name="resistances" value={character.defenses?.resistances || ''} onChange={handleDefensesChange} placeholder="Fuoco, veleno…" rows={2} className="min-h-[80px]" />
                                            </div>
                                            <div>
                                                <StyledTextArea label="Immunità" subLabel="No Damage" name="immunities" value={character.defenses?.immunities || ''} onChange={handleDefensesChange} placeholder="Freddo, charme…" rows={2} className="min-h-[80px]" />
                                            </div>
                                        </div>
                                        <StyledInput label="Condizioni" name="conditions" value={character.conditions?.join(', ') || ''} onChange={handleConditionsChange} placeholder="Accecato, avvelenato…" />
                                    </div>
                                </div>
                            </StyledSection>
                        </div>

                        {/* Colonna 3: Statistiche di Combattimento */}
                        <div className="space-y-6">
                            <StyledSection title="Statistiche di combattimento">
                                <div className="grid grid-cols-2 gap-4">
                                    <StatBox label="Iniziativa" value={formatModifier(initiative)} />
                                    <StatInput label="Velocità" value={character.speed} onChange={(val) => updateCharacter({ speed: Number(val) })} />
                                    <StatBox label="Competenza" value={formatModifier(proficiencyBonus)} />
                                    <div className="col-span-2">
                                        <StyledSection title="" className="!p-3 !bg-background/20 !border-border/30">
                                            <label htmlFor="spellcastingAbility" className="block text-xs font-bold text-accent uppercase tracking-widest pl-1 mb-2">Caratteristica da incantatore</label>
                                            <select
                                                id="spellcastingAbility"
                                                name="spellcastingAbility"
                                                value={character.spellcastingAbility}
                                                onChange={handleFieldChange}
                                                className="block w-full bg-background/50 border border-border/50 rounded-xl shadow-sm py-2.5 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent sm:text-sm transition-all"
                                            >
                                                <option value="">Nessuna</option>
                                                {ABILITIES.map(ability => (<option key={ability} value={ability}>{ABILITY_LABELS[ability]}</option>))}
                                            </select>
                                        </StyledSection>
                                    </div>
                                    <StatBox label="CD incantesimi" value={String(spellSaveDC)} />
                                    <StatBox label="Attacco con incantesimi" value={String(spellAttackBonus)} />
                                </div>
                            </StyledSection>
                        </div>
                    </div>
                </div>


                <div id="panel-stats" role="tabpanel" aria-labelledby="tab-stats" hidden={activeTab !== 'stats'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ABILITIES.map(abilityKey => {
                            const abilityScore = character.abilityScores[abilityKey];
                            const abilityModifier = getModifier(abilityScore);
                            const savingThrow = character.savingThrows[abilityKey];
                            const savingThrowBonus = abilityModifier + (savingThrow.proficient ? proficiencyBonus : 0);
                            const relevantSkills = character.skills.filter(s => s.ability === abilityKey);

                            return (
                                <StyledSection
                                    key={abilityKey}
                                    className="!p-0 overflow-hidden flex flex-col h-full border-accent/20 hover:border-accent/40 transition-colors duration-300"
                                >
                                    {/* Header Card */}
                                    <div className="bg-accent/10 p-4 border-b border-accent/20 flex items-center justify-between relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                            {/* Icona opzionale o pattern qui */}
                                            <span className="text-6xl font-cinzel font-bold">{abilityKey.charAt(0).toUpperCase()}</span>
                                        </div>

                                        <div className="z-10">
                                            <h3 className="text-xl font-cinzel font-bold text-accent">{ABILITY_LABELS[abilityKey]}</h3>
                                            <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Punteggio</div>
                                        </div>

                                        <div className="z-10 flex flex-col items-center bg-background/50 backdrop-blur-md rounded-xl border border-accent/30 p-2 shadow-sm min-w-[70px]">
                                            <span className="text-2xl font-bold text-foreground">{formatModifier(abilityModifier)}</span>
                                            <div className="w-8 h-[1px] bg-accent/50 my-1"></div>
                                            <input
                                                type="number"
                                                value={abilityScore}
                                                onChange={(e) => handleAbilityScoreChange(abilityKey, Number(e.target.value))}
                                                className="w-12 text-center bg-transparent text-sm font-bold text-muted-foreground focus:outline-none focus:text-accent no-spinner"
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-4 flex-grow bg-card/20">
                                        {/* Saving Throw */}
                                        <div className={`
                                            flex items-center justify-between p-3 rounded-xl border transition-all duration-200
                                            ${savingThrow.proficient
                                                ? 'bg-accent/10 border-accent/30 shadow-sm'
                                                : 'bg-background/30 border-border/40 hover:bg-background/50'}
                                        `}>
                                            <label htmlFor={`saving-throw-${abilityKey}`} className="flex items-center gap-3 cursor-pointer select-none">
                                                <div className={`
                                                    w-5 h-5 rounded-md flex items-center justify-center border transition-colors
                                                    ${savingThrow.proficient ? 'bg-accent border-accent text-accent-foreground' : 'border-muted-foreground/50 text-transparent'}
                                                `}>
                                                    <input
                                                        type="checkbox"
                                                        id={`saving-throw-${abilityKey}`}
                                                        className="hidden"
                                                        checked={savingThrow.proficient}
                                                        onChange={() => handleSavingThrowProficiencyChange(abilityKey)}
                                                    />
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <span className={`text-sm font-bold uppercase tracking-wider ${savingThrow.proficient ? 'text-accent' : 'text-muted-foreground'}`}>Tiro salvezza</span>
                                            </label>
                                            <span className="font-mono font-bold text-lg">{formatModifier(savingThrowBonus)}</span>
                                        </div>

                                        {/* Skills Divider */}
                                        {relevantSkills.length > 0 && <div className="h-px bg-border/40 w-full my-2"></div>}

                                        {/* Skills List */}
                                        <div className="space-y-2">
                                            {relevantSkills.map(skill => {
                                                const skillBonus = abilityModifier + (skill.proficient ? proficiencyBonus : 0) + (skill.expertise ? proficiencyBonus : 0);
                                                return (
                                                    <div key={skill.name} className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/10 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex gap-1">
                                                                {/* Proficient Checkbox */}
                                                                <label
                                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-all ${skill.proficient ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary/50'}`}
                                                                    title="Competenza"
                                                                >
                                                                    <input type="checkbox" className="hidden" checked={skill.proficient} onChange={() => handleSkillProficiencyChange(skill.name)} />
                                                                    {skill.proficient && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                                                                </label>
                                                                {/* Expertise Checkbox */}
                                                                <label
                                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-all ${skill.expertise ? 'bg-accent border-accent' : 'border-muted-foreground/40 hover:border-accent/50'}`}
                                                                    title="Maestria (competenza doppia)"
                                                                >
                                                                    <input type="checkbox" className="hidden" checked={skill.expertise} onChange={() => handleSkillExpertiseChange(skill.name)} />
                                                                    {skill.expertise && <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
                                                                </label>
                                                            </div>
                                                            <span className={`text-sm transition-colors ${skill.proficient ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{skillLabel(skill.name)}</span>
                                                        </div>
                                                        <span className={`font-mono font-bold text-sm ${skill.proficient ? 'text-accent' : 'text-muted-foreground/70'}`}>{formatModifier(skillBonus)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </StyledSection>
                            );
                        })}
                    </div>
                </div>

                <div id="panel-combat" role="tabpanel" aria-labelledby="tab-combat" hidden={activeTab !== 'combat'} className="min-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <div className="space-y-6">
                            <AttackList />
                        </div>
                        <div className="space-y-6">
                            <CategorizedFeatureList />
                        </div>
                    </div>
                </div>

                <div id="panel-bio" role="tabpanel" aria-labelledby="tab-bio" hidden={activeTab !== 'bio'} className="min-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="col-span-1 lg:col-span-2">
                            <StyledSection title="Identità" className="h-full">
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center sm:flex-row gap-6">
                                        <div className="relative group">
                                            <div className="h-32 w-32 rounded-2xl overflow-hidden bg-muted border-2 border-border/50 shadow-inner group-hover:border-accent/50 transition-colors">
                                                {character.imageUrl ? (
                                                    <img src={character.imageUrl} alt="Ritratto del personaggio" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                ) : (
                                                    <PhotoIcon className="h-full w-full text-muted-foreground/30 p-6" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsUploaderOpen(true)}
                                                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm text-xs font-semibold text-foreground hover:text-accent transition-colors"
                                            >
                                                <PhotoIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            {/* Row 1: Names */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <StyledInput label="Nome del personaggio" className="text-lg font-bold" name="name" type="text" value={character.name} onChange={handleFieldChange} placeholder="Es. Eldrin" />
                                                <StyledInput label="Giocatore" name="playerName" type="text" value={character.playerName} onChange={handleFieldChange} placeholder="Il tuo nome" />
                                            </div>

                                            {/* Row 2: Origin */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <StyledInput label="Razza" name="race" value={character.race} onChange={handleFieldChange} placeholder="Umano" />
                                                <StyledInput label="Background" name="background" value={character.background} onChange={handleFieldChange} placeholder="Sapiente" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/30">
                                        <div className="col-span-1 sm:col-span-2">
                                            <StyledInput label="Classe e sottoclasse" name="class" value={character.class} onChange={handleFieldChange} placeholder="Mago (Invocazione)" />
                                        </div>
                                        <div className="col-span-1">
                                            <StatInput label="Livello" value={character.level} onChange={(val) => updateCharacter({ level: Number(val) })} className="w-full" showModifier={false} inputClassName="text-2xl" />
                                        </div>
                                        <div className="col-span-1">
                                            <StyledInput label="PE" name="experiencePoints" type="number" value={character.experiencePoints} onChange={handleFieldChange} placeholder="0" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <StyledInput label="Allineamento" name="alignment" value={character.alignment} onChange={handleFieldChange} />
                                        <StyledInput label="Lingue" name="languages" value={character.languages} onChange={handleFieldChange} />
                                    </div>
                                </div>
                            </StyledSection>
                        </div>
                        <div className="space-y-6">
                            <StyledSection title="Personalità">
                                <div className="space-y-4">
                                    <StyledTextArea label="Tratti caratteriali" name="personalityTraits" value={character.personalityTraits} onChange={handleFieldChange} />
                                    <StyledTextArea label="Ideali" name="ideals" value={character.ideals} onChange={handleFieldChange} />
                                    <StyledTextArea label="Legami" name="bonds" value={character.bonds} onChange={handleFieldChange} />
                                    <StyledTextArea label="Difetti" name="flaws" value={character.flaws} onChange={handleFieldChange} />
                                </div>
                            </StyledSection>
                        </div>
                        <div className="space-y-6">
                            <StyledSection title="Generatore IA" className="border-accent/30 bg-accent/5">
                                <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-3">Genera la personalità</h3>
                                <div className="space-y-3">
                                    <StyledInput
                                        label="Tema o spunto"
                                        name="aiPrompt"
                                        placeholder="Es. «ladro orfano dal passato tragico», «paladino nobile»"
                                        value={personalityPrompt}
                                        onChange={(e) => setPersonalityPrompt(e.target.value)}
                                    />
                                    <button
                                        onClick={handleGeneratePersonality}
                                        disabled={isGenerating}
                                        className="flex w-full justify-center items-center gap-2 text-sm font-bold uppercase tracking-wider bg-accent/90 hover:bg-accent text-accent-foreground px-4 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                        {isGenerating ? 'Sto tessendo il destino…' : 'Genera con l\'IA'}
                                    </button>
                                </div>
                            </StyledSection>

                            <StyledSection title="Note di campagna">
                                <div className="space-y-4">
                                    <StyledTextArea label="Note generali" name="notes" value={character.notes} onChange={handleFieldChange} placeholder="Eventi e diario della campagna…" className="min-h-[200px]" />
                                    <StyledTextArea label="Note del DM" subLabel="Secrets" name="dmNotes" value={character.dmNotes} onChange={handleFieldChange} placeholder="Note private…" />
                                </div>
                            </StyledSection>
                        </div>
                    </div>
                </div>

                <div id="panel-inventory" role="tabpanel" aria-labelledby="tab-inventory" hidden={activeTab !== 'inventory'} className="min-h-[60vh]">
                    <EquipmentList />
                </div>

                <div id="panel-spells" role="tabpanel" aria-labelledby="tab-spells" hidden={activeTab !== 'spells'} className="min-h-[60vh] space-y-6">
                    <StyledSection title="Slot incantesimo e risorse">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-background/20 rounded-xl p-4 border border-border/40">
                                <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-4">Slot incantesimo massimi</label>
                                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
                                    {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
                                        <StatInput key={level} label={`Lvl ${level}`} value={character.spellSlots[level]?.max ?? 0} onChange={(val) => handleSpellSlotChange(level, Number(val))} />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-background/20 rounded-xl p-4 border border-border/40">
                                <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-4">Risorse personalizzate</label>
                                <CustomResourceEditor character={character} onUpdateCharacter={updateCharacter} />
                            </div>
                        </div>
                    </StyledSection>

                    <div className="pt-2">
                        <Spellbook />
                    </div>
                </div>

                <div id="panel-companions" role="tabpanel" aria-labelledby="tab-companions" hidden={activeTab !== 'companions'} className="min-h-[60vh]">
                    <CompanionTab />
                </div>
            </div>
            <ImageUploader
                isOpen={isUploaderOpen}
                onClose={() => setIsUploaderOpen(false)}
                onImageReady={handleCharacterImageUpload} />
            <CampaignManagerModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                selectedCampaignId={character.campaignId}
                onSelectCampaign={(camp) => {
                    setCharacter(prev => prev ? {
                        ...prev,
                        campaignId: camp ? camp.id : undefined,
                        campaignName: camp ? camp.name : undefined
                    } : null);
                }}
            />
        </div>
    );
};