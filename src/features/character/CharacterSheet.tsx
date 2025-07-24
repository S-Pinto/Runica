import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICharacter, AbilityScores, Currency, Skill } from './characterTypes';
import { useCharacter } from './CharacterProvider';
import * as characterService from './characterService';
import * as storageService from '../../services/storageService';
import * as geminiService from '../../services/geminiService';
import { SparklesIcon, BackIcon, SaveIcon, TrashIcon, PhotoIcon } from '../../components/ui/icons';
import { ImageUploader } from './components/ImageUploader';
import { Spellbook } from './components/Spellbook';
import { FeatureList } from './components/FeatureList';
import { EquipmentList } from './components/EquipmentList';
import { AttackList } from './components/AttackList';
import { CustomResourceEditor } from './components/CustomResourceEditor'; 
import { useAuth } from '../../providers/AuthProvider';
import { StatBox } from './components/ui/StatBox';
import { CompanionTab } from './components/CompanionTab';
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
        className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            isActive
                ? 'bg-card text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:bg-muted border-b-2 border-transparent'
        }`}
    >
        {label}
    </button>
);

const InputField = ({label, name, type, value, onChange, placeholder, className}: {label: string; name: string; type: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; className?:string;}) => (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-muted-foreground capitalize">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent sm:text-sm"
      />
    </div>
);

const TextAreaInput = ({ label, name, value, onChange, placeholder }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; }) => (
    <div className="bg-card p-4 rounded-lg border border-border flex flex-col">
        <h3 className="text-lg font-semibold text-accent mb-2">{label}</h3>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-input border border-border rounded-md p-3 text-foreground focus:ring-ring focus:border-accent resize-y flex-grow min-h-[100px]"
            placeholder={placeholder || `Your character's ${label.toLowerCase()}...`}
        />
    </div>
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
        setCharacter(prev => ({...prev!, currency: {...prev!.currency, [currency]: value }}));
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
        setCharacter(prev => ({...prev!, savingThrows: newSavingThrows}));
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

    const handleUnarmoredBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!character) return;
        const newBase = parseInt(e.target.value, 10) || 0;
        updateCharacter({ unarmoredDefense: { base: newBase, abilities: character.unarmoredDefense?.abilities || [] } });
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
        setCharacter(prev => ({...prev!, spellSlots: newSlots }));
    }
    
    const handleGeneratePersonality = async () => {
        if (!character) return;
        setIsGenerating(true);
        const personalityFields = await geminiService.generatePersonality(character, personalityPrompt);
        setCharacter(prev => ({...prev!, ...personalityFields}));
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Colonna 1: Info Personaggio */}
                        <div className="space-y-6">
                            <div className="p-4 border border-border rounded-lg space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-muted-foreground">Character Portrait</label>
                                    <div className="flex items-center gap-4">
                                        <span className="inline-block h-24 w-24 rounded-lg overflow-hidden bg-muted">
                                            {character.imageUrl ? (
                                                <img src={character.imageUrl} alt="Character portrait" className="h-full w-full object-cover" />
                                            ) : (
                                                <PhotoIcon className="h-full w-full text-muted-foreground p-4" />
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setIsUploaderOpen(true)}
                                            disabled={isNewCharacter}
                                            className="cursor-pointer rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    {isNewCharacter && (
                                        <p className="text-xs text-muted-foreground">Save the character to enable the image uploader.</p>
                                    )}
                                </div>
                                <InputField label="Character Name" name="name" type="text" value={character.name} onChange={handleFieldChange} placeholder="e.g., Eldrin" />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Class" name="class" type="text" value={character.class} onChange={handleFieldChange} placeholder="e.g., Wizard" />
                                    <InputField label="Subclass" name="subclass" type="text" value={character.subclass} onChange={handleFieldChange} placeholder="e.g., School of Evocation" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Race" name="race" type="text" value={character.race} onChange={handleFieldChange} placeholder="e.g., High-Elf" />
                                    <InputField label="Background" name="background" type="text" value={character.background} onChange={handleFieldChange} placeholder="e.g., Sage" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Alignment" name="alignment" type="text" value={character.alignment} onChange={handleFieldChange} placeholder="e.g., Chaotic Good" />
                                    <InputField label="Level" name="level" type="number" value={character.level} onChange={handleFieldChange} />
                                </div>
                                <InputField label="Languages" name="languages" type="text" value={character.languages} onChange={handleFieldChange} placeholder="e.g., Common, Elvish" />
                            </div>
                        </div>

                        {/* Colonna 2: Statistiche Vitali e Difesa */}
                        <div className="space-y-6">
                            <div className="p-4 border border-border rounded-lg space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Hit Points</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label htmlFor="hp-current" className="block text-xs font-medium text-muted-foreground text-center">Current</label>
                                            <input id="hp-current" type="number" value={character.hp.current} onChange={(e) => handleHpChange('current', parseInt(e.target.value) || 0)} className="mt-1 w-full bg-input border border-border rounded-md py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent text-center" />
                                        </div>
                                        <div>
                                            <label htmlFor="hp-max" className="block text-xs font-medium text-muted-foreground text-center">Max</label>
                                            <input id="hp-max" type="number" value={character.hp.max} onChange={(e) => handleHpChange('max', parseInt(e.target.value) || 0)} className="mt-1 w-full bg-input border border-border rounded-md py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent text-center" />
                                        </div>
                                        <div>
                                            <label htmlFor="hp-temporary" className="block text-xs font-medium text-muted-foreground text-center">Temporary</label>
                                            <input id="hp-temporary" type="number" value={character.hp.temporary} onChange={(e) => handleHpChange('temporary', parseInt(e.target.value) || 0)} className="mt-1 w-full bg-input border border-border rounded-md py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent text-center" />
                                        </div>
                                    </div>
                                </div>
                                <InputField label="Hit Dice" name="hitDice" type="text" value={character.hitDice.total} onChange={handleHitDiceChange} placeholder="e.g. 1d8" />
                            </div>
                            <div className="p-4 border border-border rounded-lg space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Unarmored Defense</h4>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-center">
                                        <input id="unarmoredBase" type="number" name="unarmoredBase" value={character.unarmoredDefense?.base ?? 10} onChange={handleUnarmoredBaseChange} className="w-24 bg-input border border-border rounded-md py-1 px-2 text-foreground text-center focus:outline-none focus:ring-ring focus:border-accent" aria-label="Base Armor Class" />
                                        <label htmlFor="unarmoredBase" className="text-xs text-muted-foreground mt-1">Base AC</label>
                                    </div>
                                    <span className="text-xl text-muted-foreground"> + </span>
                                    <div className="flex-1">
                                        <div className="grid grid-cols-3 gap-2">
                                            {ABILITIES.map(ability => (
                                                <div key={ability} className="flex flex-col items-center">
                                                    <input type="checkbox" id={`unarmored-${ability}`} checked={character.unarmoredDefense?.abilities.includes(ability)} onChange={() => handleUnarmoredAbilityToggle(ability)} className="w-4 h-4 rounded-full text-primary bg-input border-border focus:ring-ring cursor-pointer" />
                                                    <label htmlFor={`unarmored-${ability}`} className="text-xs text-muted-foreground mt-1 uppercase">{ability.substring(0, 3)}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colonna 3: Statistiche di Combattimento */}
                        <div className="space-y-6">
                            <div className="p-4 border border-border rounded-lg grid grid-cols-2 gap-4">
                                <StatBox label="Initiative" value={formatModifier(initiative)} />
                                <InputField label="Speed" name="speed" type="number" value={character.speed} onChange={handleFieldChange} />
                                <StatBox label="Proficiency" value={formatModifier(proficiencyBonus)} />
                                <div className="col-span-2">
                                    <label htmlFor="spellcastingAbility" className="block text-sm font-medium text-muted-foreground">Spellcasting Ability</label>
                                    <select id="spellcastingAbility" name="spellcastingAbility" value={character.spellcastingAbility} onChange={handleFieldChange} className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent sm:text-sm">
                                        <option value="">None</option>
                                        {ABILITIES.map(ability => (<option key={ability} value={ability} className="capitalize">{ability}</option>))}
                                    </select>
                                </div>
                                <StatBox label="Spell Save DC" value={String(spellSaveDC)} />
                                <StatBox label="Spell Attack" value={String(spellAttackBonus)} />
                            </div>
                        </div>
                    </div>
                </div>
            

            <div id="panel-stats" role="tabpanel" aria-labelledby="tab-stats" hidden={activeTab !== 'stats'}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ABILITIES.map(abilityKey => {
                        const abilityScore = character.abilityScores[abilityKey];
                        const abilityModifier = getModifier(abilityScore);
                        const savingThrow = character.savingThrows[abilityKey];
                        const savingThrowBonus = abilityModifier + (savingThrow.proficient ? proficiencyBonus : 0);
                        const relevantSkills = character.skills.filter(s => s.ability === abilityKey);

                        return (
                            <div key={abilityKey} className="bg-card p-3 rounded-lg flex flex-col gap-3 border border-border">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center bg-muted p-2 rounded-lg w-20">
                                        <span className="text-3xl font-bold font-mono text-foreground">{formatModifier(abilityModifier)}</span>
                                        <span className="text-xs uppercase tracking-wider text-muted-foreground">{abilityKey.substring(0, 3)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-cinzel text-accent capitalize">{abilityKey}</h3>
                                        <input
                                            type="number"
                                            value={abilityScore}
                                            onChange={(e) => handleAbilityScoreChange(abilityKey, parseInt(e.target.value) || 0)}
                                            className="w-full bg-input text-center text-lg rounded border border-border p-1 focus:ring-ring"
                                            aria-label={`${abilityKey} score`} />
                                    </div>
                                </div>
                                <div className="bg-muted/60 p-2 rounded-md space-y-2">
                                    {/* Saving Throw */}
                                    <label htmlFor={`saving-throw-${abilityKey}`} className="flex items-center justify-between cursor-pointer text-sm">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`saving-throw-${abilityKey}`}
                                                checked={savingThrow.proficient}
                                                onChange={() => handleSavingThrowProficiencyChange(abilityKey)}
                                                className="w-4 h-4 rounded-full text-primary bg-input border-border focus:ring-ring" />
                                            <span className="text-foreground">Saving Throw</span>
                                        </div>
                                        <span className="font-mono font-bold text-lg text-foreground">{formatModifier(savingThrowBonus)}</span>
                                    </label>
                                    {/* Skills */}
                                    {relevantSkills.map(skill => {
                                        const skillBonus = abilityModifier + (skill.proficient ? proficiencyBonus : 0) + (skill.expertise ? proficiencyBonus : 0);
                                        return (
                                            <div key={skill.name} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`skill-prof-${skill.name}`}
                                                        checked={skill.proficient}
                                                        onChange={() => handleSkillProficiencyChange(skill.name)}
                                                        className="w-4 h-4 rounded-full text-primary bg-input border-border focus:ring-ring cursor-pointer" />
                                                    <input
                                                        type="checkbox"
                                                        id={`skill-exp-${skill.name}`}
                                                        checked={skill.expertise}
                                                        onChange={() => handleSkillExpertiseChange(skill.name)}
                                                        className="w-4 h-4 rounded-sm text-accent bg-input border-border focus:ring-ring cursor-pointer"
                                                        title="Expertise" />
                                                    <label htmlFor={`skill-prof-${skill.name}`} className="cursor-pointer text-foreground">{skill.name}</label>
                                                </div>
                                                <span className="font-mono font-bold text-lg text-foreground">{formatModifier(skillBonus)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
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
                        <FeatureList />
                    </div>
                </div>
            </div>

            <div id="panel-bio" role="tabpanel" aria-labelledby="tab-bio" hidden={activeTab !== 'bio'} className="min-h-[60vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                        <TextAreaInput label="Personality Traits" name="personalityTraits" value={character.personalityTraits} onChange={handleFieldChange} />
                        <TextAreaInput label="Ideals" name="ideals" value={character.ideals} onChange={handleFieldChange} />
                        <TextAreaInput label="Bonds" name="bonds" value={character.bonds} onChange={handleFieldChange} />
                        <TextAreaInput label="Flaws" name="flaws" value={character.flaws} onChange={handleFieldChange} />
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="bg-card p-4 rounded-lg border border-border flex flex-col">
                            <h3 className="text-lg font-semibold text-accent mb-2">AI Personality Generator</h3>
                            <input
                                type="text"
                                placeholder="Optional: Add a keyword (e.g., 'tragic', 'grew up an orphan')"
                                value={personalityPrompt}
                                onChange={(e) => setPersonalityPrompt(e.target.value)}
                                className="w-full bg-input border border-border rounded-md p-2 text-sm mb-2 focus:ring-ring focus:border-accent" />
                            <button onClick={handleGeneratePersonality} disabled={isGenerating} className="flex w-full justify-center items-center gap-2 text-sm bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground transition disabled:bg-muted disabled:text-muted-foreground">
                                <SparklesIcon className="w-4 h-4" />
                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                            </button>
                        </div>
                        <TextAreaInput label="Notes" name="notes" value={character.notes} onChange={handleFieldChange} placeholder="Campaign notes, important NPCs, etc." />
                        <TextAreaInput label="DM Notes" name="dmNotes" value={character.dmNotes} onChange={handleFieldChange} placeholder="Notes from your DM, or secrets your character knows." />
                    </div>
                </div>
            </div>

            <div id="panel-inventory" role="tabpanel" aria-labelledby="tab-inventory" hidden={activeTab !== 'inventory'} className="min-h-[60vh]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <h3 className="text-lg font-cinzel text-accent mb-4">Currency</h3>
                        <div className="bg-muted/50 p-4 rounded-lg grid grid-cols-3 sm:grid-cols-5 gap-3 border border-border">
                            {Object.entries(character.currency).map(([type, amount]) => (
                                <div key={type}>
                                    <label className="block text-center text-sm font-medium text-muted-foreground uppercase">{type}</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => handleCurrencyChange(type as keyof Currency, parseInt(e.target.value, 10) || 0)}
                                        className="mt-1 block w-full bg-input border border-border rounded-md py-1 px-2 text-foreground focus:outline-none focus:ring-ring focus:border-accent text-center" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-2 p-4 border border-border rounded-lg">
                        <EquipmentList />
                    </div>
                </div>
            </div>

            <div id="panel-spells" role="tabpanel" aria-labelledby="tab-spells" hidden={activeTab !== 'spells'} className="min-h-[60vh] space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <h4 className="text-lg font-cinzel text-accent mb-3">Maximum Spell Slots</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
                        {Array.from({ length: 9 }, (_, i) => i + 1).map(level => (
                            <div key={level}>
                                <label className="block text-center text-sm font-medium text-muted-foreground">Lvl {level}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={character.spellSlots[level]?.max ?? 0}
                                    onChange={(e) => handleSpellSlotChange(level, parseInt(e.target.value, 10) || 0)}
                                    className="mt-1 block w-full bg-input border border-border rounded-md py-1 px-2 text-foreground focus:outline-none focus:ring-ring focus:border-accent text-center" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border border-border rounded-lg">
                    <CustomResourceEditor character={character} onUpdateCharacter={updateCharacter} />
                </div>
                <div className="p-4 border border-border rounded-lg">
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
        </div>
    );
};