import React, { useState, useMemo } from 'react';
import { ICompanion, Spell } from '../characterTypes';
import { PlusIcon, TrashIcon } from '../../../components/ui/icons';

interface CompanionSpellEditorProps {
  companion: ICompanion;
  setCompanion: React.Dispatch<React.SetStateAction<ICompanion>>;
  readOnly?: boolean;
}

const createNewSpell = (): Spell => ({
  id: `spell_${Date.now()}_${Math.random()}`,
  name: '',
  description: '',
  level: 0,
  school: '',
  castingTime: '',
  range: '',
  components: '',
  duration: '',
});

const SortButton = ({ label, onClick, isActive }: { label: string, onClick: () => void, isActive: boolean }) => (
    <button
        onClick={onClick}
        className={`px-2 py-1 text-xs rounded-md transition-colors ${
            isActive ? 'bg-accent text-accent-foreground' : 'bg-muted/50 hover:bg-muted'
        }`}
    >
        {label}
    </button>
);

export const CompanionSpellEditor: React.FC<CompanionSpellEditorProps> = ({ companion, setCompanion, readOnly = false }) => {
    const [sortOrder, setSortOrder] = useState<'level' | 'alpha'>('level');
    const [newlyAddedSpellId, setNewlyAddedSpellId] = useState<string | null>(null);

    const sortedSpells = useMemo(() => {
        const spellsCopy = [...companion.spells];
        if (spellsCopy.length === 0) {
            return [];
        }
        spellsCopy.sort((a, b) => {
            if (sortOrder === 'level') {
                // Ordina per livello, poi alfabeticamente
                return a.level - b.level || a.name.localeCompare(b.name);
            }
            // Ordina solo alfabeticamente
            return a.name.localeCompare(b.name);
        });
        return spellsCopy;
    }, [companion.spells, sortOrder]);

    if (readOnly) {
        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-semibold text-muted-foreground">Spells & Special Abilities</h4>
                    <div className="flex gap-1">
                        <SortButton label="Level" onClick={() => setSortOrder('level')} isActive={sortOrder === 'level'} />
                        <SortButton label="Alphabetical" onClick={() => setSortOrder('alpha')} isActive={sortOrder === 'alpha'} />
                    </div>
                </div>
                <div className="space-y-4">
                    {sortedSpells.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center italic">No special abilities defined.</p>
                    ) : (
                        sortedSpells.map((spell) => (
                            <div key={spell.id} className="text-sm p-3 bg-background rounded-lg border border-border">
                                <p className="font-bold text-foreground">{spell.name}</p>
                                <div className="text-xs text-muted-foreground/80 mt-1">
                                    {(spell.level > 0) ? `Level ${spell.level} ${spell.school}` : spell.school || 'Special Ability'}
                                </div>
                                <div className="text-xs text-muted-foreground/80 mt-1 space-x-2">
                                    {spell.castingTime && <span><span className="font-semibold">Cast:</span> {spell.castingTime}</span>}
                                    {spell.range && <span>| <span className="font-semibold">Range:</span> {spell.range}</span>}
                                    {spell.duration && <span>| <span className="font-semibold">Duration:</span> {spell.duration}</span>}
                                </div>
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-2">{spell.description}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    const handleSpellChange = (spellId: string, field: keyof Spell, value: string | number) => {
        const newSpells = companion.spells.map(spell => {
            if (spell.id === spellId) {
                const updatedSpell = { ...spell };
                if (field === 'level') {
                    (updatedSpell as any)[field] = parseInt(value as string, 10) || 0;
                } else {
                    (updatedSpell as any)[field] = value;
                }
                return updatedSpell;
            }
            return spell;
        });
        setCompanion(prev => ({ ...prev, spells: newSpells }));
    };

    const addSpell = () => {
    const newSpell = createNewSpell();
    setCompanion(prev => ({ ...prev, spells: [...prev.spells, newSpell] }));
    setNewlyAddedSpellId(newSpell.id);
    };

    const deleteSpell = (spellId: string) => {
    // Se stiamo cancellando l'incantesimo appena aggiunto, resettiamo anche lo stato
    if (spellId === newlyAddedSpellId) {
      setNewlyAddedSpellId(null);
    }
        setCompanion(prev => ({ ...prev, spells: prev.spells.filter(spell => spell.id !== spellId) }));
    };

    const inputClass = "w-full bg-input border border-border rounded-md py-1 px-2 text-sm focus:ring-1 focus:ring-ring focus:outline-none";

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold text-muted-foreground">Spells & Special Abilities</h4>
                <div className="flex gap-1">
                    <SortButton label="Level" onClick={() => setSortOrder('level')} isActive={sortOrder === 'level'} />
                    <SortButton label="Alphabetical" onClick={() => setSortOrder('alpha')} isActive={sortOrder === 'alpha'} />
                </div>
            </div>
            <div className="space-y-4">
                {companion.spells.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center italic">No special abilities defined.</p>
                ) : (
                    <>
                        {/* Renderizza prima gli incantesimi esistenti e ordinati */}
                        {sortedSpells
                            .filter(spell => spell.id !== newlyAddedSpellId)
                            .map((spell) => (
                                <SpellForm key={spell.id} spell={spell} onSpellChange={handleSpellChange} onDelete={deleteSpell} inputClass={inputClass} />
                        ))}
                        {/* Renderizza l'incantesimo appena aggiunto in fondo, separatamente */}
                        {newlyAddedSpellId && sortedSpells.find(s => s.id === newlyAddedSpellId) && (
                            <div onBlur={(e) => {
                                // Se il focus esce dal contenitore, reintegra l'incantesimo nella lista ordinata
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setNewlyAddedSpellId(null);
                                }
                            }}>
                                <SpellForm
                                    key={newlyAddedSpellId}
                                    spell={sortedSpells.find(s => s.id === newlyAddedSpellId)!}
                                    onSpellChange={handleSpellChange}
                                    onDelete={deleteSpell}
                                    inputClass={inputClass}
                                />
                            </div>
                        )}
                    </>
                )}
                <button onClick={addSpell} className="w-full flex items-center justify-center gap-1 text-sm text-accent hover:text-primary transition-colors py-1 border border-dashed border-border rounded-md">
                    <PlusIcon className="w-4 h-4" /> Add Spell/Ability
                </button>
            </div>
        </div>
    );
};

interface SpellFormProps {
    spell: Spell;
    onSpellChange: (id: string, field: keyof Spell, value: string | number) => void;
    onDelete: (id: string) => void;
    inputClass: string;
}

const SpellForm: React.FC<SpellFormProps> = ({ spell, onSpellChange, onDelete, inputClass }) => (
    <div className="p-3 bg-background rounded-lg border border-border space-y-2">
        <div className="flex justify-between items-start gap-2">
            <input type="text" placeholder="Spell or Ability Name" value={spell.name} onChange={(e) => onSpellChange(spell.id, 'name', e.target.value)} className={`${inputClass} font-bold`} />
            <button onClick={() => onDelete(spell.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"><TrashIcon className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <input type="number" placeholder="Level (0 for cantrip)" value={spell.level} onChange={(e) => onSpellChange(spell.id, 'level', e.target.value)} className={`${inputClass} no-spinner`} />
            <input type="text" placeholder="School (e.g. Evocation)" value={spell.school} onChange={(e) => onSpellChange(spell.id, 'school', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Casting Time" value={spell.castingTime} onChange={(e) => onSpellChange(spell.id, 'castingTime', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Range" value={spell.range} onChange={(e) => onSpellChange(spell.id, 'range', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Components (V, S, M)" value={spell.components} onChange={(e) => onSpellChange(spell.id, 'components', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Duration" value={spell.duration} onChange={(e) => onSpellChange(spell.id, 'duration', e.target.value)} className={inputClass} />
        </div>
        <textarea
            placeholder="Description, effects, damage, etc."
            value={spell.description}
            onChange={(e) => onSpellChange(spell.id, 'description', e.target.value)}
            rows={3}
            className={`${inputClass} text-xs resize-y`}
        />
    </div>
);