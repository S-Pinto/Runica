import React, { useEffect, useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { XMarkIcon, CheckIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from './ui/icons';
import * as characterService from '../features/character/characterService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-t border-zinc-700 pt-4 mt-4 first:border-t-0 first:mt-0 first:pt-0">
    <h4 className="text-md font-semibold text-zinc-400 mb-3">{title}</h4>
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) dialog.showModal();
      else dialog.close();
    }
  }, [isOpen]);

  const handleExportData = async () => {
    try {
      const allCharacters = await characterService.getAllCharacters();
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
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Error exporting data. Check the console for details.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Are you sure you want to import data? This will overwrite all current characters.')) {
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

        await characterService.importCharacters(data.characters);
        if (data.settings?.theme) {
          setTheme(data.settings.theme);
        }
        alert('Data imported successfully! The page will now reload.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('Error importing data. Make sure it is a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (window.confirm('DANGER! This will permanently delete ALL your characters. This action cannot be undone. Are you absolutely sure?')) {
      try {
        await characterService.clearAllData();
        alert('All data has been cleared. The app will now reload.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('An error occurred while clearing data.');
      }
    }
  };

  return (
    <dialog ref={dialogRef} onClose={onClose} className="bg-zinc-800 text-zinc-200 p-0 rounded-lg shadow-2xl w-full max-w-sm border border-zinc-700 backdrop:bg-black/50">
      <header className="flex items-center justify-between p-4 border-b border-zinc-700">
        <h3 className="text-lg font-cinzel text-accent">Settings</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
      </header>
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <SettingsSection title="Appearance">
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id as any)} className={`flex items-center justify-between p-3 rounded-md border-2 transition-colors ${theme === t.id ? 'border-accent' : 'border-zinc-600 hover:border-zinc-500'}`}>
                <span className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full ${t.color}`}></span> {t.name}
                </span>
                {theme === t.id && <CheckIcon className="w-5 h-5 text-accent" />}
              </button>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Data Management">
          <div className="space-y-3">
            <button onClick={handleExportData} className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold py-2 px-4 rounded-md transition-colors">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export All Data
            </button>
            <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-semibold py-2 px-4 rounded-md transition-colors">
              <ArrowUpTrayIcon className="w-5 h-5" />
              Import from Backup
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
          </div>
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <button onClick={handleClearAllData} className="w-full flex items-center justify-center gap-2 bg-destructive/20 hover:bg-destructive/40 text-destructive font-semibold py-2 px-4 rounded-md transition-colors border border-destructive/50">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Clear All Data
          </button>
        </SettingsSection>
      </div>
    </dialog>
  );
};