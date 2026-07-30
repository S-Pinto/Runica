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

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onSettingsClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { canInstall, isIos, isStandalone, promptInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();
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
    <header className="sticky top-0 z-50 flex justify-between items-center h-20 px-4 sm:px-8 bg-card/60 backdrop-blur-xl border-b border-accent/20 shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all duration-300">
      {/* Brand Title */}
      <div 
        onClick={() => navigate('/')} 
        className="group cursor-pointer flex items-center gap-3 transition-transform duration-300 hover:scale-105"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)] group-hover:border-accent group-hover:shadow-[0_0_25px_rgba(var(--color-accent),0.5)] transition-all">
          <span className="font-norse text-2xl font-bold">ᚱ</span>
        </div>
        <h1 
          className="font-norse font-bold text-accent tracking-wider flex items-baseline"
          style={{ textShadow: '0 0 12px rgb(var(--color-accent) / 0.6)' }}
        >
          <span className="text-5xl">R</span>
          <span className="text-3xl">UNICA</span>
        </h1>
      </div>

      {/* Controls Header Right */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Online / Offline Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all shadow-sm ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
          }`}
          title={isOnline ? 'Connesso (Online)' : 'Modalità Offline attiva'}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
          <span className="hidden sm:inline font-mono uppercase text-[11px]">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {canInstall && (
          <button
            onClick={promptInstall}
            className="px-3.5 py-2 flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-accent bg-accent/10 rounded-xl border border-accent/30 hover:bg-accent/20 hover:border-accent/70 transition-all duration-300 shadow-sm hover:shadow-md"
            title="Installa Runica sul tuo dispositivo"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Installa App</span>
          </button>
        )}
        {isIos && !canInstall && !isStandalone && (
           <div
             className="px-3.5 py-2 flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-accent bg-accent/10 rounded-xl border border-accent/30 cursor-help"
             title="Per installare: tocca l'icona Condividi e poi 'Aggiungi a Home'"
           >
             <ShareIosIcon className="w-4 h-4" />
             <span className="hidden sm:inline">Installa App</span>
           </div>
        )}

        {currentUser ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-full border border-accent/30 bg-background/50 hover:border-accent hover:shadow-[0_0_15px_rgba(var(--color-accent),0.3)] transition-all duration-300 group"
            >
              <img 
                src={currentUser.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${currentUser.uid}`} 
                alt={currentUser.displayName || 'User Avatar'}
                className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform"
              />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl bg-card/95 backdrop-blur-xl border border-accent/20 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2" role="menu">
                <div className="px-4 py-3 border-b border-border/40 mb-1">
                  <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                    Connesso come
                  </p>
                  <p className="text-sm font-bold text-accent truncate mt-0.5">
                    {currentUser.displayName || currentUser.email}
                  </p>
                </div>
                <button
                  onClick={handleAccountClick}
                  className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/15 hover:text-accent transition-all"
                  role="menuitem"
                >
                  <UserCircleIcon className="w-4 h-4 text-accent" />
                  Impostazioni Account
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/15 transition-all mt-1"
                  role="menuitem"
                >
                  <LogoutIcon className="w-4 h-4" />
                  Disconnetti
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')} 
            className="px-5 py-2 font-bold text-xs uppercase tracking-wider text-accent-foreground bg-accent hover:bg-accent/90 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Accedi
          </button>
        )}

        {/* Pulsante Impostazioni con stile coerente */}
        <button 
          onClick={onSettingsClick} 
          className="w-11 h-11 flex items-center justify-center rounded-xl text-accent bg-accent/10 border border-accent/30 hover:bg-accent/20 hover:border-accent/70 transition-all duration-300 shadow-sm" 
          aria-label="Open settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};