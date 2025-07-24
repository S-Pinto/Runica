import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { GoogleIcon } from '../../components/ui/icons';

export const LoginPage: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/'); // Redirect to character list after sign-in
    } catch (error) {
      console.error("Error during sign-in:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 text-center">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full border border-border">
        <h1 className="text-3xl font-cinzel text-accent mb-4">
          Join the Adventure
        </h1>
        <p className="text-muted-foreground mb-8">
          Sign in with Google to sync your characters across devices.
        </p>
        <button onClick={handleSignIn} className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white text-zinc-700 font-bold rounded-lg shadow-md hover:bg-zinc-200 transition-colors">
          <GoogleIcon className="w-6 h-6" />
          Sign In with Google
        </button>
      </div>
    </div>
  );
};