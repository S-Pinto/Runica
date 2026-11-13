import React, { useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { THEMES } from '../lib/themes';
import { CheckIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from './ui/icons';
import * as characterRepository from '../features/character/characterRepository';
import { alertDialog, confirmDialog, toast } from './ui/Dialogs';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DiceMode = 'dock' | 'modal';

const DICE_MODES: { id: DiceMode; name: string; hint: string }[] = [
  { id: 'dock', name: 'Barra fissa', hint: 'Sempre in basso' },
  { id: 'modal', name: 'Finestra', hint: 'Su richiesta' },
];

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-7 first:mt-0">
    <h3 className="mb-3 text-label uppercase text-muted-foreground">{title}</h3>
    {children}
  </section>
);

/** Opzione di un gruppo a scelta singola (tema, dadiera). */
const ChoiceOption: React.FC<{
  selected: boolean;
  onSelect: () => void;
  name: string;
  hint: string;
  leading?: React.ReactNode;
}> = ({ selected, onSelect, name, hint, leading }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-150 ${
      selected ? 'border-accent bg-accent/10' : 'border-border hover:border-border-strong hover:bg-muted/40'
    }`}
  >
    {leading}
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
      <span className="block truncate text-xs text-muted-foreground">{hint}</span>
    </span>
    {selected && <CheckIcon className="h-4 w-4 shrink-0 text-accent" />}
  </button>
);

/** Anteprima reale del tema: la classe `theme-*` risolve i suoi stessi token. */
const ThemeSwatch = ({ themeId }: { themeId: string }) => (
  <span aria-hidden className={`${themeId} flex h-9 w-9 shrink-0 items-end overflow-hidden rounded-lg border border-border-strong bg-background`}>
    <span className="flex h-4 w-full items-center justify-end bg-card pr-1.5">
      <span className="h-2 w-2 rounded-full bg-accent" />
    </span>
  </span>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diceMode, setDiceMode] = React.useState<DiceMode>(
    () => (localStorage.getItem('runica_dice_mode') as DiceMode) || 'dock'
  );

  const selectDiceMode = (mode: DiceMode) => {
    setDiceMode(mode);
    localStorage.setItem('runica_dice_mode', mode);
    window.dispatchEvent(new Event('storage'));
  };

  const handleExportData = async () => {
    try {
      const allCharacters = await characterRepository.getAllCharacters();
      const dataToExport = {
        version: 1,
        exportedAt: new Date().toISOString(),
        characters: allCharacters,
        settings: { theme },
      };
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `runica-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Backup esportato.');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Esportazione non riuscita.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(await confirmDialog({ title: 'Importare il backup?', message: 'Tutti i personaggi attuali verranno sovrascritti.', confirmLabel: 'Importa', destructive: true }))) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Invalid file content');
        const data = JSON.parse(text);

        // Basic validation
        if (!data.characters || !Array.isArray(data.characters)) {
          throw new Error('Invalid backup file format.');
        }

        await characterRepository.importCharacters(data.characters);
        if (data.settings?.theme) {
          setTheme(data.settings.theme);
        }
        await alertDialog('Backup importato', 'La pagina verrà ricaricata.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to import data:', error);
        toast.error('Importazione non riuscita: il file non è un backup valido.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (await confirmDialog({ title: 'Eliminare tutti i dati?', message: 'Tutti i tuoi personaggi verranno eliminati definitivamente. L\'azione non può essere annullata.', confirmLabel: 'Elimina tutto', destructive: true })) {
      try {
        await characterRepository.clearAllData();
        await alertDialog('Dati eliminati', 'L\'app verrà ricaricata.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        toast.error('Errore durante l\'eliminazione dei dati.');
      }
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Impostazioni">
      <SettingsSection title="Tema">
        <div role="radiogroup" aria-label="Tema" className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {THEMES.map((t) => (
            <ChoiceOption
              key={t.id}
              selected={theme === t.id}
              onSelect={() => setTheme(t.id)}
              name={t.name}
              hint={t.hint}
              leading={<ThemeSwatch themeId={t.id} />}
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Dadiera">
        <div role="radiogroup" aria-label="Dadiera" className="grid grid-cols-2 gap-2">
          {DICE_MODES.map((mode) => (
            <ChoiceOption
              key={mode.id}
              selected={diceMode === mode.id}
              onSelect={() => selectDiceMode(mode.id)}
              name={mode.name}
              hint={mode.hint}
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Dati">
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          <Button variant="secondary" onClick={handleExportData}>
            <ArrowDownTrayIcon className="h-4 w-4" />
            Esporta backup
          </Button>
          <Button variant="secondary" onClick={handleImportClick}>
            <ArrowUpTrayIcon className="h-4 w-4" />
            Importa backup
          </Button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
      </SettingsSection>

      <SettingsSection title="Zona pericolosa">
        <Button variant="destructive-outline" onClick={handleClearAllData} className="w-full">
          <ExclamationTriangleIcon className="h-4 w-4" />
          Elimina tutti i dati
        </Button>
      </SettingsSection>
    </Modal>
  );
};
