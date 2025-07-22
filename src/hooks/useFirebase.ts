import { auth, db, storage, app } from '../lib/firebaseConfig';

/**
 * Custom hook to safely access Firebase services.
 * Throws an error if Firebase is not initialized, ensuring that components
 * only access the services when they are available.
 *
 * @returns An object containing the initialized Firebase services.
 */
export const useFirebase = () => {
  if (!app || !auth || !db || !storage) {
    throw new Error(
      "Firebase is not initialized. Make sure your environment variables are set."
    );
  }

  return { app, auth, db, storage };
};