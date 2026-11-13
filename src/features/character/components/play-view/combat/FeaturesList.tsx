import { useState, useMemo } from 'react';
import { Feature, FeatureCategory, CATEGORY_CONFIG } from '../../../characterTypes';
import { ChevronDownIcon, BoltIcon } from '../../../../../components/ui/icons';
import { PlaySection, playLabelClass } from '../PlaySection';

const FEAT_CATEGORIES: FeatureCategory[] = ['feat-origin', 'feat-general', 'feat-combat', 'feat-epic'];

const CategorySectionDisplay = ({
    category,
    features,
}: {
    category: FeatureCategory;
    features: Feature[];
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

    const config = CATEGORY_CONFIG[category];
    const count = features.length;

    // Le categorie dei talenti compaiono solo se contengono qualcosa.
    if (count === 0 && FEAT_CATEGORIES.includes(category)) return null;

    const toggleFeature = (id: string) => {
        setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span className={playLabelClass}>
                    {config.label} <span className="font-mono font-normal tracking-normal">· {count}</span>
                </span>
                <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && count === 0 && (
                <p className="py-3 text-sm text-muted-foreground">{config.description}</p>
            )}

            {isExpanded && count > 0 && (
                <ul className="divide-y divide-border/60">
                    {features.map(feature => {
                        const open = !!expandedFeatures[feature.id];
                        return (
                            <li key={feature.id}>
                                {feature.description ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleFeature(feature.id)}
                                        aria-expanded={open}
                                        className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left text-sm font-semibold text-foreground transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:text-accent"
                                    >
                                        {feature.name}
                                        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
                                    </button>
                                ) : (
                                    <p className="flex min-h-11 items-center py-2 text-sm font-semibold text-foreground">{feature.name}</p>
                                )}
                                {open && feature.description && (
                                    <p className="whitespace-pre-wrap pb-3 text-sm leading-relaxed text-text animate-fadeIn">{feature.description}</p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export const FeaturesList = ({ items }: { items: Feature[] }) => {
    const featuresByCategory = useMemo(() => {
        const categorized: Record<FeatureCategory, Feature[]> = {
            'class': [],
            'racial': [],
            'feat-origin': [],
            'feat-general': [],
            'feat-combat': [],
            'feat-epic': [],
        };

        items.forEach(feature => {
            const category = feature.category || 'class';
            if (categorized[category]) {
                categorized[category].push(feature);
            }
        });

        return categorized;
    }, [items]);

    return (
        <PlaySection title="Privilegi e tratti" icon={<BoltIcon className="text-muted-foreground" />}>
            <div className="space-y-4">
                <CategorySectionDisplay category="class" features={featuresByCategory['class']} />
                <CategorySectionDisplay category="racial" features={featuresByCategory['racial']} />
                {FEAT_CATEGORIES.map(category => (
                    <CategorySectionDisplay key={category} category={category} features={featuresByCategory[category]} />
                ))}
            </div>
        </PlaySection>
    );
};
