import React, { useState } from 'react';
import { ICharacter, CustomResource } from '../characterTypes';
import { PlusIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { fieldControlClass, fieldGroupTitleClass, fieldLabelClass, fieldNumericClass } from '../../../components/ui/field';
import { InlineForm, RowActions } from './ui/InlineForm';

const DEFAULT_RESOURCE: Omit<CustomResource, 'id' | 'used'> = {
  name: '',
  max: 1,
};

const ResourceForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Omit<CustomResource, 'id' | 'used'> | Omit<CustomResource, 'used'>;
  onSave: (data: Omit<CustomResource, 'id' | 'used'> | Omit<CustomResource, 'used'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: keyof Omit<CustomResource, 'id' | 'used'>, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <InlineForm
      title={'id' in initialData ? 'Modifica risorsa' : 'Nuova risorsa'}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel="Salva risorsa"
      className="mb-3"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="resource-name" className={fieldLabelClass}>Nome</label>
          <input id="resource-name" type="text" placeholder="Es. Punti ki" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={fieldControlClass} />
        </div>
        <div>
          <label htmlFor="resource-max" className={fieldLabelClass}>Massimo</label>
          <input id="resource-max" type="number" inputMode="numeric" value={formData.max} onChange={e => handleChange('max', parseInt(e.target.value) || 1)} min="1" className={fieldNumericClass} />
        </div>
      </div>
    </InlineForm>
  );
};

export const CustomResourceEditor = ({ character, onUpdateCharacter }: { character: ICharacter; onUpdateCharacter: (updatedFields: Partial<ICharacter>) => void; }) => {
  const [editingResource, setEditingResource] = useState<CustomResource | 'new' | null>(null);

  const handleSave = (resourceData: Omit<CustomResource, 'id' | 'used'> | Omit<CustomResource, 'used'>) => {
    let updatedResources: CustomResource[];
    if ('id' in resourceData) {
      updatedResources = (character.customResources || []).map(r => r.id === resourceData.id ? {...r, name: resourceData.name, max: resourceData.max} : r);
    } else {
      const newResource: CustomResource = { ...resourceData, id: `resource_${Date.now()}`, used: 0 };
      updatedResources = [...(character.customResources || []), newResource];
    }
    onUpdateCharacter({ customResources: updatedResources });
    setEditingResource(null);
  };

  const handleDelete = (resourceId: string) => {
    onUpdateCharacter({ customResources: (character.customResources || []).filter(r => r.id !== resourceId) });
  };

  const resources = character.customResources || [];

  return (
    <div>
      <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
        <h4 className={fieldGroupTitleClass}>Risorse personalizzate</h4>
        <Button variant="ghost" size="sm" onClick={() => setEditingResource('new')} disabled={editingResource !== null} className="h-9 text-accent">
          <PlusIcon className="h-3.5 w-3.5" /> Aggiungi
        </Button>
      </div>

      {editingResource && (
        <ResourceForm
          key={editingResource === 'new' ? 'new' : editingResource.id}
          initialData={editingResource === 'new' ? DEFAULT_RESOURCE : editingResource}
          onSave={handleSave}
          onCancel={() => setEditingResource(null)}
        />
      )}

      {resources.length === 0 && !editingResource ? (
        <p className="text-sm text-muted-foreground">Punti ki, ispirazione bardica, furia: tutto ciò che si conta e si recupera.</p>
      ) : (
        <ul className="divide-y divide-border">
          {resources.map(resource => (
            <li key={resource.id} className="flex min-h-11 items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{resource.name}</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">max <span className="font-bold text-foreground">{resource.max}</span></span>
              <RowActions name={resource.name} onEdit={() => setEditingResource(resource)} onDelete={() => handleDelete(resource.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
