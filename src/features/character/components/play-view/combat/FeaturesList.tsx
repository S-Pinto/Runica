import { useState, useMemo } from 'react';
import { Feature, FeatureCategory, CATEGORY_CONFIG } from '../../../characterTypes';
import { ChevronDownIcon, ChevronUpIcon, BoltIcon } from '../../../../../components/ui/icons';

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

    if (count === 0 && (category === 'feat-origin' || category === 'feat-general' || category === 'feat-combat' || category === 'feat-epic')) {
        return null;
    }

    const toggleFeature = (id: string) => {
        setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="rounded-xl overflow-hidden border border-border/30 bg-background/20 mb-3 last:mb-0">
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-card/40 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
                    <h3 className={`font-cinzel text-sm font-bold text-${config.color}`}>{config.label}</h3>
                    {count > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${config.color}/10 text-${config.color} border border-${config.color}/20`}>
                            {count}
                        </span>
                    )}
                </div>
            </div>

            {isExpanded && features.length > 0 && (
                <div className="border-t border-border/20 p-2 space-y-2">
                    {features.map(feature => (
                        <div key={feature.id} className="bg-background/30 rounded-lg overflow-hidden border border-border/10">
                            <button
                                className="flex items-center justify-between p-2.5 w-full text-left disabled:cursor-default focus:outline-none hover:bg-background/40 transition-colors"
                                onClick={() => feature.description && toggleFeature(feature.id)}
                                disabled={!feature.description}
                            >
                                <span className={`font-semibold text-sm text-${config.color} opacity-90`}>{feature.name}</span>
                                {feature.description && <ChevronDownIcon className={`w-4 h-4 text-muted-foreground/60 transition-transform duration-300 ${expandedFeatures[feature.id] ? 'rotate-180 text-accent' : ''}`} />}
                            </button>
                            {expandedFeatures[feature.id] && feature.description && (
                                <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="h-px bg-border/10 w-full mb-2" />
                                    <p className="text-foreground/80 text-xs leading-relaxed whitespace-pre-wrap">{feature.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {isExpanded && features.length === 0 && (
                <div className="p-4 text-center border-t border-border/20">
                    <p className="text-xs text-muted-foreground italic opacity-70">{config.description}</p>
                </div>
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
        <div className="bg-card p-6 rounded-2xl border border-border/50 flex flex-col h-full">
            <h3 className="text-xl font-cinzel font-bold text-foreground mb-6 flex items-center gap-2">
                <BoltIcon className="w-5 h-5" />
                Privilegi e tratti
            </h3>
            <div className="space-y-4 flex-grow overflow-y-auto pr-2 -mr-2">
                <CategorySectionDisplay category="class" features={featuresByCategory['class']} />
                <CategorySectionDisplay category="racial" features={featuresByCategory['racial']} />

                {/* Feats Section Group */}
                <div className="space-y-1">
                    {(featuresByCategory['feat-origin'].length > 0 ||
                        featuresByCategory['feat-general'].length > 0 ||
                        featuresByCategory['feat-combat'].length > 0 ||
                        featuresByCategory['feat-epic'].length > 0) && (
                            <div className="flex items-center gap-2 px-1 pb-2 pt-2">
                                <span className="w-1 h-1 rounded-full bg-accent/50" />
                                <h4 className="text-xs font-bold text-accent/80 uppercase tracking-widest">Talenti</h4>
                                <div className="h-px bg-accent/20 flex-1" />
                            </div>
                        )}

                    <CategorySectionDisplay category="feat-origin" features={featuresByCategory['feat-origin']} />
                    <CategorySectionDisplay category="feat-general" features={featuresByCategory['feat-general']} />
                    <CategorySectionDisplay category="feat-combat" features={featuresByCategory['feat-combat']} />
                    <CategorySectionDisplay category="feat-epic" features={featuresByCategory['feat-epic']} />
                </div>
            </div>
        </div>
    );
};
