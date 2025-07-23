import { getFirebase } from '../lib/getFirebase';
import { ref, uploadBytes, getDownloadURL, uploadString, StringFormat } from "firebase/storage";
import imageCompression, { Options } from 'browser-image-compression';

/**
 * Compresses an image file before upload.
 * @param file The image file to compress.
 * @param options The compression options from browser-image-compression.
 * @returns A promise that resolves with the compressed file.
 */
export async function compressImage(file: File, options: Options): Promise<File> {
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
    const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
    });
    const storageRef = ref(storage, `users/${userId}/character-portraits/${characterId}`);
    await uploadBytes(storageRef, compressedFile);
    return getDownloadURL(storageRef);
};

/**
 * Uploads a character image Blob (e.g., from a canvas or cropper) to Firebase Storage.
 * @param imageBlob The image Blob to upload.
 * @param userId The ID of the user who owns the character.
 * @param characterId The ID of the character this image belongs to.
 */
export const uploadImageBlob = async (imageBlob: Blob, userId: string, characterId: string): Promise<string> => {
    const { storage } = getFirebase();
    const imageRef = ref(storage, `users/${userId}/character-portraits/${characterId}`);
    await uploadBytes(imageRef, imageBlob);
    return await getDownloadURL(imageRef);
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

/**
 * Uploads a user's profile image to Firebase Storage.
 * Handles compression before upload.
 * @param file The image file to upload.
 * @param userId The ID of the user.
 * @returns A promise that resolves with the public download URL of the image.
 */
export const uploadUserProfileImage = async (file: File, userId: string): Promise<string> => {
    const { storage } = getFirebase();
    const compressedFile = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
    });
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);
    await uploadBytes(storageRef, compressedFile);
    return getDownloadURL(storageRef);
};
