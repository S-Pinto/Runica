import React, { useState, useMemo } from 'react';
import { ICharacter, Feature } from '../types';
import { TrashIcon, EditIcon, PlusCircleIcon } from './icons';

const DEFAULT_FEATURE: Omit<Feature, 'id'> = {
  name: '',
  description: '',
};

const FeatureForm = ({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: Feature | Omit<Feature, 'id'>;
  onSave: (data: Feature | Omit<Feature, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };
  
  const inputClass = "w-full bg-zinc-800 p-2 rounded border border-zinc-600 focus:ring-amber-500 focus:border-amber-500";

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-700/80 p-4 rounded-lg border border-amber-500/30 space-y-4 mb-4">
      <h3 className="font-cinzel text-lg text-amber-400">{'id' in initialData ? 'Edit Feature' : 'Add New Feature'}</h3>
      <input type="text" placeholder="Feature or Trait Name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className={inputClass} />
      <textarea placeholder="Description" value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} className={`${inputClass} resize-y`}></textarea>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="bg-zinc-600 hover:bg-zinc-500 text-white font-bold py-2 px-4 rounded transition">Cancel</button>
        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded transition">Save Feature</button>
      </div>
    </form>
  );
};

export const FeatureList = ({ character, onUpdateCharacter }: { character: ICharacter; onUpdateCharacter: (updatedCharacter: ICharacter) => void; }) => {
  const [editingFeature, setEditingFeature] = useState<Feature | 'new' | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

  const handleSaveFeature = (featureData: Feature | Omit<Feature, 'id'>) => {
    let updatedFeatures: Feature[];
    if ('id' in featureData) {
      updatedFeatures = character.featuresAndTraits.map(f => f.id === featureData.id ? featureData : f);
    } else {
      const newFeature: Feature = { ...featureData, id: `feat_${Date.now()}` };
      updatedFeatures = [...character.featuresAndTraits, newFeature];
    }
    onUpdateCharacter({ ...character, featuresAndTraits: updatedFeatures });
    setEditingFeature(null);
  };

  const handleDeleteFeature = (featureId: string) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      const updatedFeatures = character.featuresAndTraits.filter(f => f.id !== featureId);
      onUpdateCharacter({ ...character, featuresAndTraits: updatedFeatures });
    }
  };

  const toggleExpand = (featureId: string) => {
    setExpandedFeatures(prev => ({ ...prev, [featureId]: !prev[featureId] }));
  };

  const sortedFeatures = useMemo(() => {
    return [...character.featuresAndTraits].sort((a,b) => a.name.localeCompare(b.name));
  }, [character.featuresAndTraits]);

  return (
    <div className="bg-zinc-800/80 p-4 rounded-lg border border-zinc-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-cinzel text-amber-400">Features & Traits</h3>
        <button onClick={() => setEditingFeature('new')} className="flex items-center gap-2 text-sm bg-amber-600 hover:bg-amber-500 px-3 py-2 rounded-md text-white transition">
          <PlusCircleIcon className="w-5 h-5" /> Add Feature
        </button>
      </div>

      {editingFeature && (
        <FeatureForm
          initialData={editingFeature === 'new' ? DEFAULT_FEATURE : editingFeature}
          onSave={handleSaveFeature}
          onCancel={() => setEditingFeature(null)}
        />
      )}

      <div className="space-y-2 overflow-y-auto pr-2 -mr-2 flex-grow">
        {sortedFeatures.length === 0 && !editingFeature && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-zinc-500 text-sm py-4">No features or traits have been added.</p>
          </div>
        )}
        {sortedFeatures.map(feature => (
          <div key={feature.id} className="bg-zinc-700/50 rounded-lg text-sm">
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleExpand(feature.id)}>
              <span className="font-semibold text-amber-300">{feature.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setEditingFeature(feature); }} className="text-zinc-400 hover:text-amber-400 p-1"><EditIcon className="w-4 h-4"/></button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteFeature(feature.id); }} className="text-zinc-500 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4"/></button>
              </div>
            </div>
            {expandedFeatures[feature.id] && (
              <div className="p-3 border-t border-zinc-600/50 bg-zinc-900/30">
                <p className="text-zinc-300 whitespace-pre-wrap">{feature.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};