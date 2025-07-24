import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsIcon, DownloadIcon, ShareIosIcon, LogoutIcon, UserCircleIcon } from '../ui/icons';
import { useAuth } from '../../providers/AuthProvider';

// Custom hook to manage PWA installation state
const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check for iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      if (!standalone) {
        setInstallPrompt(e);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const promptInstall = async () => {
    if (!installPrompt) return;
    const promptEvent = installPrompt as any;
    await promptEvent.prompt();
    setInstallPrompt(null); // The prompt can only be used once
  };

  return { canInstall: !!installPrompt && !isStandalone, isIos, isStandalone, promptInstall };
};

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onSettingsClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { canInstall, isIos, isStandalone, promptInstall } = usePWAInstall();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  const handleAccountClick = () => {
    setIsUserMenuOpen(false);
    navigate('/account');
  };

  return (
    // Header con un design più pulito, sfondo semi-trasparente e un'ombra più definita.
    <header className="sticky top-0 z-50 flex justify-between items-center h-20 px-6 bg-background/80 backdrop-blur-lg border-b border-white/10 [box-shadow:0_1px_10px_rgb(var(--color-accent)/0.3)] transition-all duration-300">
      {/* Titolo con effetto hover per renderlo più interattivo */}
      <h1 
        onClick={() => navigate('/')} 
        className="font-norse font-bold text-accent cursor-pointer flex items-baseline transition-all duration-300 hover:opacity-80"
        style={{ textShadow: '0 0 8px rgb(var(--color-accent) / 0.7)' }}
      >
        <span className="text-6xl">R</span>
        <span className="text-4xl">unica</span>
      </h1>

      {/* Controlli a destra, raggruppati e con stili coerenti */}
      <div className="flex items-center gap-4">
        {canInstall && (
          <button
            onClick={promptInstall}
            className="px-3 py-2 flex items-center gap-2 font-semibold text-accent bg-accent/10 rounded-lg border border-accent/30 hover:bg-accent/20 hover:border-accent/70 transition-all duration-300"
            title="Installa Runica sul tuo dispositivo"
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Installa App</span>
          </button>
        )}
        {isIos && !canInstall && !isStandalone && (
           <div
             className="px-3 py-2 flex items-center gap-2 font-semibold text-accent bg-accent/10 rounded-lg border border-accent/30 cursor-help"
             title="Per installare: tocca l'icona Condividi e poi 'Aggiungi a Home'"
           >
             <ShareIosIcon className="w-5 h-5" />
             <span className="hidden sm:inline">Installa App</span>
           </div>
        )}

        {currentUser ? (
          <div className="relative" ref={userMenuRef}>
            <img 
              src={currentUser.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${currentUser.uid}`} 
              alt={currentUser.displayName || 'User Avatar'}
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="w-12 h-12 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-accent transition-all duration-300 hover:scale-105"
              title="Account"
            />
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-zinc-800 shadow-lg ring-1 ring-white/10 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                <div className="py-1" role="none">
                  <div className="px-4 py-3 border-b border-zinc-700">
                    <p className="text-sm text-zinc-300" role="none">
                      Signed in as
                    </p>
                    <p className="text-sm font-medium text-accent truncate" role="none">
                      {currentUser.displayName || currentUser.email}
                    </p>
                  </div>
                  <button
                    onClick={handleAccountClick}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
                    role="menuitem"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    Account Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                    role="menuitem"
                  >
                    <LogoutIcon className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Pulsante di Login con uno stile più moderno
          <button onClick={() => navigate('/login')} className="px-5 py-2 font-semibold text-accent bg-accent/10 rounded-lg border border-accent/30 hover:bg-accent/20 hover:border-accent/70 transition-all duration-300">Login</button>
        )}
        {/* Pulsante Impostazioni con stile coerente */}
        <button onClick={onSettingsClick} className="w-12 h-12 flex items-center justify-center rounded-lg text-accent bg-accent/10 border border-accent/30 hover:bg-accent/20 hover:border-accent/70 transition-all duration-300" aria-label="Open settings">
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};