import { getFirebase } from '../lib/getFirebase';
import { ref, uploadBytes, getDownloadURL, uploadString, StringFormat } from "firebase/storage";
import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file before upload.
 * @param file The image file to compress.
 * @returns A promise that resolves with the compressed file.
 */
export async function compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Return original file if compression fails
    }
}

/**
 * Uploads a character image file to Firebase Storage.
 * This function will only be available if Firebase Storage is initialized.
 * @param file The image file to upload.
 * @param userId The ID of the user who owns the character.
 * @param characterId The ID of the character this image belongs to.
 */
export const uploadCharacterImage = async (file: File, userId: string, characterId: string): Promise<string> => {
    const { storage } = getFirebase();
    const compressedFile = await compressImage(file);
    const storageRef = ref(storage, `users/${userId}/character-portraits/${characterId}`);
    await uploadBytes(storageRef, compressedFile);
    return getDownloadURL(storageRef);
};

/**
 * Uploads a character image from a data URL (base64) to Firebase Storage.
 * Used for migrating local data to the cloud.
 * @param dataUrl The base64 data URL of the image.
 * @param userId The ID of the user who owns the character.
 * @param characterId The ID of the character this image belongs to.
 */
export const uploadCharacterImageFromDataUrl = async (dataUrl: string, userId: string, characterId: string): Promise<string> => {
    const { storage } = getFirebase();
    const storageRef = ref(storage, `users/${userId}/character-portraits/${characterId}`);
    // Upload the data URL string directly
    await uploadString(storageRef, dataUrl, StringFormat.DATA_URL);
    return getDownloadURL(storageRef);
  };
