import React, { useState } from 'react';
import { Feature } from '../../characterTypes';

export const FeatureForm = ({
    initialData,
    onSave,
    onCancel,
}: {
    initialData: Feature | Omit<Feature, 'id'>;
    onSave: (data: Feature | Omit<Feature, 'id'>) => void;
    onCancel: () => void;
}) => {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (field: string, value: any) => {
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
                <h3 className="font-cinzel text-xl font-bold text-accent">{'id' in initialData ? 'Modifica privilegio' : 'Nuovo privilegio'}</h3>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Categoria</label>
                    <select
                        value={formData.category}
                        onChange={e => handleChange('category', e.target.value)}
                        className="w-full bg-background/50 p-2.5 rounded-lg border border-border/50 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    >
                        <option value="class">Privilegio di classe</option>
                        <option value="racial">Tratto di specie</option>
                        <option value="feat-origin">Talento delle origini</option>
                        <option value="feat-general">Talento generale</option>
                        <option value="feat-combat">Talento di combattimento</option>
                        <option value="feat-epic">Dono epico</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Nome</label>
                    <input
                        type="text"
                        placeholder="Es. Azione impetuosa, Scurovisione"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        required
                        className="w-full bg-background/50 p-2.5 rounded-lg border border-border/50 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-semibold"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Descrizione</label>
                    <textarea
                        placeholder="Descrivi il privilegio o il tratto…"
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        rows={4}
                        className="w-full bg-background/50 p-2.5 rounded-lg border border-border/50 focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-y"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-accent/5 rounded-lg border border-accent/10">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Usi massimi</label>
                        <input
                            type="number"
                            value={formData.uses?.max || ''}
                            onChange={e => {
                                const max = parseInt(e.target.value) || 0;
                                handleChange('uses', { max, current: formData.uses?.current ?? max });
                            }}
                            className="w-full bg-background/50 p-2 rounded border border-border/50 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Si ricarica con</label>
                        <select
                            value={formData.recovery || 'none'}
                            onChange={e => handleChange('recovery', e.target.value)}
                            className="w-full bg-background/50 p-2 rounded border border-border/50 text-sm"
                        >
                            <option value="none">Nessuna</option>
                            <option value="short">Riposo breve</option>
                            <option value="long">Riposo lungo</option>
                        </select>
                    </div>
                    <div className="flex items-end pb-1.5 px-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formData.isAction || false}
                                onChange={e => handleChange('isAction', e.target.checked)}
                                className="rounded border-border text-accent focus:ring-accent"
                            />
                            <span className="text-xs font-bold text-muted-foreground uppercase">Mostra in combattimento</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/20">
                <button type="button" onClick={onCancel} className="bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground font-bold py-2 px-5 rounded-lg transition-colors text-sm">Annulla</button>
                <button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-2 px-6 rounded-lg transition-all shadow-md hover:shadow-lg hover:shadow-accent/20 text-sm">Salva</button>
            </div>
        </form>
    );
};
