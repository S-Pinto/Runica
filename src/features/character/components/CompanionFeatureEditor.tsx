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
            <div className="flex justify-between items-center border-b border-border pb-2">
                <h4 className="text-lg font-cinzel text-accent">Features & Traits</h4>
                {!readOnly && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/90 transition-colors"
                    >
                        <PlusCircleIcon className="w-4 h-4" /> Add Trait
                    </button>
                )}
            </div>

            {!readOnly && isAdding && (
                <div className="bg-card/50 p-4 rounded-lg border border-accent/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <StyledInput
                        label="Trait Name"
                        name="name"
                        value={newFeature.name}
                        onChange={(e: any) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Pack Tactics"
                    />
                    <StyledTextArea
                        label="Description"
                        name="description"
                        value={newFeature.description}
                        onChange={(e: any) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description of the trait..."
                        rows={3}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddFeature}
                            disabled={!newFeature.name || !newFeature.description}
                            className="px-3 py-1 text-xs font-bold bg-accent text-accent-foreground rounded-md shadow-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
                        >
                            Add Trait
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {companion.featuresAndTraits.length === 0 && !isAdding && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">No special traits recorded.</p>
                )}

                {companion.featuresAndTraits.map(feature => (
                    <div key={feature.id} className="bg-card/40 border border-border rounded-lg overflow-hidden group">
                        <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/5 transition-colors"
                            onClick={() => toggleExpand(feature.id)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{feature.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!readOnly && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFeature(feature.id); }}
                                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                                {expandedId === feature.id ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
                            </div>
                        </div>

                        {expandedId === feature.id && (
                            <div className="px-3 pb-3 pt-0 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1">
                                <div className="border-t border-border/50 pt-2 mt-1">
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
