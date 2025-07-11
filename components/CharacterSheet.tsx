import React, { useState, useEffect, useMemo } from 'react';
import { ICharacter, AbilityScores, Currency, Skill } from '../types';
import * as characterService from '../services/characterService';
import * as geminiService from '../services/geminiService';
import { SparklesIcon, BackIcon, SaveIcon, TrashIcon } from './icons';
import { Spellbook } from './Spellbook';
import { FeatureList } from './FeatureList';
import { EquipmentList } from './EquipmentList';
import { AttackList } from './AttackList';
import { CustomResourceEditor } from './CustomResourceEditor';


// --- Type Aliases & Helpers ---
type Tab = 'main' | 'stats' | 'combat' | 'bio' | 'spells' | 'inventory';
const getModifier = (score: number) => Math.floor((score - 10) / 2);
const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : String(mod));
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
                ? 'bg-zinc-700 text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-400 hover:bg-zinc-800/60 border-b-2 border-transparent'
        }`}
    >
        {label}
    </button>
);

const InputField = ({label, name, type, value, onChange, placeholder, className}: {label: string; name: string; type: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; className?:string;}) => (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-400 capitalize">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 block w-full bg-zinc-700 border border-zinc-600 rounded-md shadow-sm py-2 px-3 text-zinc-100 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
      />
    </div>
);

const StatBox = ({label, value, className}: {label: string; value: string | number; className?: string}) => (
    <div className={`flex flex-col items-center justify-center p-3 bg-zinc-700/50 rounded-lg text-center ${className}`}>
        <span className="text-3xl font-bold font-mono text-white">{value}</span>
        <span className="text-xs uppercase tracking-wider text-zinc-400 mt-1">{label}</span>
    </div>
);

const TextAreaInput = ({ label, name, value, onChange, placeholder }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; }) => (
    <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex flex-col flex-1 h-full">
        <h3 className="text-lg font-semibold text-amber-400 mb-2">{label}</h3>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-md p-3 text-zinc-200 focus:ring-amber-500 focus:border-amber-500 resize-y flex-grow min-h-[100px]"
            placeholder={placeholder || `Your character's ${label.toLowerCase()}...`}
        />
    </div>
);

// --- Main Component ---
interface CharacterSheetProps {
    characterId: string;
    onBack: () => void;
    onSaveComplete: (id: string) => void;
    onDelete: (id: string) => void;
}

const TABS: { key: Tab; label: string }[] = [
    { key: 'main', label: 'Main' },
    { key: 'stats', label: 'Stats & Skills' },
    { key: 'combat', label: 'Combat & Features' },
    { key: 'bio', label: 'Biography & Notes' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'spells', label: 'Spells' },
];

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ characterId, onBack, onSaveComplete, onDelete }) => {
    const [character, setCharacter] = useState<ICharacter | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [personalityPrompt, setPersonalityPrompt] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('main');
    const isNewCharacter = characterId === 'new';
    
    useEffect(() => {
        const loadCharacter = async () => {
            setLoading(true);
            let charData;
            if (isNewCharacter) {
                charData = { ...characterService.createNewCharacter(), id: 'temp_new' };
            } else {
                charData = await characterService.getCharacter(characterId);
            }
            setCharacter(charData);
            setLoading(false);
        };
        loadCharacter();
    }, [characterId, isNewCharacter]);

    const proficiencyBonus = useMemo(() => {
        if (!character) return 0;
        return Math.ceil(character.level / 4) + 1;
    }, [character?.level]);

    const handleSaveClick = async () => {
        if (!character) return;
        setIsSaving(true);
        const id = isNewCharacter ? `char_${Date.now()}` : character.id;
        const charToSave: ICharacter = { ...character, id, proficiencyBonus, lastUpdated: Date.now() };
        const savedChar = await characterService.saveCharacter(charToSave);
        setIsSaving(false);
        onSaveComplete(savedChar.id);
    };
    
    const handleDeleteClick = async () => {
        if (character && !isNewCharacter && window.confirm(`Are you sure you want to permanently delete ${character.name}?`)) {
            onDelete(character.id);
        }
    };
    
    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!character) return;
        const { name, value, type } = e.target;
        
        let processedValue: string | number = value;
        if (type === 'number') {
            processedValue = parseInt(value) || 0;
        }

        setCharacter(prev => ({ ...prev!, [name]: processedValue }));
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

    if (loading || !character) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-500"></div></div>;
    }
    
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <header className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-300 hover:text-amber-400 transition-colors">
                    <BackIcon className="w-5 h-5" />
                    {isNewCharacter ? 'Cancel Creation' : 'Back to Play View'}
                </button>
                <div className="flex items-center gap-2">
                    {!isNewCharacter && (
                         <button onClick={handleDeleteClick} className="p-2 rounded-full bg-red-800/50 hover:bg-red-600 text-red-300 hover:text-white transition-colors" aria-label="Delete Character">
                            <TrashIcon className="w-5 h-5" />
                         </button>
                    )}
                    <button onClick={handleSaveClick} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-bold rounded-lg shadow-md hover:bg-amber-500 transition-colors disabled:bg-zinc-600">
                        <SaveIcon className="w-5 h-5" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            <div className="bg-zinc-800 border border-zinc-700 shadow-2xl shadow-amber-900/10 rounded-lg p-4 sm:p-6">
                <div role="tablist" aria-label="Character Sheet Sections" className="flex space-x-1 mb-6 border-b border-zinc-700 overflow-x-auto">
                    {TABS.map(tab => (
                         <TabButton 
                            key={tab.key}
                            id={`tab-${tab.key}`}
                            label={tab.label} 
                            isActive={activeTab === tab.key} 
                            onClick={() => setActiveTab(tab.key)} 
                            controls={`panel-${tab.key}`}
                        />
                    ))}
                </div>

                <div id="panel-main" role="tabpanel" aria-labelledby="tab-main" hidden={activeTab !== 'main'}>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 md:col-span-1">
                            <InputField label="Character Name" name="name" type="text" value={character.name} onChange={handleFieldChange} placeholder="e.g., Eldrin" />
                            <div className="grid grid-cols-2 gap-2">
                                <InputField label="Class" name="class" type="text" value={character.class} onChange={handleFieldChange} placeholder="e.g., Wizard" />
                                <InputField label="Subclass" name="subclass" type="text" value={character.subclass} onChange={handleFieldChange} placeholder="e.g., School of Evocation" />
                            </div>
                            <InputField label="Race" name="race" type="text" value={character.race} onChange={handleFieldChange} placeholder="e.g., High-Elf" />
                            <InputField label="Background" name="background" type="text" value={character.background} onChange={handleFieldChange} placeholder="e.g., Sage" />
                            <InputField label="Languages" name="languages" type="text" value={character.languages} onChange={handleFieldChange} placeholder="e.g., Common, Elvish" />
                        </div>
                        <div className="space-y-4 md:col-span-1">
                            <InputField label="Level" name="level" type="number" value={character.level} onChange={handleFieldChange} />
                            <InputField label="Alignment" name="alignment" type="text" value={character.alignment} onChange={handleFieldChange} placeholder="e.g., Chaotic Good" />
                             <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Hit Points</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label htmlFor="hp-current" className="block text-xs font-medium text-zinc-500 text-center">Current</label>
                                        <input id="hp-current" type="number" value={character.hp.current} onChange={(e) => handleHpChange('current', parseInt(e.target.value) || 0)} className="mt-1 w-full bg-zinc-700 border border-zinc-600 rounded-md py-2 px-3 text-zinc-100 focus:outline-none focus:ring-amber-500 text-center"/>
                                    </div>
                                    <div>
                                        <label htmlFor="hp-max" className="block text-xs font-medium text-zinc-500 text-center">Max</label>
                                        <input id="hp-max" type="number" value={character.hp.max} onChange={(e) => handleHpChange('max', parseInt(e.target.value) || 0)} className="mt-1 w-full bg-zinc-700 border border-zinc-600 rounded-md py-2 px-3 text-zinc-100 focus:outline-none focus:ring-amber-500 text-center"/>
                                    </div>
                                    <div>
                                        <label htmlFor="hp-temporary" className="block text-xs font-medium text-zinc-500 text-center">Temporary</label>
                                        <input id="hp-temporary" type="number" value={character.hp.temporary} onChange={(e) => handleHpChange('temporary', parseInt(e.target.value) || 0)} className="mt-1 w-full bg-zinc-700 border border-zinc-600 rounded-md py-2 px-3 text-zinc-100 focus:outline-none focus:ring-amber-500 text-center" />
                                    </div>
                                </div>
                            </div>
                            <InputField label="Hit Dice" name="hitDice" type="text" value={character.hitDice.total} onChange={handleHitDiceChange} placeholder="e.g. 1d8" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:col-span-1">
                            <InputField label="Armor Class" name="armorClass" type="number" value={character.armorClass} onChange={handleFieldChange} className="col-span-1"/>
                            <StatBox label="Initiative" value={formatModifier(initiative)} />
                            <InputField label="Speed" name="speed" type="number" value={character.speed} onChange={handleFieldChange} className="col-span-1"/>
                            <StatBox label="Proficiency" value={formatModifier(proficiencyBonus)} />
                             <div className="col-span-2">
                                <label htmlFor="spellcastingAbility" className="block text-sm font-medium text-zinc-400">Spellcasting Ability</label>
                                <select id="spellcastingAbility" name="spellcastingAbility" value={character.spellcastingAbility} onChange={handleFieldChange} className="mt-1 block w-full bg-zinc-700 border border-zinc-600 rounded-md shadow-sm py-2 px-3 text-zinc-100 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                                    <option value="">None</option>
                                    {ABILITIES.map(ability => (<option key={ability} value={ability} className="capitalize">{ability}</option>))}
                                </select>
                            </div>
                             <StatBox label="Spell Save DC" value={String(spellSaveDC)} />
                             <StatBox label="Spell Attack" value={String(spellAttackBonus)} />
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
                                <div key={abilityKey} className="bg-zinc-700/50 p-3 rounded-lg flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center bg-zinc-900/50 p-2 rounded-lg w-20">
                                            <span className="text-3xl font-bold font-mono text-white">{formatModifier(abilityModifier)}</span>
                                            <span className="text-xs uppercase tracking-wider text-zinc-400">{abilityKey.substring(0,3)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-cinzel text-amber-400 capitalize">{abilityKey}</h3>
                                            <input
                                                type="number"
                                                value={abilityScore}
                                                onChange={(e) => handleAbilityScoreChange(abilityKey, parseInt(e.target.value) || 0)}
                                                className="w-full bg-zinc-800 text-center text-lg rounded border border-zinc-600 p-1 focus:ring-amber-500"
                                                aria-label={`${abilityKey} score`}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-zinc-800/60 p-2 rounded-md space-y-2">
                                        {/* Saving Throw */}
                                        <label htmlFor={`saving-throw-${abilityKey}`} className="flex items-center justify-between cursor-pointer text-sm">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`saving-throw-${abilityKey}`}
                                                    checked={savingThrow.proficient}
                                                    onChange={() => handleSavingThrowProficiencyChange(abilityKey)}
                                                    className="w-4 h-4 rounded-full text-amber-600 bg-zinc-900 border-zinc-600 focus:ring-amber-500"
                                                />
                                                <span>Saving Throw</span>
                                            </div>
                                            <span className="font-mono font-bold text-lg text-white">{formatModifier(savingThrowBonus)}</span>
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
                                                            className="w-4 h-4 rounded-full text-amber-600 bg-zinc-900 border-zinc-600 focus:ring-amber-500 cursor-pointer"
                                                        />
                                                        <input
                                                            type="checkbox"
                                                            id={`skill-exp-${skill.name}`}
                                                            checked={skill.expertise}
                                                            onChange={() => handleSkillExpertiseChange(skill.name)}
                                                            className="w-4 h-4 rounded-sm text-yellow-300 bg-zinc-900 border-zinc-600 focus:ring-yellow-400 cursor-pointer"
                                                            title="Expertise"
                                                        />
                                                        <label htmlFor={`skill-prof-${skill.name}`} className="cursor-pointer">{skill.name}</label>
                                                    </div>
                                                    <span className="font-mono font-bold text-lg text-white">{formatModifier(skillBonus)}</span>
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
                        <div className="flex-1 lg:w-1/2 flex flex-col">
                            <AttackList character={character} onUpdateCharacter={setCharacter} />
                        </div>
                        <div className="flex-1 lg:w-1/2 flex flex-col">
                            <FeatureList character={character} onUpdateCharacter={(c) => setCharacter(c)} />
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
                            <div>
                                <h3 className="text-lg font-semibold text-amber-400 mb-2">AI Personality Generator</h3>
                                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                                    <input
                                        type="text"
                                        placeholder="Optional: Add a keyword (e.g., 'tragic', 'grew up an orphan')"
                                        value={personalityPrompt}
                                        onChange={(e) => setPersonalityPrompt(e.target.value)}
                                        className="w-full bg-zinc-700 border border-zinc-600 rounded-md p-2 text-sm mb-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    <button onClick={handleGeneratePersonality} disabled={isGenerating} className="flex w-full justify-center items-center gap-2 text-sm bg-amber-600 hover:bg-amber-500 px-3 py-2 rounded-md text-white transition disabled:bg-zinc-600">
                                        <SparklesIcon className="w-4 h-4" />
                                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                                    </button>
                                </div>
                            </div>
                           <TextAreaInput label="Notes" name="notes" value={character.notes} onChange={handleFieldChange} placeholder="Campaign notes, important NPCs, etc."/>
                           <TextAreaInput label="DM Notes" name="dmNotes" value={character.dmNotes} onChange={handleFieldChange} placeholder="Notes from your DM, or secrets your character knows."/>
                       </div>
                    </div>
                </div>
                
                <div id="panel-inventory" role="tabpanel" aria-labelledby="tab-inventory" hidden={activeTab !== 'inventory'} className="min-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                             <h3 className="text-lg font-cinzel text-amber-400 mb-4">Currency</h3>
                             <div className="bg-zinc-900/50 p-4 rounded-lg grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {Object.entries(character.currency).map(([type, amount]) => (
                                    <div key={type}>
                                        <label className="block text-center text-sm font-medium text-zinc-400 uppercase">{type}</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => handleCurrencyChange(type as keyof Currency, parseInt(e.target.value, 10) || 0)}
                                            className="mt-1 block w-full bg-zinc-700 border border-zinc-600 rounded-md py-1 px-2 text-zinc-100 focus:outline-none focus:ring-amber-500 text-center"
                                        />
                                    </div>
                                ))}
                             </div>
                        </div>
                        <div className="lg:col-span-2">
                            <EquipmentList character={character} onUpdateCharacter={setCharacter} />
                        </div>
                    </div>
                </div>

                <div id="panel-spells" role="tabpanel" aria-labelledby="tab-spells" hidden={activeTab !== 'spells'} className="min-h-[60vh] space-y-6">
                    <div className="bg-zinc-900/50 p-4 rounded-lg">
                        <h4 className="text-lg font-cinzel text-amber-400 mb-3">Maximum Spell Slots</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
                            {Array.from({ length: 9 }, (_, i) => i + 1).map(level => (
                                <div key={level}>
                                    <label className="block text-center text-sm font-medium text-zinc-400">Lvl {level}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={character.spellSlots[level]?.max ?? 0}
                                        onChange={(e) => handleSpellSlotChange(level, parseInt(e.target.value, 10) || 0)}
                                        className="mt-1 block w-full bg-zinc-700 border border-zinc-600 rounded-md py-1 px-2 text-zinc-100 focus:outline-none focus:ring-amber-500 text-center"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <CustomResourceEditor character={character} onUpdateCharacter={setCharacter} />
                    <Spellbook character={character} onUpdateCharacter={(c) => setCharacter(c)} />
                </div>
            </div>
        </div>
    );
};