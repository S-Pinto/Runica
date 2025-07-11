import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { auth } from "../firebaseConfig";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = (): Promise<void> => {
    if (!auth) {
        alert("Firebase is not configured. Cloud sign-in is disabled. Please update firebaseConfig.ts.");
        return Promise.resolve();
    }
    return signInWithPopup(auth, provider).then(() => {});
};

export const signOutUser = (): Promise<void> => {
    if (!auth) return Promise.resolve();
    return signOut(auth);
};

export const onAuthSateChangedListener = (callback: (user: User | null) => void) => {
    if (!auth) {
        // If firebase is not configured, report that there is no user logged in.
        callback(null);
        // Return a no-op unsubscribe function
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
    if (!auth) return null;
    return auth.currentUser;
};
