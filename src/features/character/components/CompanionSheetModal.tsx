import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICompanion } from '../characterTypes';
import { XMarkIcon, SaveIcon, PhotoIcon, BoltIcon } from '../../../components/ui/icons';
import { useAuth } from '../../../providers/AuthProvider';
import { useCharacter } from '../CharacterProvider';
import { ImageUploader } from './ImageUploader';
import { CompanionAttackEditor } from './CompanionAttackEditor';
import { CompanionSpellEditor } from './CompanionSpellEditor';
import { CompanionHpManager } from './CompanionHpManager';
import { debounce } from 'lodash';
import { StatInput } from './StatInput';
import { getModifier, formatModifier }  from '../utils/characterUtils';
import * as storageService from '../../../services/storageService';

interface CompanionSheetModalProps {
  companion: ICompanion;
  onSave: (companion: ICompanion, closeModal?: boolean) => void;
  onClose: () => void;
  readOnly?: boolean;
}

const Input = ({ label, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-muted-foreground">{label}</label>
    <input {...props} className={`mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent sm:text-sm ${props.type === 'number' ? 'no-spinner' : ''}`} />
  </div>
);

const DisplayField = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div>
        <label className="block text-sm font-medium text-muted-foreground">{label}</label>
        <div className="mt-1 block w-full bg-input/50 border border-transparent rounded-md py-2 px-3 text-foreground/80 sm:text-sm min-h-[42px] flex items-center">
            {value || <span className="text-muted-foreground/50">N/A</span>}
        </div>
    </div>
);

const StatDisplay = ({ label, value }: { label: string, value: number }) => {
  const modifier = formatModifier(getModifier(value));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-lg font-bold text-accent h-7 flex items-center">{modifier}</div>
      <div className="w-full bg-input/50 border border-transparent rounded-md py-2 px-3 text-foreground/80 text-2xl min-h-[52px] flex items-center justify-center font-bold">
        {value}
      </div>
      <label className="block text-sm font-medium text-muted-foreground mt-1">{label}</label>
    </div>
  );
};

const ModalTabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive
                ? 'bg-accent/20 text-accent'
                : 'text-muted-foreground hover:bg-muted/50'
        }`}
    >
        {label}
    </button>
);

export const CompanionSheetModal: React.FC<CompanionSheetModalProps> = ({ companion, onSave, onClose, readOnly = false }) => {
  const [data, setData] = useState<ICompanion>(companion);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const { currentUser } = useAuth();
  const { character } = useCharacter(); // Get the main character to associate the companion
  const [activeTab, setActiveTab] = useState<'overview' | 'combat' | 'notes'>('overview');
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(debounce((updatedCompanion: ICompanion) => {
    if (readOnly) onSave(updatedCompanion, false);
  }, 1000), [readOnly, onSave]);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  const handleHpFieldChange = (field: 'max', value: number) => {
    setData(prev => {
        const newHp = { ...prev.hp, [field]: value };
        // When max HP changes, also ensure current HP is not higher.
        if (field === 'max') {
            newHp.current = Math.min(prev.hp.current, value);
        }
        return { ...prev, hp: newHp };
    });
  };

  const handleAbilityScoreChange = (key: string, newValue: number) => {
    setData(prev => ({
      ...prev,
      abilityScores: { ...prev.abilityScores, [key]: newValue }
    }));
  };

  const handleHpManagerChange = (newHp: ICompanion['hp']) => {
    const updatedCompanion = { ...data, hp: newHp };
    setData(updatedCompanion);
    debouncedSave(updatedCompanion);
  };

  const handleSave = () => {
    onSave(data);
  };
  
  const handleImageUpload = async (dataUrl: string) => {
    if (!currentUser || !character) {
        const message = "User or character not found. Cannot upload image.";
        throw new Error(message);
    }
    try {
        const imageUrl = await storageService.uploadCompanionPortrait(dataUrl, currentUser.uid, character.id, data.id);
      const newCompanionData = { ...data, imageUrl };
      // Update local state to show the new image immediately
      setData(newCompanionData);
      // Save the change to the parent component without closing the modal
      onSave(newCompanionData, false);
        // The uploader will close itself on success because the promise resolves
    } catch (error) {
        console.error("Failed to upload companion image:", error);
        // Propagate the error so the uploader can display it
        throw new Error("Error uploading image. Please try again.");
    }
  };

  const dexModifier = getModifier(data.abilityScores.dexterity);
  const initiative = dexModifier;

  return (
    <dialog ref={dialogRef} onClose={onClose} className="bg-card text-foreground p-0 rounded-lg shadow-2xl w-full max-w-3xl border border-border backdrop-filter backdrop-blur-sm backdrop:bg-black/50">
      <header className="flex items-center justify-between p-4 border-b border-zinc-700 sticky top-0 bg-zinc-800 z-10">
        <h3 className="text-lg font-cinzel text-accent">{readOnly ? data.name : 'Edit Companion'}</h3>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg shadow-md hover:bg-primary/90 transition-colors">
              <SaveIcon className="w-5 h-5" /> Save
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
        </div>
      </header>
      
      <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <ModalTabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <ModalTabButton label="Combat" isActive={activeTab === 'combat'} onClick={() => setActiveTab('combat')} />
            <ModalTabButton label="Notes" isActive={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
        </div>

        <div hidden={activeTab !== 'overview'} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Portrait</label>
                    <div onClick={() => !readOnly && setIsUploaderOpen(true)} className={`w-24 h-24 bg-muted rounded-md overflow-hidden group relative ${!readOnly && 'cursor-pointer'}`}>
                        {data.imageUrl ? (
                            <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
                        ) : (
                            <PhotoIcon className="w-full h-full text-muted-foreground p-4" />
                        )}
                        {!readOnly && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs">Change</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {readOnly ? (
                        <>
                            <DisplayField label="Name" value={data.name} />
                            <DisplayField label="Type" value={data.type} />
                        </>
                    ) : (
                        <>
                            <Input label="Name" name="name" value={data.name} onChange={handleChange} />
                            <Input label="Type" name="type" value={data.type} onChange={handleChange} placeholder="e.g., Familiar, Beast" />
                        </>
                    )}
                </div>
            </div>
            
            <CompanionHpManager hp={data.hp} onHpChange={handleHpManagerChange} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {readOnly ? <DisplayField label="Armor Class" value={data.armorClass} /> : <Input label="Armor Class" name="armorClass" type="number" value={data.armorClass} onChange={handleChange} />}
                {readOnly ? <DisplayField label="Speed" value={data.speed} /> : <Input label="Speed" name="speed" value={data.speed} onChange={handleChange} />}
                <DisplayField label="Initiative" value={formatModifier(dexModifier)} />
                {readOnly ? <DisplayField label="Max HP" value={data.hp.max} /> : <Input label="Max HP" type="number" value={data.hp.max} onChange={(e: any) => handleHpFieldChange('max', parseInt(e.target.value) || 0)} />}
            </div>

            <div>
                <h4 className="text-md font-semibold text-zinc-400 mb-2">Ability Scores</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {readOnly ? (
                        Object.keys(data.abilityScores).map(key => (
                            <StatDisplay
                                key={key}
                                label={key.substring(0, 3).toUpperCase()}
                                value={data.abilityScores[key as keyof typeof data.abilityScores]}
                            />
                        ))
                    ) : (
                      Object.keys(data.abilityScores).map(key => (
                          <StatInput
                              key={key}
                              label={key.substring(0, 3).toUpperCase()}
                              value={data.abilityScores[key as keyof typeof data.abilityScores]}
                              onChange={(newValue) => handleAbilityScoreChange(key, Number(newValue))}
                          />
                      ))
                    )}
                </div>
            </div>
        </div>

        <div hidden={activeTab !== 'combat'} className="space-y-6">
            <CompanionAttackEditor companion={data} setCompanion={setData} readOnly={readOnly} />
            <CompanionSpellEditor companion={data} setCompanion={setData} readOnly={readOnly} />
        </div>

        <div hidden={activeTab !== 'notes'}>
            <div>
                <label className="block text-sm font-medium text-muted-foreground">Notes, Features & Traits</label>
                {readOnly ? (
                    <div className="mt-1 p-3 bg-input/50 rounded-md min-h-[200px] text-foreground/80 whitespace-pre-wrap">{data.notes || <span className="text-muted-foreground/50">No notes.</span>}</div>
                ) : (
                    <textarea
                        name="notes"
                        value={data.notes}
                        onChange={handleChange}
                        rows={12}
                        className="mt-1 block w-full bg-input border border-border rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-accent sm:text-sm"
                        placeholder="Special abilities, background, resistances, immunities, etc."
                    />
                )}
            </div>
        </div>
      </div>
      <ImageUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onImageReady={handleImageUpload}
      />
    </dialog>
  );
};