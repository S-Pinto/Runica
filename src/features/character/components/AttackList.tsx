import React, { useState, useMemo } from 'react';
import { Attack } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { TrashIcon, EditIcon, PlusCircleIcon, CheckIcon, XMarkIcon } from '../../../components/ui/icons';
import { AttackRow } from './AttackRow';
import { ICharacter } from '../characterTypes';

const DEFAULT_ATTACK: Omit<Attack, 'id'> = {
  name: '',
  bonus: '+0',
  damage: '1d4',
};

import { WEAPON_MASTERIES, WEAPON_PROPERTIES } from '../../../data/weaponProperties';
import * as characterService from '../characterService';

const DAMAGE_TYPES = [
  'Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic',
  'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'
];

const AttackForm = ({
  initialData,
  character,
  onSave,
  onCancel,
}: {
  initialData: Attack | Omit<Attack, 'id'>,
  character: ICharacter,
  onSave: (data: Attack | Omit<Attack, 'id'>) => void,
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState<Omit<Attack, 'id'> & { id?: string }>({
    name: initialData.name,
    bonus: initialData.bonus,
    damage: initialData.damage,
    mastery: initialData.mastery || '',
    properties: initialData.properties || [],
    saveAbility: initialData.saveAbility || '',
    ...('id' in initialData ? { id: initialData.id } : {})
  });

  const [mode, setMode] = useState<'weapon' | 'spell'>(initialData.saveAbility || (!initialData.properties?.length && !initialData.mastery && initialData.damage && initialData.damage.includes('cantrip')) ? 'spell' : 'weapon');
  const [spellType, setSpellType] = useState<'attack' | 'save'>(initialData.saveAbility ? 'save' : 'attack');

  const handleChange = (field: keyof Attack, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleProperty = (propName: string) => {
    const currentProps = formData.properties || [];
    const newProps = currentProps.includes(propName)
      ? currentProps.filter(p => p !== propName)
      : [...currentProps, propName];
    handleChange('properties', newProps);
  };

  const autoFillSpellStats = () => {
    if (spellType === 'attack') {
      const bonus = characterService.calculateSpellAttackBonus(character);
      handleChange('bonus', bonus >= 0 ? `+${bonus}` : `${bonus}`);
    } else {
      const dc = characterService.calculateSpellSaveDC(character);
      handleChange('bonus', `${dc}`);
      handleChange('saveAbility', character.spellcastingAbility || 'int');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Clean up based on mode
    const cleanData: any = { ...formData };
    if (mode === 'spell') {
      cleanData.mastery = '';
      cleanData.properties = []; // Clear weapon props
      if (spellType === 'attack') {
        delete cleanData.saveAbility; // Delete instead of undefined
      }
    } else {
      delete cleanData.saveAbility; // Delete instead of undefined
    }

    onSave(cleanData);
  };

  const inputClass = "w-full bg-input p-2.5 rounded-lg border border-border focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm font-medium transition-all";
  const labelClass = "block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider ml-1";

  return (
    <form onSubmit={handleSubmit} className="bg-card/95 backdrop-blur-md p-6 rounded-xl border border-accent/20 space-y-5 mb-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32 pointer-events-none" />

      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border/40 pb-3 mb-4 gap-4">
        <h3 className="font-cinzel text-xl font-bold text-accent italic">
          {'id' in initialData ? 'Refine Combat Art' : 'Forge New Attack'}
        </h3>
        <div className="flex bg-background/50 p-1 rounded-lg border border-border/50">
          <button type="button" onClick={() => setMode('weapon')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'weapon' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Weapon</button>
          <button type="button" onClick={() => setMode('spell')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'spell' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Spell / Cantrip</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Name */}
        <div className="md:col-span-12 space-y-1">
          <label className={labelClass}>Name</label>
          <input type="text" placeholder={mode === 'weapon' ? "e.g. Longsword +1" : "e.g. Fire Bolt"} value={formData.name} onChange={e => handleChange('name', e.target.value)} required
            className={inputClass} />
        </div>

        {/* Mode Specific Inputs */}
        {mode === 'spell' ? (
          <>
            <div className="md:col-span-12">
              <label className={labelClass}>Spell Type</label>
              <div className="flex gap-3 p-1">
                <button
                  type="button"
                  onClick={() => setSpellType('attack')}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${spellType === 'attack'
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'bg-background/30 border-border/30 text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  Attack Roll
                </button>
                <button
                  type="button"
                  onClick={() => setSpellType('save')}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${spellType === 'save'
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'bg-background/30 border-border/30 text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  Saving Throw
                </button>
              </div>
            </div>

            {spellType === 'save' && (
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Save Attribute</label>
                <select
                  value={formData.saveAbility || (character.spellcastingAbility || 'int')}
                  onChange={e => handleChange('saveAbility', e.target.value)}
                  className={inputClass}
                >
                  {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                </select>
              </div>
            )}

            <div className={`${spellType === 'save' ? 'md:col-span-4' : 'md:col-span-6'} space-y-1`}>
              <label className={labelClass}>
                <span>{spellType === 'attack' ? 'Attack Bonus' : 'Save DC'}</span>
                <button type="button" onClick={autoFillSpellStats} className="text-[10px] text-accent hover:underline float-right font-normal normal-case italic">Auto-Calc</button>
              </label>
              <input type="text" placeholder={spellType === 'attack' ? "+5" : "13"} value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required
                className={`${inputClass} text-center font-mono font-bold`} />
            </div>

            <div className={`${spellType === 'save' ? 'md:col-span-4' : 'md:col-span-6'} space-y-1`}>
              <label className={labelClass}>Damage / Effect</label>
              <input type="text" placeholder="1d10 (Fire)" value={formData.damage} onChange={e => handleChange('damage', e.target.value)} required
                className={`${inputClass} text-center font-mono font-bold`} />
            </div>
          </>
        ) : (
          <>
            <div className="md:col-span-12 space-y-1 animate-in fade-in">
              <label className={labelClass}>Hit Roll Calculation</label>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <select
                    value={formData.attackAbility || ''}
                    onChange={e => handleChange('attackAbility', e.target.value)}
                    className={inputClass}
                    title="Attack Ability"
                  >
                    <option value="">None (Flat)</option>
                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="col-span-3 flex items-center justify-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group">
                    <input
                      type="checkbox"
                      checked={formData.isProficient || false}
                      onChange={e => handleChange('isProficient', e.target.checked)}
                      className="rounded border-border text-accent focus:ring-accent w-4 h-4 transition-all group-hover:border-accent"
                    />
                    Proficient
                  </label>
                </div>
                <div className="col-span-5">
                  <input type="text" placeholder="Magic/Misc (+1)" value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required
                    className={`${inputClass} text-center font-mono font-bold`} />
                </div>
              </div>
            </div>
            <div className="md:col-span-12 space-y-1 animate-in fade-in">
              <label className={labelClass}>Damage</label>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <input type="text" placeholder="1d8" value={formData.damage} onChange={e => handleChange('damage', e.target.value)} required
                    className={`${inputClass} text-center font-mono font-bold`} />
                </div>
                <div className="col-span-3">
                  <select
                    value={formData.damageAbility || ''}
                    onChange={e => handleChange('damageAbility', e.target.value)}
                    className={`${inputClass} text-center`}
                    title="Add Ability Modifier to Damage"
                  >
                    <option value="">+0</option>
                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => <option key={a} value={a}>+{a.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <select
                    value={formData.damageType || ''}
                    onChange={e => handleChange('damageType', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- Type --</option>
                    {DAMAGE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Damage Section */}
              <div className="space-y-2 mt-3">
                {formData.additionalDamage?.map((extra, idx) => (
                  <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                    <input
                      type="text"
                      placeholder="Extra Dmg (e.g. 1d6)"
                      value={extra.formula}
                      onChange={e => {
                        const newExtras = [...(formData.additionalDamage || [])];
                        newExtras[idx] = { ...newExtras[idx], formula: e.target.value };
                        handleChange('additionalDamage', newExtras);
                      }}
                      className={`${inputClass} text-center font-mono font-bold`}
                    />
                    <select
                      value={extra.type}
                      onChange={e => {
                        const newExtras = [...(formData.additionalDamage || [])];
                        newExtras[idx] = { ...newExtras[idx], type: e.target.value };
                        handleChange('additionalDamage', newExtras);
                      }}
                      className={inputClass}
                    >
                      <option value="">-- Type --</option>
                      {DAMAGE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const newExtras = [...(formData.additionalDamage || [])].filter((_, i) => i !== idx);
                        handleChange('additionalDamage', newExtras);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    handleChange('additionalDamage', [...(formData.additionalDamage || []), { formula: '', type: '' }]);
                  }}
                  className="text-[10px] font-black uppercase text-accent/70 hover:text-accent flex items-center gap-1 ml-1 tracking-widest mt-1"
                >
                  <PlusCircleIcon className="w-3.5 h-3.5" /> Append Mixed Damage
                </button>
              </div>
            </div>

            {/* Weapon Mastery Dropdown */}
            <div className="md:col-span-12 space-y-1 animate-in fade-in">
              <label className={labelClass}>
                <span className="flex justify-between w-full">
                  Mastery Property
                  {formData.mastery && <span className="text-[10px] normal-case text-accent font-normal italic opacity-80">{WEAPON_MASTERIES[formData.mastery]?.description}</span>}
                </span>
              </label>
              <select
                value={formData.mastery}
                onChange={e => handleChange('mastery', e.target.value)}
                className={inputClass}
              >
                <option value="">None (Cantrip / Simple Weapon)</option>
                {Object.values(WEAPON_MASTERIES).map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Weapon Properties Multi-Select */}
            <div className="md:col-span-12 animate-in fade-in">
              <label className={labelClass}>Weapon Properties</label>
              <div className="flex flex-wrap gap-2 p-3 bg-background/30 rounded-xl border border-border/30 min-h-[3rem]">
                {Object.keys(WEAPON_PROPERTIES).map(prop => {
                  const isActive = formData.properties?.includes(prop);
                  return (
                    <button
                      key={prop}
                      type="button"
                      onClick={() => toggleProperty(prop)}
                      className={`text-[10px] px-2.5 py-1 rounded-md border transition-all duration-200 font-semibold uppercase tracking-wide
                                        ${isActive
                          ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_-4px_rgba(var(--color-accent),0.5)]'
                          : 'bg-background/50 text-muted-foreground border-border/50 hover:border-accent/50 hover:text-foreground'
                        }`}
                      title={WEAPON_PROPERTIES[prop].description}
                    >
                      {prop}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
        <button type="button" onClick={onCancel} className="bg-muted/40 hover:bg-muted/60 text-foreground font-bold py-2 px-6 rounded-lg transition-all text-sm uppercase tracking-wider">Dismiss</button>
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-8 rounded-lg transition-all text-sm shadow-md hover:shadow-primary/20 uppercase tracking-widest">Save Combat Art</button>
      </div>
    </form>
  );
};

export const AttackList = () => {
  const { character, updateCharacter } = useCharacter();
  const [editingAttack, setEditingAttack] = useState<Attack | 'new' | null>(null);
  const [deletingAttackId, setDeletingAttackId] = useState<string | null>(null);

  if (!character) return null;

  const handleSaveAttack = (attackData: Attack | Omit<Attack, 'id'>) => {
    let updatedAttacks: Attack[];
    if ('id' in attackData) {
      updatedAttacks = character.attacks.map(f => f.id === attackData.id ? attackData : f);
    } else {
      const newAttack: Attack = { ...attackData, id: `attack_${Date.now()}` };
      updatedAttacks = [...character.attacks, newAttack];
    }
    updateCharacter({ attacks: updatedAttacks });
    setEditingAttack(null);
  };

  const handleDeleteAttack = (attackId: string) => {
    const updatedAttacks = character.attacks.filter(f => f.id !== attackId);
    updateCharacter({ attacks: updatedAttacks });
    setDeletingAttackId(null);
  };

  const allActions = useMemo(() => characterService.getAllActions(character), [character]);

  return (
    <div className="bg-card/80 p-4 rounded-lg border border-border flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-accent">Combat Dashboard</h3>
        <button
          onClick={() => setEditingAttack('new')}
          disabled={editingAttack !== null}
          className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground transition disabled:bg-muted disabled:cursor-not-allowed"
        >
          <PlusCircleIcon className="w-5 h-5" /> Add Attack
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto pr-2 -mr-2 flex-grow">
        {allActions.length === 0 && editingAttack !== 'new' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-muted-foreground text-sm py-4">No actions available. Equip weapons or add features!</p>
          </div>
        )}
        {allActions.map(attack =>
          editingAttack && typeof editingAttack === 'object' && editingAttack.id === attack.id ? (
            <AttackForm
              key={attack.id}
              initialData={editingAttack}
              character={character}
              onSave={handleSaveAttack}
              onCancel={() => setEditingAttack(null)}
            />
          ) : (
            <AttackRow key={attack.id} attack={attack} actions={
              attack.sourceType === 'custom' ? (
                deletingAttackId === attack.id ? (
                  <>
                    <span className="text-xs text-destructive-foreground">Sure?</span>
                    <button onClick={() => handleDeleteAttack(attack.id)} className="text-destructive hover:text-destructive-foreground p-1"><CheckIcon className="w-4 h-4" /></button>
                    <button onClick={() => setDeletingAttackId(null)} className="text-muted-foreground hover:text-accent p-1"><XMarkIcon className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingAttack(attack); setDeletingAttackId(null); }} disabled={editingAttack !== null} className="text-muted-foreground hover:text-accent p-1 disabled:text-muted/50 disabled:cursor-not-allowed"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => { setDeletingAttackId(attack.id); setEditingAttack(null); }} disabled={editingAttack !== null} className="text-muted-foreground hover:text-destructive p-1 disabled:text-muted/50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button>
                  </>
                )
              ) : (
                <span className="text-[10px] text-muted-foreground uppercase opacity-50 font-bold border border-border/20 px-1.5 py-0.5 rounded bg-muted/20">Linked</span>
              )
            } />
          )
        )}

        {editingAttack === 'new' && (
          <div className="mt-4">
            <AttackForm
              initialData={DEFAULT_ATTACK}
              character={character}
              onSave={handleSaveAttack}
              onCancel={() => setEditingAttack(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};