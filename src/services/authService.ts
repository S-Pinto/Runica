import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { getFirebase } from '../lib/getFirebase';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = (): Promise<void> => {
    try {
        const { auth } = getFirebase();
        return signInWithPopup(auth, provider).then(() => {});
    } catch (error) {
        alert("Firebase is not configured. Cloud sign-in is disabled. Please update firebaseConfig.ts.");
        return Promise.resolve();
    }
};

export const signOutUser = (): Promise<void> => {
        try {
        const { auth } = getFirebase();
        return signOut(auth);
    } catch (error) {
        return Promise.resolve();
    }
};

export const onAuthSateChangedListener = (callback: (user: User | null) => void) => {
    try {
        const { auth } = getFirebase();
        return onAuthStateChanged(auth, callback);
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
