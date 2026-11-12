import { useState } from 'react';
import { Feature, FeatureCategory, CATEGORY_CONFIG } from '../../characterTypes';
import { TrashIcon, EditIcon, PlusCircleIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '../../../../components/ui/icons';

export const CategorySection = ({
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
                    className={`flex items-center gap-1.5 text-xs bg-${config.color}/10 hover:bg-${config.color} text-${config.color} hover:text-accent-foreground border border-${config.color}/20 rounded-lg px-3 py-1.5 transition-all font-bold uppercase tracking-wide`}
                >
                    <PlusCircleIcon className="w-4 h-4" />
                    Aggiungi
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
                                        <div className="flex flex-col gap-0.5">
                                            <span className={`font-semibold text-${config.color}`}>{feature.name}</span>
                                            {feature.uses && feature.uses.max > 0 && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        {[...Array(feature.uses.max)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                onClick={() => {
                                                                    // Toggle usage
                                                                    const newCurrent = i < (feature.uses?.current || 0) ? i : i + 1;
                                                                    onEdit({ ...feature, uses: { ...feature.uses!, current: newCurrent } });
                                                                }}
                                                                className={`w-3 h-3 rounded-sm border cursor-pointer transition-all ${i < (feature.uses?.current || 0) ? `bg-${config.color} border-${config.color}` : 'bg-transparent border-muted-foreground/30'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        {feature.uses.current}/{feature.uses.max}
                                                        {feature.recovery !== 'none' && <span className="ml-1 opacity-70">({feature.recovery})</span>}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {deletingId === feature.id ? (
                                                <>
                                                    <span className="text-xs text-destructive-foreground">Sicuro?</span>
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
