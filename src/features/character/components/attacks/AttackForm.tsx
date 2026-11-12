import React, { useState } from 'react';
import { Attack, ICharacter } from '../../characterTypes';
import { WEAPON_MASTERIES } from '../../../../data/weaponProperties';
import { DAMAGE_TYPES, inputClass, labelClass } from './attackFormShared';
import { AdditionalDamageEditor } from './AdditionalDamageEditor';
import { WeaponPropertiesPicker } from './WeaponPropertiesPicker';
import * as combat from '../../rules/combat';

export const AttackForm = ({
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
      const bonus = combat.calculateSpellAttackBonus(character);
      handleChange('bonus', bonus >= 0 ? `+${bonus}` : `${bonus}`);
    } else {
      const dc = combat.calculateSpellSaveDC(character);
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


  return (
    <form onSubmit={handleSubmit} className="bg-card/95 backdrop-blur-md p-6 rounded-xl border border-accent/20 space-y-5 mb-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32 pointer-events-none" />

      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border/40 pb-3 mb-4 gap-4">
        <h3 className="font-cinzel text-xl font-bold text-accent italic">
          {'id' in initialData ? 'Modifica attacco' : 'Nuovo attacco'}
        </h3>
        <div className="flex bg-background/50 p-1 rounded-lg border border-border/50">
          <button type="button" onClick={() => setMode('weapon')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'weapon' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Arma</button>
          <button type="button" onClick={() => setMode('spell')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'spell' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Incantesimo o trucchetto</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Name */}
        <div className="md:col-span-12 space-y-1">
          <label className={labelClass}>Nome</label>
          <input type="text" placeholder={mode === 'weapon' ? "Es. spada lunga +1" : "Es. Dardo di fuoco"} value={formData.name} onChange={e => handleChange('name', e.target.value)} required
            className={inputClass} />
        </div>

        {/* Mode Specific Inputs */}
        {mode === 'spell' ? (
          <>
            <div className="md:col-span-12">
              <label className={labelClass}>Tipo di incantesimo</label>
              <div className="flex gap-3 p-1">
                <button
                  type="button"
                  onClick={() => setSpellType('attack')}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${spellType === 'attack'
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'bg-background/30 border-border/30 text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  Tiro per colpire
                </button>
                <button
                  type="button"
                  onClick={() => setSpellType('save')}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${spellType === 'save'
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'bg-background/30 border-border/30 text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  Tiro salvezza
                </button>
              </div>
            </div>

            {spellType === 'save' && (
              <div className="md:col-span-4 space-y-1">
                <label className={labelClass}>Tiro salvezza su</label>
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
                <span>{spellType === 'attack' ? 'Bonus d\'attacco' : 'CD tiro salvezza'}</span>
                <button type="button" onClick={autoFillSpellStats} className="text-[10px] text-accent hover:underline float-right font-normal normal-case italic">Calcolo automatico</button>
              </label>
              <input type="text" placeholder={spellType === 'attack' ? "+5" : "13"} value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required
                className={`${inputClass} text-center font-mono font-bold`} />
            </div>

            <div className={`${spellType === 'save' ? 'md:col-span-4' : 'md:col-span-6'} space-y-1`}>
              <label className={labelClass}>Danni o effetto</label>
              <input type="text" placeholder="1d10 (fuoco)" value={formData.damage} onChange={e => handleChange('damage', e.target.value)} required
                className={`${inputClass} text-center font-mono font-bold`} />
            </div>
          </>
        ) : (
          <>
            <div className="md:col-span-12 space-y-1 animate-in fade-in">
              <label className={labelClass}>Calcolo del tiro per colpire</label>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4">
                  <select
                    value={formData.attackAbility || ''}
                    onChange={e => handleChange('attackAbility', e.target.value)}
                    className={inputClass}
                    title="Caratteristica d'attacco"
                  >
                    <option value="">Nessuna (valore fisso)</option>
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
                    Competente
                  </label>
                </div>
                <div className="col-span-5">
                  <input type="text" placeholder="Magico/altro (+1)" value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required
                    className={`${inputClass} text-center font-mono font-bold`} />
                </div>
              </div>
            </div>
            <div className="md:col-span-12 space-y-1 animate-in fade-in">
              <label className={labelClass}>Danni</label>
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
                    title="Aggiungi il modificatore ai danni"
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
                    <option value="">-- Tipo --</option>
                    {DAMAGE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <AdditionalDamageEditor extras={formData.additionalDamage} onChange={value => handleChange('additionalDamage', value)} />
            </div>

            {/* Weapon Mastery Dropdown */}
            <div className="md:col-span-12 space-y-1 animate-in fade-in">
              <label className={labelClass}>
                <span className="flex justify-between w-full">
                  Maestria dell'arma
                  {formData.mastery && <span className="text-[10px] normal-case text-accent font-normal italic opacity-80">{WEAPON_MASTERIES[formData.mastery]?.description}</span>}
                </span>
              </label>
              <select
                value={formData.mastery}
                onChange={e => handleChange('mastery', e.target.value)}
                className={inputClass}
              >
                <option value="">Nessuna (trucchetto o arma semplice)</option>
                {Object.entries(WEAPON_MASTERIES).map(([key, m]) => (
                  <option key={key} value={key}>{m.name}</option>
                ))}
              </select>
            </div>

            <WeaponPropertiesPicker selected={formData.properties} onToggle={toggleProperty} />
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
        <button type="button" onClick={onCancel} className="bg-muted/40 hover:bg-muted/60 text-foreground font-bold py-2 px-6 rounded-lg transition-all text-sm uppercase tracking-wider">Annulla</button>
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-8 rounded-lg transition-all text-sm shadow-md hover:shadow-primary/20 uppercase tracking-widest">Salva attacco</button>
      </div>
    </form>
  );
};
