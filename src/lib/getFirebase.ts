import { auth, db, storage, app } from './firebaseConfig';

/**
 * Safely accesses and returns the initialized Firebase services.
 * Throws a detailed error if Firebase is not initialized.
 * This function can be used by both hooks and regular service files.
 *
 * @returns An object containing the initialized Firebase services.
 */
export const getFirebase = () => {
  if (!app || !auth || !db || !storage) {
    throw new Error(
      "Firebase is not initialized. Make sure your environment variables are set."
    );
  }

  return { app, auth, db, storage };
};