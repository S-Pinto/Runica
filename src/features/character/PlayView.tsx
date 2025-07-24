import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ICharacter, CustomResource, Attack, Feature, EquipmentItem, Currency } from './characterTypes';
import * as characterService from './characterService';
import { useCharacter } from './CharacterProvider'; 
import { BackIcon, EditIcon, ChevronDownIcon } from '../../components/ui/icons';
import { AbilitiesDisplay } from './components/AbilitiesDisplay'; 
import { PlayViewSpellList } from './components/PlayViewSpellList';
import { getModifier, formatModifier } from './utils/characterUtils';
import { StatBox } from './components/ui/StatBox';

type PlayTab = 'main' | 'abilities' | 'combat' | 'spells' | 'inventory' | 'info';

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

const rollDiceExpression = (diceString: string): { total: number; pretty: string } => {
    if (!diceString || typeof diceString !== 'string') return { total: 0, pretty: 'Invalid input' };
    const parts = diceString.replace(/[\s()]/g, '').split('+');
    let total = 0;
    const prettyParts: string[] = [];
    const diceRegex = /(\d+)d(\d+)/i;
    for (const part of parts) {
        if (!part) continue;
        const diceMatch = part.match(diceRegex);
        if (diceMatch) {
            const numDice = parseInt(diceMatch[1], 10);
            const diceType = parseInt(diceMatch[2], 10);
            if (isNaN(numDice) || isNaN(diceType)) continue;
            const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * diceType) + 1);
            const subTotal = rolls.reduce((a, b) => a + b, 0);
            total += subTotal;
            prettyParts.push(`[${rolls.join('+')}]`);
        } else {
            const modifier = parseInt(part, 10);
            if (!isNaN(modifier)) {
                total += modifier;
                prettyParts.push(String(modifier));
            }
        }
    }
    if (prettyParts.length === 0) return { total: 0, pretty: 'Invalid Format' };
    return { total, pretty: `${prettyParts.join(' + ')} = ${total}` };
};

// --- TAB SUB-COMPONENTS ---

const MainTabView = () => {
    const [hitDiceRoll, setHitDiceRoll] = useState<string | null>(null);
    const { character, updateCharacter } = useCharacter();

    const conModifier = getModifier(character.abilityScores.constitution);
    const passivePerception = useMemo(() => {
        const wisdomMod = getModifier(character.abilityScores.wisdom);
        const perceptionSkill = character.skills.find(s => s.name === 'Perception');
        let bonus = 0;
        if (perceptionSkill) {
            if(perceptionSkill.expertise) bonus = character.proficiencyBonus * 2;
            else if (perceptionSkill.proficient) bonus = character.proficiencyBonus;
        }
        return 10 + wisdomMod + bonus;
    }, [character]);
    
    const spendHitDie = () => {
        if (character.hitDice.used >= character.level) return;

        const { total: healing, pretty: rollDetails } = rollDiceExpression(`${character.hitDice.total}+${conModifier}`);
        const newCurrentHp = Math.min(character.hp.max, character.hp.current + Math.max(1, healing));

        setHitDiceRoll(`${rollDetails} HP`);
        updateCharacter({
            hp: { ...character.hp, current: newCurrentHp },
            hitDice: { ...character.hitDice, used: character.hitDice.used + 1 }
        });
    };

    const resetHitDice = () => {
        updateCharacter({ hitDice: { ...character.hitDice, used: 0 } });
        setHitDiceRoll(null);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <StatBox 
                    label="Armor Class" 
                    value={useMemo(() => characterService.calculateArmorClass(character), [character])} 
                />
                <StatBox label="Initiative" value={formatModifier(character.initiative)} />
                <StatBox label="Speed" value={`${character.speed}ft`} subValue={`≈ ${Math.round(character.speed * 0.3)}m`} />
                <StatBox label="Proficiency" value={formatModifier(character.proficiencyBonus)} />
                <StatBox label="Passive Perception" value={passivePerception} className="col-span-2 sm:col-span-1" />
            </div>
            <HPTracker />
            <DeathSavesTracker />
            
            <div className="bg-card p-4 rounded-lg border border-border">
                <h3 className="text-lg font-cinzel text-accent mb-3">Hit Dice</h3>
                <p className="text-center text-3xl font-bold font-mono text-foreground mb-3">{character.level - character.hitDice.used} / {character.level}</p>
                <div className="flex gap-2">
                    <button onClick={spendHitDie} disabled={character.hitDice.used >= character.level} className="w-full bg-primary/80 hover:bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                        Spend ({character.hitDice.total})
                    </button>
                    <button onClick={resetHitDice} className="bg-secondary/80 hover:bg-secondary text-secondary-foreground font-bold py-2 px-4 rounded-md transition-colors">Reset</button>
                </div>
                {hitDiceRoll && <p className="text-center text-accent font-mono mt-3 p-2 bg-muted/50 rounded-md">{hitDiceRoll}</p>}
            </div>

            <div className="bg-card p-4 rounded-lg border border-border">
                <h3 className="text-lg font-cinzel text-accent mb-3">Languages</h3>
                <p className="text-foreground whitespace-pre-wrap">{character.languages || 'None'}</p>
            </div>
        </div>
    );
};

const CombatTabView = () => {
    const { character } = useCharacter();
    return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttacksAndCantrips items={character.attacks || []} />
        <FeaturesList title="Features & Traits" items={character.featuresAndTraits || []} />
    </div>
)};
const SpellsTabView = () => {
    const { character, updateCharacter } = useCharacter();
    const spellcastingAbility = character.spellcastingAbility;
    const spellcastingModifier = spellcastingAbility ? getModifier(character.abilityScores[spellcastingAbility]) : 0;
    const spellSaveDC = spellcastingAbility ? 8 + character.proficiencyBonus + spellcastingModifier : '-';
    const spellAttackBonus = spellcastingAbility ? character.proficiencyBonus + spellcastingModifier : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="text-lg font-cinzel text-accent mb-3 text-center">Spellcasting</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <StatBox label="Save DC" value={spellSaveDC} />
                        <StatBox label="Attack Bonus" value={formatModifier(spellAttackBonus)} />
                        <div className="col-span-2 text-center">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Ability</p>
                            <p className="text-xl font-bold text-foreground capitalize">{spellcastingAbility || 'None'}</p>
                        </div>
                    </div>
                 </div>
                 <ResourceTracker title="Spell Slots" slots={character.spellSlots} onSlotChange={(newSlots) => updateCharacter({ spellSlots: newSlots })} />
                 {character.customResources && character.customResources.length > 0 && (
                     <ResourceTracker title="Other Resources" slots={character.customResources} onSlotChange={(newResources) => updateCharacter({ customResources: newResources })} isCustom />
                 )}
            </div>
            <div className="lg:col-span-2">
                <PlayViewSpellList />
            </div>
        </div>
    );
};
const InventoryTabView = () => {
  const { character, updateCharacter } = useCharacter();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleToggleEquip = (itemId: string) => {
    const clickedItem = character.equipment.find(item => item.id === itemId);
    if (!clickedItem) return;

    const isEquipping = !clickedItem.equipped;

    const newEquipment = character.equipment.map(item => {
      if (item.id === itemId) {
        return { ...item, equipped: isEquipping };
      }
      if (isEquipping) {
        const isClickedItemArmor = clickedItem.armorType && clickedItem.armorType !== 'shield';
        const isCurrentItemArmor = item.equipped && item.armorType && item.armorType !== 'shield';
        if (isClickedItemArmor && isCurrentItemArmor) {
          return { ...item, equipped: false };
        }
        if (clickedItem.armorType === 'shield' && item.equipped && item.armorType === 'shield') {
          return { ...item, equipped: false };
        }
      }
      return item;
    });
    updateCharacter({ equipment: newEquipment });
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItem(prev => (prev === itemId ? null : itemId));
  };

  const { equippableItems, backpackItems } = useMemo(() => {
    const equippable: EquipmentItem[] = [];
    const backpack: EquipmentItem[] = [];
    (character.equipment || []).forEach(item => {
      if (item.armorType) {
        equippable.push(item);
      } else {
        backpack.push(item);
      }
    });
    return { 
      equippableItems: equippable.sort((a, b) => a.name.localeCompare(b.name)),
      backpackItems: backpack.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [character.equipment]);

  const ItemList = ({ title, items }: { title: string; items: EquipmentItem[] }) => (
    <div className="bg-card p-4 rounded-lg border border-border">
      <h3 className="text-lg font-cinzel text-accent mb-3">{title}</h3>
      {items.length === 0 ? <p className="text-muted-foreground text-sm text-center py-4">None.</p> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-card/50 rounded-lg text-sm">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => handleToggleExpand(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="font-semibold text-accent truncate" title={item.name}>{item.name} <span className="text-xs text-muted-foreground">(x{item.quantity})</span></p>
                </div>
                {item.armorType && (
                  <button onClick={() => handleToggleEquip(item.id)} className={`px-3 py-1 text-xs font-bold rounded ${item.equipped ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
                    {item.equipped ? 'Equipped' : 'Equip'}
                  </button>
                )}
              </div>
              {expandedItem === item.id && (
                <div className="p-3 border-t border-border/50 bg-muted/30 space-y-2">
                  {item.armorType && (
                    <p><strong className="text-muted-foreground capitalize">{item.armorType} Armor</strong>
                      {item.armorClass ? <span className="text-foreground"> (AC: {item.armorClass})</span> : ''}
                    </p>
                  )}
                  <p className="text-foreground whitespace-pre-wrap">{item.description || 'No description.'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <h3 className="text-lg font-cinzel text-accent mb-3">Currency</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(Object.keys(character.currency) as Array<keyof Currency>).map(c => (
              <div key={c}>
                <p className="text-xl font-mono text-foreground">{character.currency[c]}</p>
                <p className="text-xs uppercase text-muted-foreground">{c}</p>
              </div>
            ))}
          </div>
        </div>
        <ItemList title="Equippable Gear" items={equippableItems} />
      </div>
      <div className="lg:col-span-2"><ItemList title="Backpack" items={backpackItems} /></div>
    </div>
  );
};

const InfoTabView = () => {
    const { character } = useCharacter();
    const InfoBlock = ({ title, content }: { title: string; content: string }) => (
        <div className="bg-card p-4 rounded-lg border border-border flex-grow">
            <h3 className="text-lg font-cinzel text-accent mb-2">{title}</h3>
            <p className="text-foreground whitespace-pre-wrap">{content || 'Not set.'}</p>
        </div>
    );
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6 flex flex-col">
                <InfoBlock title="Personality Traits" content={character.personalityTraits} />
                <InfoBlock title="Ideals" content={character.ideals} />
                <InfoBlock title="Bonds" content={character.bonds} />
                <InfoBlock title="Flaws" content={character.flaws} />
            </div>
             <div className="space-y-6 flex flex-col">
                <InfoBlock title="Character Notes" content={character.notes} />
                <InfoBlock title="Campaign Info" content={character.dmNotes} />
            </div>
        </div>
    );
};

const PLAY_TABS: { key: PlayTab; label: string }[] = [
    { key: 'main', label: 'Main' },
    { key: 'abilities', label: 'Abilities' },
    { key: 'combat', label: 'Combat' },
    { key: 'spells', label: 'Spells' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'info', label: 'Info' },
];

// --- WRAPPER & MAIN RENDER ---
export const PlayView: React.FC = () => {
    const { characterId } = useParams<{ characterId: string }>();
    const navigate = useNavigate();
    const { character, setCharacter, updateCharacter } = useCharacter();
    const [activeTab, setActiveTab] = useState<PlayTab>('main');
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
    
    if (!character) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div></div>;
    }
    
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:pt-8">
                        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-border pb-4">
                {/* Back Button */}
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-muted-foreground transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
                    aria-label="Back to character list"
                >
                    <BackIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Back to List</span>
                    <span className="sm:hidden">Back</span>
                </button>

                {/* Character Info - Placed on top on mobile with 'order-first' */}
                <div className="flex items-center gap-4 text-center order-first sm:order-none">
                    {character.imageUrl && (
                        <img 
                            src={character.imageUrl} 
                            alt={character.name} 
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-border shadow-md"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-cinzel text-accent">{character.name}</h1>
                        <p className="text-muted-foreground capitalize text-sm">
                            {character.race} {character.class} {character.subclass && `(${character.subclass})`} &bull; Level {character.level} &bull; {character.alignment}
                        </p>
                    </div>
                </div>

                {/* Edit Button */}
                <button 
                    onClick={() => navigate(`/character/${characterId}/edit`)} 
                    className="flex items-center gap-2 rounded-md px-3 py-2 font-bold text-primary transition-all duration-200 hover:scale-105 hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
                    aria-label="Edit character sheet"
                >
                    <EditIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Edit Sheet</span>
                    <span className="sm:hidden">Edit</span>
                </button>
            </header>


            <div role="tablist" aria-label="Character View Sections" className="flex space-x-1 mb-6 border-b border-border overflow-x-auto">
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
            
            <div className="bg-muted/50 p-4 sm:p-6 rounded-b-lg rounded-tr-lg">
                <div id="play-panel-main" role="tabpanel" aria-labelledby="play-tab-main" style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
                    <MainTabView />
                </div>
                 <div id="play-panel-abilities" role="tabpanel" aria-labelledby="play-tab-abilities" style={{ display: activeTab === 'abilities' ? 'block' : 'none' }}>
                    <AbilitiesDisplay />
                </div>
                <div id="play-panel-combat" role="tabpanel" aria-labelledby="play-tab-combat" style={{ display: activeTab === 'combat' ? 'block' : 'none' }}>
                    <CombatTabView />
                </div>
                 <div id="play-panel-spells" role="tabpanel" aria-labelledby="play-tab-spells" style={{ display: activeTab === 'spells' ? 'block' : 'none' }}>
                    <SpellsTabView />
                </div>
                 <div id="play-panel-inventory" role="tabpanel" aria-labelledby="play-tab-inventory" style={{ display: activeTab === 'inventory' ? 'block' : 'none' }}>
                    <InventoryTabView />
                </div>
                <div id="play-panel-info" role="tabpanel" aria-labelledby="play-tab-info" style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
                    <InfoTabView />
                </div>
            </div>
        </div>
    );
};


// --- HELPER SUB-COMPONENTS (COPIED FROM OLD PLAYVIEW FOR SELF-CONTAINMENT) ---

const HPTracker = () => {
    const { character, updateCharacter } = useCharacter();
    const { hp } = character;
    const [damage, setDamage] = useState('');
    const [healing, setHealing] = useState('');
    const [tempHpInput, setTempHpInput] = useState('');

    const applyDamage = () => {
        const amount = parseInt(damage, 10);
        if (!isNaN(amount) && amount > 0) {
            const damageToTemp = Math.min(amount, hp.temporary);
            const newTemporary = hp.temporary - damageToTemp;
            const remainingDamage = amount - damageToTemp;
            const newCurrent = Math.max(0, hp.current - remainingDamage);
            updateCharacter({ hp: { ...hp, current: newCurrent, temporary: newTemporary } });
            setDamage('');
        }
    };

    const applyHealing = () => {
        const amount = parseInt(healing, 10);
        if (!isNaN(amount) && amount > 0) {
            const newCurrent = Math.min(hp.max, hp.current + amount);
            updateCharacter({ hp: { ...hp, current: newCurrent } });
            setHealing('');
        }
    };
    
    const applyTempHp = () => {
        const amount = parseInt(tempHpInput, 10);
        if (!isNaN(amount) && amount >= 0) {
            updateCharacter({ hp: { ...hp, temporary: amount } });
            setTempHpInput('');
        }
    };

    return (
        <div className="bg-card p-4 rounded-lg border border-border">
            <h3 className="text-lg font-cinzel text-accent mb-3 text-center">Hit Points</h3>
            <div className="text-center mb-4">
                <span className="text-5xl font-bold text-destructive">{hp.current}</span>
                {hp.temporary > 0 && <span className="text-3xl font-bold text-accent" title="Temporary HP"> +{hp.temporary}</span>}
                <span className="text-2xl text-muted-foreground"> / {hp.max}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col">
                     <input type="number" value={damage} onChange={e => setDamage(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyDamage()} placeholder="Damage" className="bg-input text-center rounded-md p-2 border border-border focus:ring-destructive focus:border-destructive" />
                     <button onClick={applyDamage} className="bg-destructive/80 hover:bg-destructive text-destructive-foreground font-bold py-2 px-4 rounded-md mt-1 transition-colors">Apply</button>
                </div>
                 <div className="flex flex-col">
                     <input type="number" value={healing} onChange={e => setHealing(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyHealing()} placeholder="Healing" className="bg-input text-center rounded-md p-2 border border-border focus:ring-primary focus:border-primary" />
                     <button onClick={applyHealing} className="bg-primary/80 hover:bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md mt-1 transition-colors">Apply</button>
                </div>
            </div>
             <div className="flex flex-col">
                 <input type="number" value={tempHpInput} onChange={e => setTempHpInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyTempHp()} placeholder="Set/Replace Temp HP" className="bg-input text-center rounded-md p-2 border border-border focus:ring-accent focus:border-accent" />
                 <button onClick={applyTempHp} className="bg-accent/80 hover:bg-accent text-accent-foreground font-bold py-2 px-4 rounded-md mt-1 transition-colors">Set Temp HP</button>
            </div>
        </div>
    );
};

const ResourceTracker = ({ title, slots, onSlotChange, isCustom }: { title: string; slots: ICharacter['spellSlots'] | CustomResource[]; onSlotChange: (newSlots: any) => void, isCustom?: boolean }) => {
    const toggleSlot = (key: string | number, index: number) => {
        if (isCustom) {
            const customSlots = slots as CustomResource[];
            const resourceIndex = customSlots.findIndex(r => r.id === key);
            if (resourceIndex === -1) return;
            const resource = customSlots[resourceIndex];
            const newUsed = index < resource.used ? index : index + 1; // click to toggle
            const newResources = [...customSlots];
            newResources[resourceIndex] = { ...resource, used: newUsed };
            onSlotChange(newResources);
        } else {
            const spellSlots = slots as ICharacter['spellSlots'];
            const levelData = spellSlots[key as number];
            const newUsed = index < levelData.used ? index : index + 1;
            onSlotChange({ ...spellSlots, [key]: { ...levelData, used: newUsed } });
        }
    };

    const entries = isCustom ? (slots as CustomResource[]) : Object.entries(slots as ICharacter['spellSlots']);
    const hasSlots = entries.some(entry => (isCustom ? (entry as CustomResource).max > 0 : (entry[1] as any).max > 0));

    return (
        <div className="bg-card p-4 rounded-lg border border-border">
            <h3 className="text-lg font-cinzel text-accent mb-3">{title}</h3>
            {!hasSlots && <p className="text-muted-foreground text-sm text-center">No resources available.</p>}
            <div className="space-y-3">
                {entries.map((entry) => {
                    const [key, data] = isCustom ? [(entry as CustomResource).id, entry as CustomResource] : entry;
                    const level = isCustom ? (data as CustomResource).name : `Lvl ${key}`;
                    if (data.max === 0) return null;

                    return (
                        <div key={key} className="flex items-center">
                            <span className="font-bold text-muted-foreground w-24 truncate" title={level}>{level}:</span>
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: data.max }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleSlot(key, i)}
                                        className={`w-5 h-5 rounded-md border-2 transition-colors ${i < data.used ? 'bg-primary border-primary/80' : 'bg-muted border-border hover:border-accent'}`}
                                        aria-label={`Slot ${i + 1} for ${level}. ${i < data.used ? 'Used' : 'Available'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DeathSavesTracker = () => {
    const { character, updateCharacter } = useCharacter();
    const { deathSaves: saves } = character;
    const handleToggle = (type: 'successes' | 'failures', index: number) => {
        const currentCount = saves[type];
        const newCount = index < currentCount ? index : index + 1;
        updateCharacter({ deathSaves: { ...saves, [type]: newCount } });
    };
    return (
        <div className="bg-card p-4 rounded-lg border border-border">
             <h3 className="text-lg font-cinzel text-accent mb-3">Death Saves</h3>
             <div className="space-y-2">
                 <div className="flex items-center justify-between">
                     <span className="font-semibold text-foreground">Successes</span>
                     <div className="flex gap-2">
                         {Array.from({length: 3}).map((_, i) => (
                            <input key={i} type="checkbox" checked={i < saves.successes} onChange={() => handleToggle('successes', i)} className="w-5 h-5 rounded-full text-primary bg-input border-border focus:ring-primary" />
                         ))}
                     </div>
                 </div>
                 <div className="flex items-center justify-between">
                     <span className="font-semibold text-foreground">Failures</span>
                     <div className="flex gap-2">
                         {Array.from({length: 3}).map((_, i) => (
                            <input key={i} type="checkbox" checked={i < saves.failures} onChange={() => handleToggle('failures', i)} className="w-5 h-5 rounded-full text-destructive bg-input border-border focus:ring-destructive"/>
                         ))}
                     </div>
                 </div>
             </div>
        </div>
    );
};

const AttacksAndCantrips = ({ items }: {items: Attack[]}) => {
    const [results, setResults] = useState<Record<string, {atk?: string, dmg?: string}>>({});
    const handleAttackRoll = (attack: Attack) => {
        const modifier = parseInt(attack.bonus) || 0;
        const d20Roll = Math.floor(Math.random() * 20) + 1;
        const total = d20Roll + modifier;
        const pretty = `${d20Roll} ${modifier >= 0 ? '+' : '-'} ${Math.abs(modifier)} = ${total}`;
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], atk: pretty } }));
    };
    const handleDamageRoll = (attack: Attack) => {
        const { pretty } = rollDiceExpression(attack.damage);
        setResults(prev => ({ ...prev, [attack.id]: { ...prev[attack.id], dmg: pretty } }));
    };
    return (
         <div className="bg-card p-4 rounded-lg border border-border flex flex-col h-full">
            <h3 className="text-lg font-cinzel text-accent mb-3">Attacks & Cantrips</h3>
            <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(50vh-5rem)]">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">None.</p>}
                {items.map(item => (
                     <div key={item.id} className="bg-card/50 rounded-lg text-sm p-3 space-y-2">
                        <div className="flex justify-between items-start">
                            <span className="font-semibold text-accent text-base">{item.name}</span>
                            <div className="flex gap-4 font-mono text-foreground text-right">
                                <span title="Attack Bonus">{item.bonus}</span>
                                <span title="Damage">{item.damage}</span>
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                             <button onClick={() => handleAttackRoll(item)} className="text-xs bg-secondary hover:bg-secondary/80 rounded px-3 py-1.5 transition-colors font-bold">ATK</button>
                             <button onClick={() => handleDamageRoll(item)} className="text-xs bg-destructive/80 hover:bg-destructive rounded px-3 py-1.5 transition-colors font-bold">DMG</button>
                        </div>
                         {(results[item.id]?.atk || results[item.id]?.dmg) &&
                             <div className="text-xs text-foreground bg-muted/50 p-2 rounded-md border-l-2 border-accent space-y-1">
                                 {results[item.id].atk && <div><strong>Attack:</strong> <span className="font-mono text-accent">{results[item.id].atk}</span></div>}
                                 {results[item.id].dmg && <div><strong>Damage:</strong> <span className="font-mono text-destructive">{results[item.id].dmg}</span></div>}
                             </div>
                         }
                    </div>
                ))}
            </div>
        </div>
    )
}

const FeaturesList = ({ title, items }: {title: string; items: Feature[]}) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    return (
         <div className="bg-card p-4 rounded-lg border border-border flex flex-col h-full">
            <h3 className="text-lg font-cinzel text-accent mb-3">{title}</h3>
            <div className="space-y-2 flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(50vh-5rem)]">
                {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">None.</p>}
                {items.map(item => (
                     <div key={item.id} className="bg-card/50 rounded-lg text-sm">
                         <div className="flex items-center justify-between p-3 cursor-pointer w-full text-left" onClick={() => item.description && setExpanded(e => ({...e, [item.id]: !e[item.id]}))}>
                           <span className="font-semibold text-accent">{item.name}</span>
                         </div>
                         {expanded[item.id] && item.description && (
                           <div className="p-3 border-t border-border/50 bg-muted/30">
                             <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
                           </div>
                         )}
                    </div>
                ))}
            </div>
        </div>
    )
}