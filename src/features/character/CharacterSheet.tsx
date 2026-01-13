import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICharacter, AbilityScores, Currency } from './characterTypes';
import { useCharacter } from './CharacterProvider';
import * as characterService from './characterService';
import * as storageService from '../../services/storageService';
import * as geminiService from '../../services/geminiService';
import { SparklesIcon, BackIcon, SaveIcon, TrashIcon, PhotoIcon } from '../../components/ui/icons';
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


// --- Type Aliases & Helpers ---
type Tab = 'main' | 'stats' | 'combat' | 'bio' | 'spells' | 'inventory' | 'companions';
const ABILITIES: (keyof AbilityScores)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

// --- Sub-components ---
const TabButton = ({ label, isActive, onClick, controls, id }: { label: string, isActive: boolean, onClick: () => void, controls: string, id: string }) => (
    <button
        id={id}
        role="tab"
        aria-selected={isActive}
        aria-controls={controls}
        onClick={onClick}
        className={`px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap relative group ${isActive
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

// --- Main Component ---
const TABS: { key: Tab; label: string }[] = [
    { key: 'main', label: 'Main' },
    { key: 'stats', label: 'Stats & Skills' },
    { key: 'combat', label: 'Combat & Features' },
    { key: 'bio', label: 'Biography & Notes' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'spells', label: 'Spells' },
    { key: 'companions', label: 'Companions' },
];

export const CharacterSheet: React.FC = () => {
    const { characterId } = useParams<{ characterId: string }>();
    const navigate = useNavigate();
    const { character, setCharacter, updateCharacter, deleteCharacter, saveCharacter } = useCharacter();
    const { currentUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [personalityPrompt, setPersonalityPrompt] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('main');
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const isNewCharacter = window.location.pathname.endsWith('/character/new');

    useEffect(() => {
        let isMounted = true;
        const loadCharacter = async () => {
            let loadedData;
            if (!characterId) { // Route is /character/new
                loadedData = { ...characterService.createNewCharacter(), id: 'temp_new' };
            } else {
                loadedData = await characterService.getCharacter(characterId);
            }

            // **MIGRAZIONE DATI**: Assicura che i personaggi vecchi abbiano le nuove proprietà.
            // Unisce i dati caricati con un personaggio "vuoto" per riempire i campi mancanti.
            const charData = { ...characterService.createNewCharacter(), ...loadedData };

            if (isMounted) {
                setCharacter(charData);
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
            // If it's a new character, generate a permanent ID.
            const id = isNewCharacter ? `char_${Date.now()}` : character.id;

            // The ImageUploader now handles its own uploads and updates the character state directly.
            // We just need to save the character object as it is.
            const charToSave: ICharacter = { ...character, id, proficiencyBonus, initiative, lastUpdated: Date.now() };
            const savedChar = await saveCharacter(charToSave);

            // Navigate to the character's play view.
            // If it was a new character, replace the '/new' URL in history to prevent duplicates.
            navigate(`/character/${savedChar.id}`, { replace: isNewCharacter });
        } catch (error) {
            console.error("Failed to save character:", error);
            alert("An error occurred while saving. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = async () => {
        if (character && !isNewCharacter && window.confirm(`Are you sure you want to permanently delete ${character.name}?`)) {
            try {
                await deleteCharacter(character.id); // Usa la funzione dal context
                navigate('/'); // Naviga alla home, che ora si riaggiornerà correttamente
            } catch (error) {
                console.error("Failed to delete character:", error);
                alert("An error occurred while deleting the character.");
            }
        }
    };

    const handleBackClick = () => {
        if (isNewCharacter) {
            navigate('/');
        } else if (character) {
            navigate(`/character/${character.id}`);
        } else {
            navigate(-1); // Go back in history as a fallback
        }
    };

    const handleCharacterImageUpload = async (dataUrl: string) => {
        if (!currentUser || !character || isNewCharacter) return;
        try {
            const imageUrl = await storageService.uploadCharacterImageFromDataUrl(dataUrl, currentUser.uid, character.id);
            updateCharacter({ imageUrl });
        } catch (error) {
            console.error("Failed to upload character portrait:", error);
            alert("Error uploading image. Please try again.");
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

    const handleCurrencyChange = (currency: keyof Currency, value: number) => {
        if (!character) return;
        setCharacter(prev => ({ ...prev!, currency: { ...prev!.currency, [currency]: value } }));
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

    if (!character) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:pt-8">
            {/* Header with responsive layout for controls */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-muted-foreground transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] self-start"
                    aria-label={isNewCharacter ? 'Cancel Creation' : 'Back to Play View'}
                >
                    <BackIcon className="w-5 h-5" />
                    <span>{isNewCharacter ? 'Cancel Creation' : 'Back to Play'}</span>
                </button>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isNewCharacter && (
                        <button
                            onClick={handleDeleteClick}
                            className="flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-destructive transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
                            aria-label="Delete Character"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-md px-3 py-2 font-bold text-primary transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] disabled:text-muted-foreground/60 disabled:scale-100 disabled:cursor-not-allowed disabled:[text-shadow:none]"
                    >
                        <SaveIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        <span className="sm:hidden">{isSaving ? '...' : 'Save'}</span>
                    </button>
                </div>
            </header>

            <div className="bg-card border border-border shadow-lg shadow-accent/5 rounded-lg p-4 sm:p-6">
                <div role="tablist" aria-label="Character Sheet Sections" className="flex space-x-1 mb-6 border-b border-border overflow-x-auto">
                    {TABS.map(tab => (
                        <TabButton
                            key={tab.key}
                            id={`tab-${tab.key}`}
                            label={tab.label}
                            isActive={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            controls={`panel-${tab.key}`} />
                    ))}
                </div>

                <div id="panel-main" role="tabpanel" aria-labelledby="tab-main" hidden={activeTab !== 'main'}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Colonna 2: Statistiche Vitali e Difesa */}
                        <div className="space-y-6">
                            <StyledSection title="Vitals & Defense">
                                <div className="space-y-6">
                                    {/* HP Section */}
                                    <div className="bg-background/30 rounded-xl p-4 border border-border/40">
                                        <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-3 text-center">Hit Points</label>
                                        {/* Changed from grid-cols-3 to flex-col to allow buttons and values to be seen clearly */}
                                        <div className="grid grid-cols-1 gap-3">
                                            <StatInput label="Current HP" value={character.hp.current} onChange={(val) => handleHpChange('current', Number(val))} inputClassName="text-green-500" />
                                            <StatInput label="Max HP" value={character.hp.max} onChange={(val) => handleHpChange('max', Number(val))} />
                                            <StatInput label="Temp HP" value={character.hp.temporary} onChange={(val) => handleHpChange('temporary', Number(val))} inputClassName="text-blue-400" />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border/30">
                                            <StyledInput label="Hit Dice" subLabel="Total Available" name="hitDice" value={character.hitDice.total} onChange={handleHitDiceChange} placeholder="e.g. 1d8" className="w-1/2 mx-auto text-center" />
                                        </div>
                                    </div>

                                    {/* AC Section */}
                                    <div className="bg-background/30 rounded-xl p-4 border border-border/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-accent uppercase tracking-widest">Unarmored Defense</label>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <div className="w-32 flex-shrink-0">
                                                <StatInput label="Base AC" value={character.unarmoredDefense?.base ?? 10} onChange={(val) => updateCharacter({ unarmoredDefense: { base: Number(val), abilities: character.unarmoredDefense?.abilities || [] } })} />
                                            </div>
                                            <div className="text-muted-foreground font-cinzel text-xl">+</div>
                                            <div className="flex-grow flex flex-wrap justify-center sm:justify-start gap-2">
                                                {ABILITIES.map(ability => (
                                                    <label key={ability} className={`
                                                        cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all
                                                        ${character.unarmoredDefense?.abilities.includes(ability)
                                                            ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_rgba(var(--color-accent),0.4)]'
                                                            : 'bg-background/50 text-muted-foreground border-border hover:border-accent/50'}
                                                    `}>
                                                        <input type="checkbox" className="hidden" checked={character.unarmoredDefense?.abilities.includes(ability)} onChange={() => handleUnarmoredAbilityToggle(ability)} />
                                                        {ability.substring(0, 3)}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Defenses */}
                                    <div className="space-y-4 pt-2">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <StyledTextArea label="Resistances" subLabel="Half Damage" name="resistances" value={character.defenses?.resistances || ''} onChange={handleDefensesChange} placeholder="Fire, Poison..." rows={2} className="min-h-[80px]" />
                                            </div>
                                            <div>
                                                <StyledTextArea label="Immunities" subLabel="No Damage" name="immunities" value={character.defenses?.immunities || ''} onChange={handleDefensesChange} placeholder="Cold, Charm..." rows={2} className="min-h-[80px]" />
                                            </div>
                                        </div>
                                        <StyledInput label="Conditions" name="conditions" value={character.conditions?.join(', ') || ''} onChange={handleConditionsChange} placeholder="Blinded, Poisoned..." />
                                    </div>
                                </div>
                            </StyledSection>
                        </div>

                        {/* Colonna 3: Statistiche di Combattimento */}
                        <div className="space-y-6">
                            <StyledSection title="Combat Stats">
                                <div className="grid grid-cols-2 gap-4">
                                    <StatBox label="Initiative" value={formatModifier(initiative)} />
                                    <StatInput label="Speed" value={character.speed} onChange={(val) => updateCharacter({ speed: Number(val) })} />
                                    <StatBox label="Proficiency" value={formatModifier(proficiencyBonus)} />
                                    <div className="col-span-2">
                                        <StyledSection title="" className="!p-3 !bg-background/20 !border-border/30">
                                            <label htmlFor="spellcastingAbility" className="block text-xs font-bold text-accent uppercase tracking-widest pl-1 mb-2">Spellcasting Ability</label>
                                            <select
                                                id="spellcastingAbility"
                                                name="spellcastingAbility"
                                                value={character.spellcastingAbility}
                                                onChange={handleFieldChange}
                                                className="block w-full bg-background/50 border border-border/50 rounded-xl shadow-sm py-2.5 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent sm:text-sm transition-all"
                                            >
                                                <option value="">None</option>
                                                {ABILITIES.map(ability => (<option key={ability} value={ability} className="capitalize">{ability}</option>))}
                                            </select>
                                        </StyledSection>
                                    </div>
                                    <StatBox label="Spell Save DC" value={String(spellSaveDC)} />
                                    <StatBox label="Spell Attack" value={String(spellAttackBonus)} />
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
                                            <h3 className="text-xl font-cinzel font-bold text-accent capitalize">{abilityKey}</h3>
                                            <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Ability Score</div>
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
                                                <span className={`text-sm font-bold uppercase tracking-wider ${savingThrow.proficient ? 'text-accent' : 'text-muted-foreground'}`}>Saving Throw</span>
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
                                                                    title="Proficiency"
                                                                >
                                                                    <input type="checkbox" className="hidden" checked={skill.proficient} onChange={() => handleSkillProficiencyChange(skill.name)} />
                                                                    {skill.proficient && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                                                                </label>
                                                                {/* Expertise Checkbox */}
                                                                <label
                                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-all ${skill.expertise ? 'bg-accent border-accent' : 'border-muted-foreground/40 hover:border-accent/50'}`}
                                                                    title="Expertise (Double Proficiency)"
                                                                >
                                                                    <input type="checkbox" className="hidden" checked={skill.expertise} onChange={() => handleSkillExpertiseChange(skill.name)} />
                                                                    {skill.expertise && <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
                                                                </label>
                                                            </div>
                                                            <span className={`text-sm transition-colors ${skill.proficient ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{skill.name}</span>
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
                    <div className="flex flex-col lg:flex-row gap-6 h-full">
                        <div className="flex-1 lg:w-1/2 flex flex-col p-4 border border-border rounded-lg">
                            <AttackList />
                        </div>
                        <div className="flex-1 lg:w-1/2 flex flex-col p-4 border border-border rounded-lg">
                            <CategorizedFeatureList />
                        </div>
                    </div>
                </div>

                <div id="panel-bio" role="tabpanel" aria-labelledby="tab-bio" hidden={activeTab !== 'bio'} className="min-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="col-span-1 lg:col-span-2">
                            <StyledSection title="Identity" className="h-full">
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center sm:flex-row gap-6">
                                        <div className="relative group">
                                            <div className="h-32 w-32 rounded-2xl overflow-hidden bg-muted border-2 border-border/50 shadow-inner group-hover:border-accent/50 transition-colors">
                                                {character.imageUrl ? (
                                                    <img src={character.imageUrl} alt="Character portrait" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                ) : (
                                                    <PhotoIcon className="h-full w-full text-muted-foreground/30 p-6" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsUploaderOpen(true)}
                                                disabled={isNewCharacter}
                                                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm text-xs font-semibold text-foreground hover:text-accent transition-colors disabled:opacity-0"
                                            >
                                                <PhotoIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            {/* Row 1: Names */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <StyledInput label="Character Name" className="text-lg font-bold" name="name" type="text" value={character.name} onChange={handleFieldChange} placeholder="e.g., Eldrin" />
                                                <StyledInput label="Player Name" name="playerName" type="text" value={character.playerName} onChange={handleFieldChange} placeholder="Your Name" />
                                            </div>

                                            {/* Row 2: Origin */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <StyledInput label="Race" name="race" value={character.race} onChange={handleFieldChange} placeholder="Human" />
                                                <StyledInput label="Background" name="background" value={character.background} onChange={handleFieldChange} placeholder="Sage" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/30">
                                        <div className="col-span-1 sm:col-span-2">
                                            <StyledInput label="Class & Subclass" name="class" value={character.class} onChange={handleFieldChange} placeholder="Wizard (Evocation)" />
                                        </div>
                                        <div className="col-span-1">
                                            <StatInput label="Level" value={character.level} onChange={(val) => updateCharacter({ level: Number(val) })} className="w-full" showModifier={false} inputClassName="text-2xl" />
                                        </div>
                                        <div className="col-span-1">
                                            <StyledInput label="XP" name="experiencePoints" type="number" value={character.experiencePoints} onChange={handleFieldChange} placeholder="0" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <StyledInput label="Alignment" name="alignment" value={character.alignment} onChange={handleFieldChange} />
                                        <StyledInput label="Languages" name="languages" value={character.languages} onChange={handleFieldChange} />
                                    </div>
                                </div>
                            </StyledSection>
                        </div>
                        <div className="space-y-6">
                            <StyledSection title="Personality">
                                <div className="space-y-4">
                                    <StyledTextArea label="Personality Traits" name="personalityTraits" value={character.personalityTraits} onChange={handleFieldChange} />
                                    <StyledTextArea label="Ideals" name="ideals" value={character.ideals} onChange={handleFieldChange} />
                                    <StyledTextArea label="Bonds" name="bonds" value={character.bonds} onChange={handleFieldChange} />
                                    <StyledTextArea label="Flaws" name="flaws" value={character.flaws} onChange={handleFieldChange} />
                                </div>
                            </StyledSection>
                        </div>
                        <div className="space-y-6">
                            <StyledSection title="AI Generator" className="border-accent/30 bg-accent/5">
                                <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-3">Generate Personality</h3>
                                <div className="space-y-3">
                                    <StyledInput
                                        label="Theme / Prompt"
                                        name="aiPrompt"
                                        placeholder="e.g. 'Tragic orphan rogue', 'Noble paladin'"
                                        value={personalityPrompt}
                                        onChange={(e) => setPersonalityPrompt(e.target.value)}
                                    />
                                    <button
                                        onClick={handleGeneratePersonality}
                                        disabled={isGenerating}
                                        className="flex w-full justify-center items-center gap-2 text-sm font-bold uppercase tracking-wider bg-accent/90 hover:bg-accent text-accent-foreground px-4 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                        {isGenerating ? 'Weaving Fate...' : 'Generate with AI'}
                                    </button>
                                </div>
                            </StyledSection>

                            <StyledSection title="Campaign Notes">
                                <div className="space-y-4">
                                    <StyledTextArea label="General Notes" name="notes" value={character.notes} onChange={handleFieldChange} placeholder="Campaign events, logs..." className="min-h-[200px]" />
                                    <StyledTextArea label="DM Notes" subLabel="Secrets" name="dmNotes" value={character.dmNotes} onChange={handleFieldChange} placeholder="Private notes..." />
                                </div>
                            </StyledSection>
                        </div>
                    </div>
                </div>

                <div id="panel-inventory" role="tabpanel" aria-labelledby="tab-inventory" hidden={activeTab !== 'inventory'} className="min-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <StyledSection title="Currency" className="sticky top-6">
                                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
                                    {(Object.keys(character.currency) as Array<keyof Currency>).map((type) => (
                                        <StatInput key={type} label={type.toUpperCase()} value={character.currency[type]} onChange={(val) => handleCurrencyChange(type, Number(val))} inputClassName="text-2xl" />
                                    ))}
                                </div>
                            </StyledSection>
                        </div>
                        <div className="lg:col-span-2">
                            <StyledSection title="Equipment" className="min-h-[500px]">
                                <EquipmentList />
                            </StyledSection>
                        </div>
                    </div>
                </div>

                <div id="panel-spells" role="tabpanel" aria-labelledby="tab-spells" hidden={activeTab !== 'spells'} className="min-h-[60vh] space-y-6">
                    <StyledSection title="Spell Slots & Resources">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-background/20 rounded-xl p-4 border border-border/40">
                                <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-4">Maximum Spell Slots</label>
                                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
                                    {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
                                        <StatInput key={level} label={`Lvl ${level}`} value={character.spellSlots[level]?.max ?? 0} onChange={(val) => handleSpellSlotChange(level, Number(val))} />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-background/20 rounded-xl p-4 border border-border/40">
                                <label className="block text-xs font-bold text-accent uppercase tracking-widest mb-4">Custom Resources</label>
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
        </div >
    );
};