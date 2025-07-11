import { auth } from '../firebaseConfig'; // storage is no longer needed
import imageCompression from 'browser-image-compression';

/**
 * Converts a File object to a Base64 encoded string.
 * This is used to store images locally when the user is offline.
 * @param file The file to convert.
 * @returns A promise that resolves with the Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

/**
 * Handles character image processing by compressing it and converting it to a Base64 string.
 * This allows for larger original images while keeping the stored size in Firestore manageable.
 * @param file The image file to upload.
 * @param characterId The ID of the character.
 * @returns A promise that resolves to a Base64 data URL.
 */
export const uploadCharacterImage = async (file: File, characterId: string): Promise<string> => {
    if (!file) {
        throw new Error("No file provided for upload.");
    }
    
    const options = {
      maxSizeMB: 0.75,                // Target size: 750KB
      maxWidthOrHeight: 1024,         // Optional: Resizes the image for better performance and smaller size
      useWebWorker: true,             // Optional: Uses a web worker to avoid blocking the main thread
    };
    
    try {
        console.log(`Original image size: ${(file.size / 1024).toFixed(2)} KB`);
        // Compress the image using the defined options
        const compressedFile = await imageCompression(file, options);
        console.log(`Compressed image size: ${(compressedFile.size / 1024).toFixed(2)} KB`);
        // Convert the newly compressed file to Base64 for storage
        return fileToBase64(compressedFile);
    } catch (error) {
        console.error('Error during image compression:', error);
        // Re-throw a user-friendly error
        throw new Error('Failed to process the image. Please try again or select a different one.');
    }
};