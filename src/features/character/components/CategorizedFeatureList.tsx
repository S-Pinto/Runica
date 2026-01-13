import React, { useState, useMemo } from 'react';
import { Feature, FeatureCategory, CATEGORY_CONFIG } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { TrashIcon, EditIcon, PlusCircleIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '../../../components/ui/icons';


const DEFAULT_FEATURE: Omit<Feature, 'id'> = {
    name: '',
    description: '',
    category: 'class',
};

const FeatureForm = ({
    initialData,
    onSave,
    onCancel,
}: {
    initialData: Feature | Omit<Feature, 'id'>;
    onSave: (data: Feature | Omit<Feature, 'id'>) => void;
    onCancel: () => void;
}) => {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card/95 backdrop-blur-md p-6 rounded-xl border border-accent/20 space-y-4 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <h3 className="font-cinzel text-xl font-bold text-accent">{'id' in initialData ? 'Edit Feature' : 'New Feature'}</h3>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Category</label>
                    <select
                        value={formData.category}
                        onChange={e => handleChange('category', e.target.value)}
                        className="w-full bg-background/50 p-2.5 rounded-lg border border-border/50 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    >
                        <option value="class">Class Feature</option>
                        <option value="racial">Racial Trait</option>
                        <option value="feat-origin">Origin Feat</option>
                        <option value="feat-general">General Feat</option>
                        <option value="feat-combat">Combat Feat</option>
                        <option value="feat-epic">Epic Feat</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Action Surge, Darkvision"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        required
                        className="w-full bg-background/50 p-2.5 rounded-lg border border-border/50 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-semibold"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Description</label>
                    <textarea
                        placeholder="Describe the feature or trait..."
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        rows={6}
                        className="w-full bg-background/50 p-2.5 rounded-lg border border-border/50 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-y"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/20">
                <button type="button" onClick={onCancel} className="bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground font-bold py-2 px-5 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-2 px-6 rounded-lg transition-all shadow-md hover:shadow-lg hover:shadow-accent/20 text-sm">Save</button>
            </div>
        </form>
    );
};

const CategorySection = ({
    category,
    features,
    onEdit,
    onDelete,
    onAdd,
}: {
    category: FeatureCategory;
    features: Feature[];
    onEdit: (feature: Feature) => void;
    onDelete: (id: string) => void;
    onAdd: (category: FeatureCategory) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const config = CATEGORY_CONFIG[category];
    const count = features.length;

    const toggleFeature = (id: string) => {
        setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/40 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-card/60 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />}
                    <h3 className={`font-cinzel text-lg font-bold text-${config.color}`}>{config.label}</h3>
                    {count > 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${config.color}/10 text-${config.color} border border-${config.color}/20`}>
                            {count}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAdd(category); }}
                    className={`flex items-center gap-1.5 text-xs bg-${config.color}/10 hover:bg-${config.color} text-${config.color} hover:text-white border border-${config.color}/20 rounded-lg px-3 py-1.5 transition-all font-bold uppercase tracking-wide`}
                >
                    <PlusCircleIcon className="w-4 h-4" />
                    Add
                </button>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-border/30">
                    {count === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-sm text-muted-foreground italic">{config.description}</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            {features.map(feature => (
                                <div key={feature.id} className="bg-background/30 rounded-lg overflow-hidden border border-border/20">
                                    <div
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-background/50 transition-colors"
                                        onClick={() => toggleFeature(feature.id)}
                                    >
                                        <span className={`font-semibold text-${config.color}`}>{feature.name}</span>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {deletingId === feature.id ? (
                                                <>
                                                    <span className="text-xs text-destructive-foreground">Sure?</span>
                                                    <button onClick={() => { onDelete(feature.id); setDeletingId(null); }} className="text-destructive hover:text-destructive-foreground p-1"><CheckIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => setDeletingId(null)} className="text-muted-foreground hover:text-accent p-1"><XMarkIcon className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => onEdit(feature)} className="text-muted-foreground hover:text-accent p-1"><EditIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => setDeletingId(feature.id)} className="text-muted-foreground hover:text-destructive p-1"><TrashIcon className="w-4 h-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {expandedFeatures[feature.id] && feature.description && (
                                        <div className="p-3 border-t border-border/20 bg-muted/20">
                                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{feature.description}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const CategorizedFeatureList = () => {
    const { character, updateCharacter } = useCharacter();
    const [editingFeature, setEditingFeature] = useState<Feature | Omit<Feature, 'id'> | null>(null);

    if (!character) return null;

    const handleSaveFeature = (featureData: Feature | Omit<Feature, 'id'>) => {
        let updatedFeatures: Feature[];
        if ('id' in featureData) {
            updatedFeatures = character.featuresAndTraits.map(f => f.id === featureData.id ? featureData as Feature : f);
        } else {
            const newFeature: Feature = { ...featureData, id: `feat_${Date.now()}`, category: featureData.category };
            updatedFeatures = [...character.featuresAndTraits, newFeature];
        }
        updateCharacter({ featuresAndTraits: updatedFeatures });
        setEditingFeature(null);
    };

    const handleDeleteFeature = (featureId: string) => {
        const updatedFeatures = character.featuresAndTraits.filter(f => f.id !== featureId);
        updateCharacter({ featuresAndTraits: updatedFeatures });
    };

    const handleAddFeature = (category: FeatureCategory) => {
        setEditingFeature({ ...DEFAULT_FEATURE, category });
    };

    const featuresByCategory = useMemo(() => {
        const categorized: Record<FeatureCategory, Feature[]> = {
            'class': [],
            'racial': [],
            'feat-origin': [],
            'feat-general': [],
            'feat-combat': [],
            'feat-epic': [],
        };

        character.featuresAndTraits.forEach(feature => {
            // Backward compatibility: if no category, default to 'class'
            const category = feature.category || 'class';
            if (categorized[category]) {
                categorized[category].push(feature);
            }
        });

        // Sort within each category
        Object.keys(categorized).forEach(key => {
            categorized[key as FeatureCategory].sort((a, b) => a.name.localeCompare(b.name));
        });

        return categorized;
    }, [character.featuresAndTraits]);

    return (
        <div className="bg-card/80 p-4 rounded-lg border border-border flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-cinzel text-accent">Features & Traits</h3>
            </div>

            {editingFeature && (
                <FeatureForm
                    initialData={editingFeature}
                    onSave={handleSaveFeature}
                    onCancel={() => setEditingFeature(null)}
                />
            )}

            <div className="space-y-4 overflow-y-auto pr-2 -mr-2 flex-grow">
                <CategorySection
                    category="class"
                    features={featuresByCategory['class']}
                    onEdit={setEditingFeature}
                    onDelete={handleDeleteFeature}
                    onAdd={handleAddFeature}
                />

                <CategorySection
                    category="racial"
                    features={featuresByCategory['racial']}
                    onEdit={setEditingFeature}
                    onDelete={handleDeleteFeature}
                    onAdd={handleAddFeature}
                />

                {/* Feats Group */}
                <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-amber-500/30 overflow-hidden">
                    <div className="p-3 bg-amber-500/5 border-b border-amber-500/20">
                        <h4 className="font-cinzel text-base font-bold text-amber-500 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Feats
                        </h4>
                    </div>
                    <div className="p-3 space-y-3">
                        <CategorySection
                            category="feat-origin"
                            features={featuresByCategory['feat-origin']}
                            onEdit={setEditingFeature}
                            onDelete={handleDeleteFeature}
                            onAdd={handleAddFeature}
                        />
                        <CategorySection
                            category="feat-general"
                            features={featuresByCategory['feat-general']}
                            onEdit={setEditingFeature}
                            onDelete={handleDeleteFeature}
                            onAdd={handleAddFeature}
                        />
                        <CategorySection
                            category="feat-combat"
                            features={featuresByCategory['feat-combat']}
                            onEdit={setEditingFeature}
                            onDelete={handleDeleteFeature}
                            onAdd={handleAddFeature}
                        />
                        <CategorySection
                            category="feat-epic"
                            features={featuresByCategory['feat-epic']}
                            onEdit={setEditingFeature}
                            onDelete={handleDeleteFeature}
                            onAdd={handleAddFeature}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
