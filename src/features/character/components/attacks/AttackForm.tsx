import React, { useState } from 'react';
import { Attack, ICharacter } from '../../characterTypes';
import { WEAPON_MASTERIES } from '../../../../data/weaponProperties';
import { DAMAGE_TYPES, inputClass, labelClass } from './attackFormShared';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { fieldCheckRowClass, fieldNumericClass } from '../../../../components/ui/field';
import { ABILITY_SHORT } from '../../../../lib/labels';
import { InlineForm } from '../ui/InlineForm';
import { AdditionalDamageEditor } from './AdditionalDamageEditor';
import { WeaponPropertiesPicker } from './WeaponPropertiesPicker';
import * as combat from '../../rules/combat';

const ABILITY_OPTIONS = [
  { value: 'str', label: ABILITY_SHORT.strength },
  { value: 'dex', label: ABILITY_SHORT.dexterity },
  { value: 'con', label: ABILITY_SHORT.constitution },
  { value: 'int', label: ABILITY_SHORT.intelligence },
  { value: 'wis', label: ABILITY_SHORT.wisdom },
  { value: 'cha', label: ABILITY_SHORT.charisma },
];

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
    <InlineForm
      title={'id' in initialData ? 'Modifica attacco' : 'Nuovo attacco'}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Salva attacco"
      aside={
        <SegmentedControl
          label="Tipo di attacco"
          value={mode}
          onChange={setMode}
          options={[{ value: 'weapon', label: 'Arma' }, { value: 'spell', label: 'Incantesimo' }]}
          className="sm:w-64"
        />
      }
    >
      <div>
        <label htmlFor="attack-name" className={labelClass}>Nome</label>
        <input id="attack-name" type="text" placeholder={mode === 'weapon' ? 'Es. spada lunga +1' : 'Es. Dardo di fuoco'} value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
      </div>

      {mode === 'spell' ? (
        <>
          <div>
            <p className={labelClass}>L'incantesimo richiede</p>
            <SegmentedControl
              label="L'incantesimo richiede"
              value={spellType}
              onChange={setSpellType}
              options={[{ value: 'attack', label: 'Tiro per colpire' }, { value: 'save', label: 'Tiro salvezza' }]}
            />
          </div>

          <div className={`grid grid-cols-1 gap-4 ${spellType === 'save' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {spellType === 'save' && (
              <div>
                <label htmlFor="attack-save-ability" className={labelClass}>Tiro salvezza su</label>
                <select
                  id="attack-save-ability"
                  value={formData.saveAbility || (character.spellcastingAbility || 'int')}
                  onChange={e => handleChange('saveAbility', e.target.value)}
                  className={inputClass}
                >
                  {ABILITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label htmlFor="attack-bonus" className="text-label uppercase text-muted-foreground">{spellType === 'attack' ? "Bonus d'attacco" : 'CD del tiro salvezza'}</label>
                <button type="button" onClick={autoFillSpellStats} className="rounded text-xs font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Calcola</button>
              </div>
              <input id="attack-bonus" type="text" placeholder={spellType === 'attack' ? '+5' : '13'} value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required className={fieldNumericClass} />
            </div>

            <div>
              <label htmlFor="attack-damage" className={labelClass}>Danni o effetto</label>
              <input id="attack-damage" type="text" placeholder="1d10 fuoco" value={formData.damage} onChange={e => handleChange('damage', e.target.value)} required className={fieldNumericClass} />
            </div>
          </div>
        </>
      ) : (
        <>
          <fieldset>
            <legend className={labelClass}>Tiro per colpire</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <select
                value={formData.attackAbility || ''}
                onChange={e => handleChange('attackAbility', e.target.value)}
                className={`${inputClass} sm:col-span-5`}
                aria-label="Caratteristica d'attacco"
              >
                <option value="">Nessuna caratteristica</option>
                {ABILITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <input type="text" aria-label="Bonus magico o altro" placeholder="Bonus (+1)" value={formData.bonus} onChange={e => handleChange('bonus', e.target.value)} required className={`${fieldNumericClass} sm:col-span-3`} />
              <label className={`${fieldCheckRowClass} sm:col-span-4`}>
                <input type="checkbox" className="check-rune" checked={formData.isProficient || false} onChange={e => handleChange('isProficient', e.target.checked)} />
                Competente
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelClass}>Danni</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <input type="text" aria-label="Formula dei danni" placeholder="1d8" value={formData.damage} onChange={e => handleChange('damage', e.target.value)} required className={`${fieldNumericClass} sm:col-span-4`} />
              <select
                value={formData.damageAbility || ''}
                onChange={e => handleChange('damageAbility', e.target.value)}
                className={`${inputClass} sm:col-span-4`}
                aria-label="Modificatore sommato ai danni"
              >
                <option value="">Nessun modificatore</option>
                {ABILITY_OPTIONS.map(a => <option key={a.value} value={a.value}>+ {a.label}</option>)}
              </select>
              <select
                value={formData.damageType || ''}
                onChange={e => handleChange('damageType', e.target.value)}
                className={`${inputClass} sm:col-span-4`}
                aria-label="Tipo di danno"
              >
                <option value="">Tipo di danno</option>
                {DAMAGE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <AdditionalDamageEditor extras={formData.additionalDamage} onChange={value => handleChange('additionalDamage', value)} />
          </fieldset>

          <div>
            <label htmlFor="attack-mastery" className={labelClass}>Maestria dell'arma</label>
            <select
              id="attack-mastery"
              value={formData.mastery}
              onChange={e => handleChange('mastery', e.target.value)}
              className={inputClass}
            >
              <option value="">Nessuna</option>
              {Object.entries(WEAPON_MASTERIES).map(([key, m]) => (
                <option key={key} value={key}>{m.name}</option>
              ))}
            </select>
            {formData.mastery && WEAPON_MASTERIES[formData.mastery] && (
              <p className="mt-1.5 text-sm text-muted-foreground">{WEAPON_MASTERIES[formData.mastery].description}</p>
            )}
          </div>

          <WeaponPropertiesPicker selected={formData.properties} onToggle={toggleProperty} />
        </>
      )}
    </InlineForm>
  );
};
