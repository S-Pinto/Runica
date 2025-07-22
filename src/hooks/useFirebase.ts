import { getFirebase } from '../lib/getFirebase';

/**
 * Custom hook to safely access Firebase services from within React components.
 * It's a thin wrapper around getFirebase() to follow the rules of hooks.
 *
 * @returns An object containing the initialized Firebase services.
 */
export const useFirebase = () => {
  // The getter function handles the error throwing.
  return getFirebase();
};