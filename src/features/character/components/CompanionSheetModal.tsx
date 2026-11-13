import React, { useState, useCallback } from 'react';
import { ICompanion, AbilityScores } from '../characterTypes';
import { SaveIcon, PhotoIcon, EditIcon } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { ABILITY_LABELS, ABILITY_SHORT } from '../../../lib/labels';
import { useAuth } from '../../../providers/AuthProvider';
import { useCharacter } from '../CharacterProvider';
import { ImageUploader } from './ImageUploader';
import { ImageModal } from '../../../components/ui/ImageModal';
import { CompanionAttackEditor } from './CompanionAttackEditor';
import { CompanionSpellEditor } from './CompanionSpellEditor';
import { CompanionHpManager, HpData } from './CompanionHpManager';
import { debounce } from '../../../lib/debounce';
import { StatInput } from './StatInput';
import { StyledInput, StyledTextArea } from './ui/StyledInputs';
import { getModifier, formatModifier } from '../utils/characterUtils';
import * as storageService from '../../../services/storageService';
import { CompanionSkillSelector } from './CompanionSkillSelector';
import { CompanionFeatureEditor } from './CompanionFeatureEditor';

interface CompanionSheetModalProps {
  companion: ICompanion;
  onSave: (companion: ICompanion, closeModal?: boolean) => void;
  onClose: () => void;
  readOnly?: boolean;
  onSetReadOnly?: (isReadOnly: boolean) => void;
}

const sectionTitleClass = 'mb-2 text-label uppercase text-muted-foreground';

/** Valore in sola lettura dentro la cornice incisa: numero prima, etichetta sotto. */
const ReadStat = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="frame-rune px-3 py-3 text-center">
    <div className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">{value || '–'}</div>
    <div className="mt-1.5 text-xs text-muted-foreground">{label}</div>
  </div>
);

const AbilityDisplay = ({ ability, value }: { ability: keyof AbilityScores, value: number }) => (
  <div className="rounded-xl border border-border bg-background/40 px-2 py-2.5 text-center" title={ABILITY_LABELS[ability]}>
    <div className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">{formatModifier(getModifier(value))}</div>
    <div className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">{value}</div>
    <div className="mt-1 text-label uppercase text-muted-foreground">{ABILITY_SHORT[ability]}</div>
  </div>
);

type SheetTab = 'overview' | 'combat' | 'notes';

const SHEET_TABS: { value: SheetTab; label: string }[] = [
  { value: 'overview', label: 'Panoramica' },
  { value: 'combat', label: 'Combattimento' },
  { value: 'notes', label: 'Tratti e note' },
];

export const CompanionSheetModal: React.FC<CompanionSheetModalProps> = ({ companion, onSave, onClose, readOnly = false, onSetReadOnly }) => {
  const [data, setData] = useState<ICompanion>(companion);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const { currentUser } = useAuth();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { character } = useCharacter(); // Get the main character to associate the companion
  const [activeTab, setActiveTab] = useState<SheetTab>('overview');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(debounce((updatedCompanion: ICompanion) => {
    if (readOnly) onSave(updatedCompanion, false);
  }, 1000), [readOnly, onSave]);

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

  const handleHpManagerChange = (newHp: HpData) => {
    const updatedCompanion = { ...data, hp: newHp };
    setData(updatedCompanion);
    debouncedSave(updatedCompanion);
  };

  const handleSave = () => {
    onSave(data);
  };

  const handleEdit = () => {
    if (onSetReadOnly) {
      onSetReadOnly(false);
    }
  };

  const handleImageUpload = async (dataUrl: string) => {
    if (!currentUser || !character) {
      throw new Error('Accedi per caricare un ritratto.');
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
      throw new Error('Caricamento non riuscito. Riprova.');
    }
  };

  const handleSkillChange = (newSkills: any[]) => {
    setData(prev => ({ ...prev, skills: newSkills }));
  };

  const dexModifier = getModifier(data.abilityScores.dexterity);

  const abilityKeys = Object.keys(data.abilityScores) as (keyof AbilityScores)[];
  const canOpenPortrait = readOnly ? !!data.imageUrl : true;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={readOnly ? data.name || 'Compagno' : 'Modifica compagno'}
        size="xl"
        toolbar={
          <div className="px-4 py-2.5 sm:px-5">
            <SegmentedControl label="Sezioni della scheda del compagno" options={SHEET_TABS} value={activeTab} onChange={setActiveTab} />
          </div>
        }
        footer={
          readOnly ? (
            onSetReadOnly && (
              <Button variant="secondary" onClick={handleEdit}>
                <EditIcon className="h-4 w-4" /> Modifica
              </Button>
            )
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>Annulla</Button>
              <Button onClick={handleSave}>
                <SaveIcon className="h-4 w-4" /> Salva compagno
              </Button>
            </>
          )
        }
      >
        <div hidden={activeTab !== 'overview'} className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
            <button
              type="button"
              disabled={!canOpenPortrait}
              onClick={() => (readOnly ? setIsImageModalOpen(true) : setIsUploaderOpen(true))}
              aria-label={readOnly ? 'Ingrandisci ritratto' : data.imageUrl ? 'Cambia ritratto' : 'Carica ritratto'}
              className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border-strong/60 bg-input transition-colors duration-150 enabled:hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {data.imageUrl ? (
                <img src={data.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <PhotoIcon className="mx-auto h-10 w-10 text-muted-foreground" />
              )}
              {!readOnly && (
                <span className="absolute inset-x-0 bottom-0 bg-background/85 py-1 text-center text-xs font-semibold text-foreground transition-colors duration-150 group-hover:text-accent">
                  {data.imageUrl ? 'Cambia' : 'Carica'}
                </span>
              )}
            </button>
            <div className="w-full min-w-0 flex-1 space-y-3">
              {readOnly ? (
                <p className="text-center text-sm text-muted-foreground sm:pt-2 sm:text-left">{data.type || 'Tipo non indicato'}</p>
              ) : (
                <>
                  <StyledInput label="Nome" name="name" value={data.name} onChange={handleChange} />
                  <StyledInput label="Tipo" name="type" value={data.type} onChange={handleChange} placeholder="Es. famiglio, bestia" />
                </>
              )}
            </div>
          </div>

          <CompanionHpManager hp={data.hp} onHpChange={handleHpManagerChange} />

          {readOnly ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ReadStat label="Classe Armatura" value={data.armorClass} />
              <ReadStat label="Iniziativa" value={formatModifier(dexModifier)} />
              <ReadStat label="Velocità" value={data.speed} />
              <ReadStat label="PV massimi" value={data.hp.max} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StyledInput label="Classe Armatura" name="armorClass" type="number" value={data.armorClass} onChange={handleChange} />
              <StyledInput label="Velocità" name="speed" value={data.speed} onChange={handleChange} />
              <StyledInput label="PV massimi" name="hpMax" type="number" value={data.hp.max} onChange={(e) => handleHpFieldChange('max', parseInt(e.target.value) || 0)} />
              <ReadStat label="Iniziativa" value={formatModifier(dexModifier)} />
            </div>
          )}

          <div>
            <h4 className={sectionTitleClass}>Caratteristiche</h4>
            <div className={`grid gap-3 ${readOnly ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {abilityKeys.map(key => readOnly ? (
                <AbilityDisplay key={key} ability={key} value={data.abilityScores[key]} />
              ) : (
                <StatInput
                  key={key}
                  label={ABILITY_LABELS[key] ?? key}
                  value={data.abilityScores[key]}
                  onChange={(newValue) => handleAbilityScoreChange(key, Number(newValue))}
                  showModifier
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className={sectionTitleClass}>Abilità</h4>
            <CompanionSkillSelector companion={data} onChange={handleSkillChange} readOnly={readOnly} />
          </div>
        </div>

        <div hidden={activeTab !== 'combat'} className="space-y-6">
          <CompanionAttackEditor companion={data} setCompanion={setData} readOnly={readOnly} />
          <CompanionSpellEditor companion={data} setCompanion={setData} readOnly={readOnly} />
        </div>

        <div hidden={activeTab !== 'notes'} className="space-y-6">
          <CompanionFeatureEditor companion={data} setCompanion={setData} readOnly={readOnly} />
          {readOnly ? (
            <div>
              <h4 className={sectionTitleClass}>Note</h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{data.notes || <span className="text-muted-foreground">Nessuna nota.</span>}</p>
            </div>
          ) : (
            <StyledTextArea
              label="Note"
              name="notes"
              value={data.notes}
              onChange={handleChange}
              rows={10}
              placeholder="Storia, resistenze, immunità, dettagli…"
            />
          )}
        </div>
      </Modal>
      <ImageUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onImageReady={handleImageUpload}
      />
      {isImageModalOpen && data.imageUrl && (
        <ImageModal
          imageUrl={data.imageUrl}
          altText={`Ritratto di ${data.name}`}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </>
  );
};
