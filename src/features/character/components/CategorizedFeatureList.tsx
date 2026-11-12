import { useState, useMemo } from 'react';
import { Feature, FeatureCategory } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { FeatureForm } from './features/FeatureForm';
import { CategorySection } from './features/CategorySection';


const DEFAULT_FEATURE: Omit<Feature, 'id'> = {
    name: '',
    description: '',
    category: 'class',
};



const CategorizedFeatureListContent = () => {
    const { character: maybeCharacter, updateCharacter } = useCharacter();
    const character = maybeCharacter!;
    const [editingFeature, setEditingFeature] = useState<Feature | Omit<Feature, 'id'> | null>(null);


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
                <h3 className="text-lg font-cinzel text-accent">Privilegi e tratti</h3>
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
                <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-accent/30 overflow-hidden">
                    <div className="p-3 bg-accent/5 border-b border-accent/20">
                        <h4 className="font-cinzel text-base font-bold text-accent flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            Talenti
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

/** Renders CategorizedFeatureListContent only once the character is loaded, so its hooks never run conditionally. */
export const CategorizedFeatureList = () => {
    const { character } = useCharacter();
    return character ? <CategorizedFeatureListContent /> : null;
};
