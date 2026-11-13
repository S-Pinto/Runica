import React, { useState, useMemo } from 'react';
import { ICompanion, Spell } from '../characterTypes';
import { PlusIcon, TrashIcon } from '../../../components/ui/icons';
import { fieldControlClass } from '../../../components/ui/field';

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
    ritual: false,
    concentration: false,
});

const SortButton = ({ label, onClick, isActive }: { label: string, onClick: () => void, isActive: boolean }) => (
    <button
        onClick={onClick}
        type="button"
        aria-pressed={isActive}
        className={`h-8 rounded-lg border px-2.5 text-xs font-semibold transition-colors duration-150 ${isActive ? 'border-accent bg-accent/15 text-accent' : 'border-border-strong/50 text-muted-foreground hover:text-foreground'
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
                    <h4 className="text-label uppercase text-muted-foreground">Incantesimi e capacità speciali</h4>
                    <div className="flex gap-1">
                        <SortButton label="Livello" onClick={() => setSortOrder('level')} isActive={sortOrder === 'level'} />
                        <SortButton label="Alfabetico" onClick={() => setSortOrder('alpha')} isActive={sortOrder === 'alpha'} />
                    </div>
                </div>
                <div className="space-y-4">
                    {sortedSpells.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nessuna capacità speciale.</p>
                    ) : (
                        sortedSpells.map((spell) => (
                            <div key={spell.id} className="rounded-2xl bg-background/50 p-3 text-sm">
                                <p className="font-bold text-foreground">{spell.name}</p>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {(spell.level > 0) ? `Level ${spell.level} ${spell.school}` : spell.school || 'Capacità speciale'}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground space-x-2">
                                    {spell.castingTime && <span><span className="font-semibold">Lancio:</span> {spell.castingTime}</span>}
                                    {spell.range && <span>| <span className="font-semibold">Gittata:</span> {spell.range}</span>}
                                    {spell.duration && <span>| <span className="font-semibold">Durata:</span> {spell.duration}</span>}
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{spell.description}</p>
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

    const inputClass = fieldControlClass;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-label uppercase text-muted-foreground">Incantesimi e capacità speciali</h4>
                <div className="flex gap-1">
                    <SortButton label="Livello" onClick={() => setSortOrder('level')} isActive={sortOrder === 'level'} />
                    <SortButton label="Alfabetico" onClick={() => setSortOrder('alpha')} isActive={sortOrder === 'alpha'} />
                </div>
            </div>
            <div className="space-y-4">
                {companion.spells.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessuna capacità speciale.</p>
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
                <button onClick={addSpell} type="button" className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong/60 text-sm font-semibold text-text transition-colors duration-150 hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <PlusIcon className="w-4 h-4" /> Aggiungi incantesimo o capacità
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
    <div className="space-y-2 rounded-2xl bg-background/50 p-3">
        <div className="flex justify-between items-start gap-2">
            <input type="text" placeholder="Nome dell'incantesimo o capacità" value={spell.name} onChange={(e) => onSpellChange(spell.id, 'name', e.target.value)} className={`${inputClass} font-semibold`} />
            <button onClick={() => onDelete(spell.id)} type="button" aria-label="Elimina" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><TrashIcon className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <input type="number" placeholder="Livello (0 per i trucchetti)" value={spell.level} onChange={(e) => onSpellChange(spell.id, 'level', e.target.value)} className={`${inputClass} no-spinner`} />
            <input type="text" placeholder="Scuola (es. Invocazione)" value={spell.school} onChange={(e) => onSpellChange(spell.id, 'school', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Tempo di lancio" value={spell.castingTime} onChange={(e) => onSpellChange(spell.id, 'castingTime', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Gittata" value={spell.range} onChange={(e) => onSpellChange(spell.id, 'range', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Componenti (V, S, M)" value={spell.components} onChange={(e) => onSpellChange(spell.id, 'components', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Durata" value={spell.duration} onChange={(e) => onSpellChange(spell.id, 'duration', e.target.value)} className={inputClass} />
        </div>
        <textarea
            placeholder="Descrizione, effetti, danni…"
            value={spell.description}
            onChange={(e) => onSpellChange(spell.id, 'description', e.target.value)}
            rows={3}
            className={`${inputClass} resize-y leading-relaxed`}
        />
    </div>
);