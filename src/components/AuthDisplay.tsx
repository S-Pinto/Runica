import React, { useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useFirebase } from '../hooks/useFirebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export const AuthDisplay = () => {
    const { currentUser } = useAuth();

    // Ottiene i servizi Firebase in modo sicuro. Se le variabili d'ambiente
    // non sono impostate, l'hook lancerà un errore che viene catturato qui.
    const firebaseServices = useMemo(() => {
        try {
            return useFirebase();
        } catch (error) {
            console.warn("Firebase non disponibile, le funzionalità di autenticazione sono disabilitate.", error);
            return null;
        }
    }, []);

    const handleSignIn = async () => {
        if (!firebaseServices) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(firebaseServices.auth, provider);
        } catch (error) {
            console.error("Errore durante il sign-in:", error);
        }
    };

    const handleSignOut = async () => {
        if (!firebaseServices) return;
        try {
            await signOut(firebaseServices.auth);
        } catch (error) {
            console.error("Errore durante il sign-out:", error);
        }
    };

    if (currentUser) {
        return (
            <div className="flex items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <img src={currentUser.photoURL || ''} alt="User" className="w-9 h-9 rounded-full" />
                    <span className="text-zinc-300 hidden sm:inline">{currentUser.displayName || currentUser.email}</span>
                </div>
                <button 
                    onClick={handleSignOut}
                    className="flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded-md text-white transition-colors h-9 w-9 sm:w-auto sm:px-4 disabled:bg-zinc-600 disabled:cursor-not-allowed"
                    title="Sign Out"
                    disabled={!firebaseServices}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span className="hidden sm:inline sm:ml-2">Sign Out</span>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            className="flex items-center justify-center bg-amber-600 hover:bg-amber-500 rounded-md text-white font-bold transition-colors h-9 w-9 sm:w-auto sm:px-4 sm:gap-2 disabled:bg-zinc-600 disabled:cursor-not-allowed"
            title="Sign in"
            disabled={!firebaseServices}
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z"/><path d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z"/><path d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z"/><path d="M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z"/></svg>
            <span className="hidden sm:inline">Sign in</span>
        </button>
    );
};