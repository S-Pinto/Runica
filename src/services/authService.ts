import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { getFirebase } from '../lib/getFirebase';
import { toast } from '../components/ui/Dialogs';
import { describeAuthError } from '../lib/errors';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<void> => {
    let auth;
    try {
        ({ auth } = getFirebase());
    } catch {
        toast.error('Accesso cloud non disponibile: Firebase non è configurato.');
        return;
    }
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        const message = describeAuthError(error);
        if (message) toast.error(message);
        else console.info('Accesso annullato dall\'utente.');
    }
};

export const signOutUser = async (): Promise<void> => {
    let auth;
    try {
        ({ auth } = getFirebase());
    } catch {
        return;
    }
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout failed', error);
        toast.error('Disconnessione non riuscita. Riprova.');
    }
};

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
    try {
        const { auth } = getFirebase();
        return onAuthStateChanged(auth, callback, (error) => {
            // Errore del listener: tratta l'utente come non loggato invece di bloccare l'app.
            console.error('Auth state listener error', error);
            callback(null);
        });
    } catch (error) {
        // If firebase is not configured, report that there is no user logged in.
        callback(null);
        // Return a no-op unsubscribe function
        return () => {};
    }
};

export const getCurrentUser = (): User | null => {
    try {
        const { auth } = getFirebase();
        return auth.currentUser;
    } catch (error) {
        return null;
    }
};
