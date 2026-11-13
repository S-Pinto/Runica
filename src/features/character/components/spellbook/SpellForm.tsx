import React, { useState } from 'react';
import { Spell } from '../../characterTypes';
import { fieldCheckRowClass, fieldControlClass as inputClass, fieldGroupClass, fieldGroupTitleClass, fieldLabelClass as labelClass, fieldNumericClass } from '../../../../components/ui/field';
import { ABILITY_LABELS, schoolLabel } from '../../../../lib/labels';
import { InlineForm } from '../ui/InlineForm';

export const SpellForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Spell | Omit<Spell, 'id'>;
  onSave: (data: Spell | Omit<Spell, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: keyof Omit<Spell, 'id'>, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: 'ritual' | 'concentration' | 'prepared') => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const SPELL_SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];

  return (
    <InlineForm
      title={'id' in initialData ? 'Modifica incantesimo' : 'Nuovo incantesimo'}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Salva incantesimo"
      className="mb-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        <div className="sm:col-span-6">
          <label htmlFor="spell-name" className={labelClass}>Nome</label>
          <input id="spell-name" type="text" placeholder="Nome dell'incantesimo" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
        </div>
        <div className="sm:col-span-4">
          <label htmlFor="spell-school" className={labelClass}>Scuola</label>
          <select id="spell-school" value={formData.school} onChange={e => handleChange('school', e.target.value)} className={inputClass}>
            {SPELL_SCHOOLS.map(school => <option key={school} value={school}>{schoolLabel(school)}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="spell-level" className={labelClass}>Livello</label>
          <input id="spell-level" type="number" inputMode="numeric" placeholder="0" value={formData.level} onChange={e => handleChange('level', parseInt(e.target.value))} min="0" max="9" className={fieldNumericClass} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6">
        <label className={fieldCheckRowClass}>
          <input type="checkbox" className="check-rune" checked={formData.ritual} onChange={() => handleCheckboxChange('ritual')} />
          Rituale
        </label>
        <label className={fieldCheckRowClass}>
          <input type="checkbox" className="check-rune" checked={formData.concentration} onChange={() => handleCheckboxChange('concentration')} />
          Concentrazione
        </label>
        <label className={fieldCheckRowClass}>
          <input type="checkbox" className="check-rune" checked={formData.prepared || false} onChange={() => handleCheckboxChange('prepared')} />
          Preparato
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="spell-casting-time" className={labelClass}>Tempo di lancio</label>
          <input
            id="spell-casting-time"
            type="text"
            list="casting-time-options"
            placeholder="Scegli o scrivi…"
            value={formData.castingTime}
            onChange={e => handleChange('castingTime', e.target.value)}
            className={inputClass}
          />
          <datalist id="casting-time-options">
            <option value="1 Action" />
            <option value="1 Bonus Action" />
            <option value="1 Reaction" />
            <option value="1 Minute" />
            <option value="10 Minutes" />
            <option value="1 Hour" />
            <option value="8 Hours" />
            <option value="24 Hours" />
          </datalist>
        </div>
        <div>
          <label htmlFor="spell-range" className={labelClass}>Gittata</label>
          <input id="spell-range" type="text" placeholder="Es. 18 metri" value={formData.range} onChange={e => handleChange('range', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="spell-components" className={labelClass}>Componenti</label>
          <input id="spell-components" type="text" placeholder="Es. V, S, M" value={formData.components} onChange={e => handleChange('components', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="spell-duration" className={labelClass}>Durata</label>
          <input id="spell-duration" type="text" placeholder="Es. istantanea" value={formData.duration} onChange={e => handleChange('duration', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className={fieldGroupClass}>
        <h5 className={`${fieldGroupTitleClass} mb-3`}>Combattimento e danni <span className="font-normal normal-case tracking-normal text-muted-foreground">· facoltativo</span></h5>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="spell-damage" className={labelClass}>Danni</label>
            <input id="spell-damage" type="text" placeholder="1d10" value={formData.damage || ''} onChange={e => handleChange('damage', e.target.value)} className={fieldNumericClass} />
          </div>
          <div>
            <label htmlFor="spell-damage-type" className={labelClass}>Tipo di danno</label>
            <input id="spell-damage-type" type="text" placeholder="Fuoco, forza…" value={formData.damageType || ''} onChange={e => handleChange('damageType', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="spell-attack-ability" className={labelClass}>Caratteristica d'attacco</label>
            <select id="spell-attack-ability" value={formData.attackAbility || ''} onChange={e => handleChange('attackAbility', e.target.value)} className={inputClass}>
              <option value="">Nessuna</option>
              {(['intelligence', 'wisdom', 'charisma', 'dexterity', 'strength'] as const).map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="spell-save-ability" className={labelClass}>Tiro salvezza su</label>
            <select id="spell-save-ability" value={formData.saveAbility || ''} onChange={e => handleChange('saveAbility', e.target.value)} className={inputClass}>
              <option value="">Nessuno</option>
              {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(a => <option key={a} value={a}>{ABILITY_LABELS[a]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="spell-description" className={labelClass}>Descrizione</label>
        <textarea id="spell-description" placeholder="Descrizione dell'incantesimo…" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={`${inputClass} resize-y leading-relaxed`}></textarea>
      </div>
    </InlineForm>
  );
};
