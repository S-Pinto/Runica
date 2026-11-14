import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { GoogleIcon } from '../../components/ui/icons';
import { sanitizeNextPath } from '../character/rules/campaign';

export const LoginPage: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // `?next=/campaigns/join?code=…`: dopo l'accesso si torna dove si era (solo percorsi interni).
  const next = sanitizeNextPath(searchParams.get('next')) ?? '/';

  useEffect(() => {
    // Già loggato: vai alla destinazione.
    if (currentUser) {
      navigate(next, { replace: true });
    }
  }, [currentUser, navigate, next]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate(next, { replace: true });
    } catch (error) {
      console.error("Error during sign-in:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 text-center">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full border border-border">
        <h1 className="text-3xl font-cinzel text-accent mb-4">
          Unisciti all'avventura
        </h1>
        <p className="text-muted-foreground mb-8">
          Accedi con Google per sincronizzare i personaggi tra i tuoi dispositivi.
        </p>
        <button onClick={handleSignIn} className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-foreground text-background font-bold rounded-lg shadow-md hover:bg-foreground/90 transition-colors">
          <GoogleIcon className="w-6 h-6" />
          Accedi con Google
        </button>
      </div>
    </div>
  );
};
