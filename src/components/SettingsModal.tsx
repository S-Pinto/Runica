import React, { useEffect, useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { XMarkIcon, CheckIcon } from './ui/icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) dialog.showModal();
      else dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} onClose={onClose} className="bg-zinc-800 text-zinc-200 p-0 rounded-lg shadow-2xl w-full max-w-sm border border-zinc-700 backdrop:bg-black/50">
      <header className="flex items-center justify-between p-4 border-b border-zinc-700">
        <h3 className="text-lg font-cinzel text-accent">Settings</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
      </header>
      <div className="p-6">
        <h4 className="text-md font-semibold text-text-main mb-3">Theme</h4>
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
      </div>
    </dialog>
  );
};