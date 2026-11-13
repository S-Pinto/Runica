import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsIcon, DownloadIcon, ShareIosIcon, LogoutIcon, UserCircleIcon, RuneMarkIcon, CloudOffIcon } from '../ui/icons';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { alertDialog } from '../ui/Dialogs';
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

/** Ritratto dell'utente; senza foto mostra l'iniziale (nessuna richiesta esterna). */
const UserAvatar = ({ photoURL, name }: { photoURL: string | null; name: string }) =>
  photoURL ? (
    <img src={photoURL} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold uppercase text-accent">
      {name.trim().charAt(0) || '?'}
    </span>
  );

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onSettingsClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { canInstall, isIos, isStandalone, promptInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const showIosInstallHelp = () =>
    alertDialog('Installa Runica', 'In Safari tocca l\'icona Condividi, poi «Aggiungi alla schermata Home».');

  const userName = currentUser?.displayName || currentUser?.email || 'Utente';
  // Offline l'installazione non serve: lo spazio va all'avviso.
  const showInstall = isOnline && canInstall;
  const showIosInstall = isOnline && isIos && !canInstall && !isStandalone;

  return (
    <header className="sticky top-0 z-header border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Marchio: unico uso di Norse nell'app */}
        <Link
          to="/"
          aria-label="Runica, torna ai tuoi eroi"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-offset-4"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-colors duration-150 group-hover:border-accent/70 group-hover:bg-accent/15">
            <RuneMarkIcon className="h-5 w-5" />
          </span>
          <span aria-hidden className="hidden items-baseline font-norse font-bold leading-none tracking-wider text-accent min-[340px]:flex">
            <span className="text-4xl sm:text-5xl">R</span>
            <span className="text-2xl sm:text-3xl">UNICA</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Offline è una modalità prevista: un avviso calmo, non un allarme. Online non mostra nulla. */}
          {!isOnline && (
            <span
              role="status"
              title="I dati restano su questo dispositivo"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 text-xs font-semibold text-warning"
            >
              <CloudOffIcon className="h-4 w-4" />
              {/* Sotto i 375px resta solo l'icona: lo spazio va al marchio e ai controlli. */}
              <span className="max-[374px]:sr-only">Offline</span>
              <span className="sr-only">: i dati restano su questo dispositivo</span>
            </span>
          )}

          {showInstall && (
            <Button variant="secondary" onClick={promptInstall} aria-label="Installa Runica sul dispositivo" className="px-3">
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Installa</span>
            </Button>
          )}
          {showIosInstall && (
            <Button variant="secondary" onClick={showIosInstallHelp} aria-label="Come installare Runica" className="px-3">
              <ShareIosIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Installa</span>
            </Button>
          )}

          {currentUser ? (
            <Menu
              label={`Menu utente: ${userName}`}
              triggerClassName="flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 hover:bg-muted/60"
              trigger={<UserAvatar photoURL={currentUser.photoURL} name={userName} />}
              header={
                <>
                  <p className="text-xs text-muted-foreground">Connesso come</p>
                  <p className="mt-0.5 max-w-56 truncate text-sm font-semibold text-foreground">{userName}</p>
                </>
              }
              items={[
                { label: 'Account', icon: <UserCircleIcon />, onSelect: () => navigate('/account') },
                { label: 'Disconnetti', icon: <LogoutIcon />, onSelect: handleLogout },
              ]}
            />
          ) : (
            // Secondario: l'accento pieno resta all'azione principale della pagina.
            <Button variant="secondary" onClick={() => navigate('/login')} className="px-3.5">
              Accedi
            </Button>
          )}

          <Button variant="ghost" size="icon-lg" onClick={onSettingsClick} aria-label="Apri impostazioni">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
