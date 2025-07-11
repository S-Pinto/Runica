import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../firebaseConfig'; // Import the potentially undefined storage instance

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
 * Handles uploading a character image.
 * If online, it uploads to Firebase Storage and returns the download URL.
 * If offline, it converts the image to a Base64 string for local storage.
 * @param file The image file to upload.
 * @param characterId The ID of the character.
 * @returns A promise that resolves to either a Firebase URL or a Base64 data URL.
 */
export const uploadCharacterImage = async (file: File, characterId: string): Promise<string> => {
    if (!file) {
        throw new Error("No file provided for upload.");
    }

    // If Firebase Storage is available (online mode)
    if (storage) {
        const storageRef = ref(storage, `character-images/${characterId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } 
    // Otherwise (offline mode), store as Base64
    else {
        console.log("Offline mode: Storing image as Base64 data URL.");
        return fileToBase64(file);
    }
};