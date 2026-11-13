import React, { useState } from 'react';
import { ICompanion, Feature, FeatureCategory } from '../characterTypes';
import { PlusCircleIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '../../../components/ui/icons';
import { StyledInput, StyledTextArea } from './ui/StyledInputs';

interface CompanionFeatureEditorProps {
    companion: ICompanion;
    setCompanion: React.Dispatch<React.SetStateAction<ICompanion>>;
    readOnly?: boolean;
}

export const CompanionFeatureEditor: React.FC<CompanionFeatureEditorProps> = ({ companion, setCompanion, readOnly = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newFeature, setNewFeature] = useState<Partial<Feature>>({
        name: '',
        description: '',
        category: 'racial' // Default to racial as "Traits"
    });

    const handleAddFeature = () => {
        if (!newFeature.name || !newFeature.description) return;

        const feature: Feature = {
            id: `feat_${Date.now()}`,
            name: newFeature.name || '',
            description: newFeature.description || '',
            category: newFeature.category as FeatureCategory || 'racial',
        };

        setCompanion(prev => ({
            ...prev,
            featuresAndTraits: [...prev.featuresAndTraits, feature]
        }));

        setNewFeature({ name: '', description: '', category: 'racial' });
        setIsAdding(false);
    };

    const handleDeleteFeature = (id: string) => {
        if (readOnly) return;
        setCompanion(prev => ({
            ...prev,
            featuresAndTraits: prev.featuresAndTraits.filter(f => f.id !== id)
        }));
    };

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="space-y-4">
            <div className="flex min-h-10 items-center justify-between gap-3">
                <h4 className="text-label uppercase text-muted-foreground">Privilegi e tratti</h4>
                {!readOnly && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        type="button" className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-accent transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <PlusCircleIcon className="w-4 h-4" /> Aggiungi tratto
                    </button>
                )}
            </div>

            {!readOnly && isAdding && (
                <div className="animate-fadeIn space-y-3 rounded-2xl bg-background/50 ring-1 ring-accent/50 p-4">
                    <StyledInput
                        label="Nome del tratto"
                        name="name"
                        value={newFeature.name}
                        onChange={(e: any) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Es. Tattiche del branco"
                    />
                    <StyledTextArea
                        label="Descrizione"
                        name="description"
                        value={newFeature.description}
                        onChange={(e: any) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrizione del tratto…"
                        rows={3}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            type="button" className="h-10 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleAddFeature}
                            disabled={!newFeature.name || !newFeature.description}
                            type="button" className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-rest transition-colors duration-150 hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50"
                        >
                            Aggiungi tratto
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {companion.featuresAndTraits.length === 0 && !isAdding && (
                    <p className="text-sm text-muted-foreground">Nessun tratto speciale.</p>
                )}

                {companion.featuresAndTraits.map(feature => (
                    <div key={feature.id} className="group overflow-hidden rounded-2xl bg-background/50">
                        <div
                            className="flex min-h-11 cursor-pointer items-center justify-between px-3 py-2"
                            onClick={() => toggleExpand(feature.id)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">{feature.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!readOnly && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFeature(feature.id); }}
                                        type="button" aria-label={`Elimina ${feature.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                                {expandedId === feature.id ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
                            </div>
                        </div>

                        {expandedId === feature.id && (
                            <div className="animate-fadeIn px-3 pb-3 text-sm leading-relaxed text-text">
                                <div className="border-t border-border pt-2">
                                    {feature.description}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
