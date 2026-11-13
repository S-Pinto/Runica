import { useState } from 'react';
import { Feature, FeatureCategory, CATEGORY_CONFIG } from '../../characterTypes';
import { PlusIcon, ChevronDownIcon } from '../../../../components/ui/icons';
import { Button } from '../../../../components/ui/Button';
import { RowActions } from '../ui/InlineForm';

const RECOVERY_LABELS: Record<string, string> = { short: 'riposo breve', long: 'riposo lungo' };

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

    const config = CATEGORY_CONFIG[category];
    const count = features.length;
    const listId = `features-${category}`;

    const toggleFeature = (id: string) => {
        setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="rounded-xl border border-border bg-background/40">
            <div className="flex items-center gap-1 py-1 pl-1 pr-2">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    aria-controls={listId}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">{config.label}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{count}</span>
                </button>
                <Button variant="ghost" size="sm" onClick={() => onAdd(category)} className="h-9 text-accent" aria-label={`Aggiungi a ${config.label}`}>
                    <PlusIcon className="h-3.5 w-3.5" /> Aggiungi
                </Button>
            </div>

            {isExpanded && (
                <div id={listId} className="border-t border-border">
                    {count === 0 ? (
                        <p className="px-4 py-4 text-sm text-muted-foreground">{config.description}.</p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {features.map(feature => {
                                const open = !!expandedFeatures[feature.id];
                                const uses = feature.uses && feature.uses.max > 0 ? feature.uses : null;
                                return (
                                    <li key={feature.id}>
                                        <div className="flex items-center gap-1 py-1 pl-1 pr-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleFeature(feature.id)}
                                                aria-expanded={open}
                                                disabled={!feature.description}
                                                className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                                            >
                                                <span className="min-w-0 break-words text-sm font-semibold text-accent">{feature.name}</span>
                                                {feature.description && (
                                                    <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>
                                            <RowActions name={feature.name} onEdit={() => onEdit(feature)} onDelete={() => onDelete(feature.id)} />
                                        </div>

                                        {uses && (
                                            <div className="flex flex-wrap items-center gap-x-3 px-3 pb-2">
                                                <div className="flex flex-wrap gap-1.5 py-1" aria-hidden>
                                                    {Array.from({ length: uses.max }).map((_, i) => (
                                                        <span key={i} className="seal scale-75" data-on={i < uses.current} />
                                                    ))}
                                                </div>
                                                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                                    <span className="font-bold text-foreground">{uses.current}</span>/{uses.max}
                                                    {feature.recovery && RECOVERY_LABELS[feature.recovery] && <span className="font-sans"> · {RECOVERY_LABELS[feature.recovery]}</span>}
                                                </span>
                                            </div>
                                        )}

                                        {open && feature.description && (
                                            <p className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed text-text animate-fadeIn">{feature.description}</p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};
