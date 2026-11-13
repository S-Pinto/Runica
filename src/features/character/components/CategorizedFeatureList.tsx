import { useState, useMemo } from 'react';
import { Feature, FeatureCategory } from '../characterTypes';
import { useCharacter } from '../CharacterProvider';
import { FeatureForm } from './features/FeatureForm';
import { CategorySection } from './features/CategorySection';
import { StyledSection } from './ui/StyledInputs';
import { BoltIcon } from '../../../components/ui/icons';


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

    const section = (category: FeatureCategory) => (
        <CategorySection
            category={category}
            features={featuresByCategory[category]}
            onEdit={setEditingFeature}
            onDelete={handleDeleteFeature}
            onAdd={handleAddFeature}
        />
    );

    return (
        <StyledSection icon={<BoltIcon className="text-muted-foreground" />} title="Privilegi e tratti">
            {editingFeature && (
                <FeatureForm
                    key={'id' in editingFeature ? editingFeature.id : `new-${editingFeature.category}`}
                    initialData={editingFeature}
                    onSave={handleSaveFeature}
                    onCancel={() => setEditingFeature(null)}
                />
            )}

            <div className="space-y-3">
                {section('class')}
                {section('racial')}

                <h4 className="flex items-center gap-3 pt-2 text-label uppercase text-muted-foreground">
                    Talenti
                    <span aria-hidden className="h-px flex-1 bg-border" />
                </h4>
                {section('feat-origin')}
                {section('feat-general')}
                {section('feat-combat')}
                {section('feat-epic')}
            </div>
        </StyledSection>
    );
};

/** Renders CategorizedFeatureListContent only once the character is loaded, so its hooks never run conditionally. */
export const CategorizedFeatureList = () => {
    const { character } = useCharacter();
    return character ? <CategorizedFeatureListContent /> : null;
};
