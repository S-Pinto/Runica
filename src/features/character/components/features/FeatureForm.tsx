import React, { useState } from 'react';
import { Feature } from '../../characterTypes';
import { fieldCheckRowClass, fieldControlClass, fieldGroupClass, fieldLabelClass, fieldNumericClass } from '../../../../components/ui/field';
import { InlineForm } from '../ui/InlineForm';

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
        <InlineForm
            title={'id' in initialData ? 'Modifica privilegio' : 'Nuovo privilegio'}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            submitLabel="Salva privilegio"
            className="mb-4"
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="feature-name" className={fieldLabelClass}>Nome</label>
                    <input
                        id="feature-name"
                        type="text"
                        placeholder="Es. Azione impetuosa"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        required
                        className={fieldControlClass}
                    />
                </div>
                <div>
                    <label htmlFor="feature-category" className={fieldLabelClass}>Categoria</label>
                    <select
                        id="feature-category"
                        value={formData.category}
                        onChange={e => handleChange('category', e.target.value)}
                        className={fieldControlClass}
                    >
                        <option value="class">Privilegio di classe</option>
                        <option value="racial">Tratto di specie</option>
                        <option value="feat-origin">Talento delle origini</option>
                        <option value="feat-general">Talento generale</option>
                        <option value="feat-combat">Talento di combattimento</option>
                        <option value="feat-epic">Dono epico</option>
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="feature-description" className={fieldLabelClass}>Descrizione</label>
                <textarea
                    id="feature-description"
                    placeholder="Descrivi il privilegio o il tratto…"
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                    rows={4}
                    className={`${fieldControlClass} resize-y leading-relaxed`}
                />
            </div>

            <div className={`${fieldGroupClass} grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end`}>
                <div>
                    <label htmlFor="feature-uses" className={fieldLabelClass}>Usi massimi</label>
                    <input
                        id="feature-uses"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        value={formData.uses?.max || ''}
                        onChange={e => {
                            const max = parseInt(e.target.value) || 0;
                            handleChange('uses', { max, current: formData.uses?.current ?? max });
                        }}
                        className={fieldNumericClass}
                    />
                </div>
                <div>
                    <label htmlFor="feature-recovery" className={fieldLabelClass}>Si ricarica con</label>
                    <select
                        id="feature-recovery"
                        value={formData.recovery || 'none'}
                        onChange={e => handleChange('recovery', e.target.value)}
                        className={fieldControlClass}
                    >
                        <option value="none">Non si ricarica</option>
                        <option value="short">Riposo breve</option>
                        <option value="long">Riposo lungo</option>
                    </select>
                </div>
                <label className={`${fieldCheckRowClass} sm:min-h-[46px]`}>
                    <input
                        type="checkbox"
                        className="check-rune"
                        checked={formData.isAction || false}
                        onChange={e => handleChange('isAction', e.target.checked)}
                    />
                    Mostra in combattimento
                </label>
            </div>
        </InlineForm>
    );
};
