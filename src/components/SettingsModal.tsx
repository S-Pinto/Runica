import React, { useEffect, useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { XMarkIcon, CheckIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from './ui/icons';
import * as characterRepository from '../features/character/characterRepository';
import { alertDialog, confirmDialog, toast } from './ui/Dialogs';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-t border-border pt-4 mt-4 first:border-t-0 first:mt-0 first:pt-0">
    <h4 className="text-md font-semibold text-muted-foreground mb-3">{title}</h4>
    {children}
  </div>
);

const THEMES = [
  { id: 'theme-amber', name: 'Ambra', color: 'bg-amber-400' },
  { id: 'theme-sapphire', name: 'Zaffiro', color: 'bg-cyan-400' },
  { id: 'theme-twilight', name: 'Crepuscolo', color: 'bg-violet-400' },
  { id: 'theme-evergreen', name: 'Foresta', color: 'bg-emerald-400' },
  { id: 'theme-crimson', name: 'Cremisi', color: 'bg-red-500' },
  { id: 'theme-rose', name: 'Rosato', color: 'bg-rose-500' },
  { id: 'theme-veridian', name: 'Veridiano', color: 'bg-green-400' },
  { id: 'theme-obsidian', name: 'Ossidiana', color: 'bg-gray-300' },
  { id: 'theme-solaris', name: 'Solaris', color: 'bg-orange-500' },
  { id: 'theme-aether', name: 'Etere', color: 'bg-fuchsia-500' },
  { id: 'theme-grove', name: 'Bosco', color: 'bg-lime-500' },
  { id: 'theme-nocturne', name: 'Notturno', color: 'bg-violet-500' },
  { id: 'theme-celestial', name: 'Celeste', color: 'bg-indigo-600' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diceMode, setDiceMode] = React.useState<'dock' | 'modal'>(
    () => (localStorage.getItem('runica_dice_mode') as 'dock' | 'modal') || 'dock'
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) dialog.showModal();
      else dialog.close();
    }
  }, [isOpen]);

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
    <dialog ref={dialogRef} onClose={onClose} className="bg-card text-text p-0 rounded-lg shadow-2xl w-full max-w-sm border border-border backdrop:bg-black/50">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-cinzel text-accent">Impostazioni</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-input transition-colors"><XMarkIcon className="w-5 h-5" /></button>
      </header>
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <SettingsSection title="Aspetto">
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id as any)} className={`flex items-center justify-between p-3 rounded-md border-2 transition-colors ${theme === t.id ? 'border-accent' : 'border-border hover:border-border'}`}>
                <span className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full ${t.color}`}></span> {t.name}
                </span>
                {theme === t.id && <CheckIcon className="w-5 h-5 text-accent" />}
              </button>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Strumenti di gioco">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-muted-foreground">Dadiera</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDiceMode('dock');
                  localStorage.setItem('runica_dice_mode', 'dock');
                  window.dispatchEvent(new Event('storage'));
                }}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                  diceMode === 'dock'
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-border bg-card text-muted-foreground hover:border-border'
                }`}
              >
                <span>Barra fissa</span>
                <span className="text-[10px] text-muted-foreground font-normal">Sempre in basso</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiceMode('modal');
                  localStorage.setItem('runica_dice_mode', 'modal');
                  window.dispatchEvent(new Event('storage'));
                }}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                  diceMode === 'modal'
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-border bg-card text-muted-foreground hover:border-border'
                }`}
              >
                <span>Finestra</span>
                <span className="text-[10px] text-muted-foreground font-normal">Su richiesta</span>
              </button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Dati">
          <div className="space-y-3">
            <button onClick={handleExportData} className="w-full flex items-center justify-center gap-2 bg-input hover:bg-input text-text font-semibold py-2 px-4 rounded-md transition-colors">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Esporta tutti i dati
            </button>
            <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 bg-input hover:bg-input text-text font-semibold py-2 px-4 rounded-md transition-colors">
              <ArrowUpTrayIcon className="w-5 h-5" />
              Importa da backup
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
          </div>
        </SettingsSection>

        <SettingsSection title="Zona pericolosa">
          <button onClick={handleClearAllData} className="w-full flex items-center justify-center gap-2 bg-destructive/20 hover:bg-destructive/40 text-destructive font-semibold py-2 px-4 rounded-md transition-colors border border-destructive/50">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Elimina tutti i dati
          </button>
        </SettingsSection>
      </div>
    </dialog>
  );
};