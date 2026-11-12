import React, { useState } from 'react';
import { Spell } from '../../characterTypes';
import { SparklesIcon } from '../../../../components/ui/icons';

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
  const inputClass = "w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="bg-card/80 p-4 rounded-lg border border-accent/30 space-y-4 mb-6 animate-in fade-in slide-in-from-top-2">
      <h3 className="font-cinzel text-lg text-accent">{'id' in initialData ? 'Modifica incantesimo' : 'Nuovo incantesimo'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-8">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nome</label>
          <input type="text" placeholder="Nome dell'incantesimo" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
        </div>
        <div className="sm:col-span-4">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Scuola</label>
          <select value={formData.school} onChange={e => handleChange('school', e.target.value)} className={inputClass}>
            {SPELL_SCHOOLS.map(school => <option key={school} value={school}>{school}</option>)}
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Livello</label>
          <input type="number" placeholder="0" value={formData.level} onChange={e => handleChange('level', parseInt(e.target.value))} min="0" max="9" className={inputClass} />
        </div>


        <div className="sm:col-span-12 flex items-center justify-start gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.ritual ? 'bg-accent border-accent text-accent-foreground' : 'bg-input border-border'}`}>
              {formData.ritual && <SparklesIcon className="w-3.5 h-3.5" />}
            </div>
            <input type="checkbox" checked={formData.ritual} onChange={() => handleCheckboxChange('ritual')} className="hidden" />
            <span className="group-hover:text-accent transition-colors">Rituale</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.concentration ? 'bg-accent border-accent text-accent-foreground' : 'bg-input border-border'}`}>
              {formData.concentration && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
            </div>
            <input type="checkbox" checked={formData.concentration} onChange={() => handleCheckboxChange('concentration')} className="hidden" />
            <span className="group-hover:text-accent transition-colors">Concentrazione</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm select-none group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.prepared ? 'bg-accent border-accent text-accent-foreground' : 'bg-input border-border'}`}>
              {formData.prepared && <div className="w-2.5 h-2.5 rounded-sm bg-current" />}
            </div>
            <input type="checkbox" checked={formData.prepared || false} onChange={() => handleCheckboxChange('prepared')} className="hidden" />
            <span className="group-hover:text-accent transition-colors">Preparato</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Tempo di lancio</label>
          <div className="relative">
            <input
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
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Gittata</label>
          <input type="text" placeholder="Es. 18 metri" value={formData.range} onChange={e => handleChange('range', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Componenti</label>
          <input type="text" placeholder="Es. V, S, M" value={formData.components} onChange={e => handleChange('components', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Durata</label>
          <input type="text" placeholder="Es. istantanea" value={formData.duration} onChange={e => handleChange('duration', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="space-y-4 p-3 bg-accent/5 rounded-lg border border-accent/10">
        <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest">Combattimento e danni (facoltativo)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Danni</label>
            <input type="text" placeholder="Es. 1d10" value={formData.damage || ''} onChange={e => handleChange('damage', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Tipo di danno</label>
            <input type="text" placeholder="Fuoco, forza…" value={formData.damageType || ''} onChange={e => handleChange('damageType', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Caratteristica d'attacco</label>
            <select value={formData.attackAbility || ''} onChange={e => handleChange('attackAbility', e.target.value as any)} className={inputClass}>
              <option value="">Nessuna (fisso o tiro salvezza)</option>
              <option value="intelligence">Intelligenza</option>
              <option value="wisdom">Saggezza</option>
              <option value="charisma">Carisma</option>
              <option value="dexterity">Destrezza</option>
              <option value="strength">Forza</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Tiro salvezza su</label>
            <select value={formData.saveAbility || ''} onChange={e => handleChange('saveAbility', e.target.value as any)} className={inputClass}>
              <option value="">Nessuno (tiro per colpire)</option>
              <option value="strength">Forza</option>
              <option value="dexterity">Destrezza</option>
              <option value="constitution">Costituzione</option>
              <option value="intelligence">Intelligenza</option>
              <option value="wisdom">Saggezza</option>
              <option value="charisma">Carisma</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Descrizione</label>
        <textarea placeholder="Descrizione dell'incantesimo…" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={`${inputClass} resize-y`}></textarea>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
        <button type="button" onClick={onCancel} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded transition text-sm">Annulla</button>
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition text-sm shadow-sm">Salva incantesimo</button>
      </div>
    </form >
  )
};
