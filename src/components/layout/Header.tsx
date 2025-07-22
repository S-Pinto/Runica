import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthDisplay } from '../AuthDisplay';
import { DownloadIcon, ShareIosIcon } from '../ui/icons';

// Definiamo un tipo più specifico per l'evento BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const Header = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Rileva se l'utente è su iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Controlla anche se l'app non è già installata (in modalità standalone)
    const isStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
    setIsIos(iosCheck && !isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    // Il prompt può essere usato una sola volta.
    setInstallPromptEvent(null);
  };

  return (
    <header className="group bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-zinc-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center h-12 group-hover:h-16 transition-all duration-300 ease-in-out">
          <Link to="/" className="text-5xl font-bold text-amber-400 font-norse tracking-wider [text-shadow:0_0_8px_theme(colors.amber.300)]">
            RUNICA
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Pulsante di installazione per browser che lo supportano (Chrome, Edge) */}
            {installPromptEvent && !isIos && (
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center text-sm bg-amber-600 hover:bg-amber-500 h-9 w-9 sm:w-auto sm:px-3 sm:py-2 sm:gap-2 rounded-md text-white transition"
                title="Installa Runica sul tuo dispositivo"
              >
                <DownloadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Installa App</span>
              </button>
            )}
            {/* Pulsante di aiuto per iOS */}
            {isIos && !installPromptEvent && (
              <div className="flex items-center justify-center text-sm bg-sky-600 h-9 w-9 sm:w-auto sm:px-3 sm:py-2 sm:gap-2 rounded-md text-white" title="Per installare: tocca l'icona Condividi e poi 'Aggiungi a Home'">
                <ShareIosIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Installa App</span>
              </div>
            )}
            <AuthDisplay />
          </div>
        </div>
      </div>
    </header>
  );
};