import React, { useState } from 'react';
import { ICharacter, CustomResource } from '../characterTypes';
import { TrashIcon, EditIcon, PlusCircleIcon } from '../../../components/ui/icons';

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
    <form onSubmit={handleSubmit} className="bg-card/80 p-4 rounded-lg border border-accent/30 space-y-4 mb-4">
      <h3 className="font-cinzel text-lg text-accent">{'id' in initialData ? 'Edit Resource' : 'Add New Resource'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input type="text" placeholder="Resource Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className="w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent sm:col-span-2" />
        <input type="number" placeholder="Max" value={formData.max} onChange={e => handleChange('max', parseInt(e.target.value) || 1)} min="1" className="w-full bg-input p-2 rounded border border-border focus:ring-ring focus:border-accent text-center" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded transition">Cancel</button>
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition">Save</button>
      </div>
    </form>
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
    if (window.confirm('Are you sure you want to delete this resource?')) {
      const updatedResources = (character.customResources || []).filter(r => r.id !== resourceId);
      onUpdateCharacter({ customResources: updatedResources });
    }
  };

  return (
    <div className="bg-muted/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-accent">Other Resources</h3>
        <button onClick={() => setEditingResource('new')} className="flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground transition">
          <PlusCircleIcon className="w-5 h-5" /> Add Resource
        </button>
      </div>

      {editingResource && (
        <ResourceForm
          initialData={editingResource === 'new' ? DEFAULT_RESOURCE : editingResource}
          onSave={handleSave}
          onCancel={() => setEditingResource(null)}
        />
      )}

      <div className="space-y-2">
        {(character.customResources || []).length === 0 && !editingResource && (
            <p className="text-center text-muted-foreground text-sm py-4">No custom resources defined.</p>
        )}
        {(character.customResources || []).map(resource => (
          <div key={resource.id} className="bg-card/50 rounded-lg text-sm p-3 flex items-center justify-between">
              <span className="font-semibold text-accent">{resource.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">Max: {resource.max}</span>
                <button onClick={() => setEditingResource(resource)} className="text-muted-foreground hover:text-accent p-1"><EditIcon className="w-4 h-4"/></button>
                <button onClick={() => handleDelete(resource.id)} className="text-muted-foreground hover:text-destructive p-1"><TrashIcon className="w-4 h-4"/></button>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};