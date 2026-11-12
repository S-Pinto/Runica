import { getFunctions, httpsCallable, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getFirebase } from '../lib/getFirebase';

const FUNCTIONS_REGION = 'europe-west1';

let functionsInstance: Functions | null = null;

/**
 * Istanza condivisa di Functions nella regione corretta.
 * L'emulatore viene collegato una sola volta e solo con VITE_USE_EMULATORS=true.
 */
const getFunctionsInstance = (): Functions => {
    if (!functionsInstance) {
        const { app } = getFirebase();
        functionsInstance = getFunctions(app, FUNCTIONS_REGION);
        if (import.meta.env.VITE_USE_EMULATORS === 'true') {
            connectFunctionsEmulator(functionsInstance, 'localhost', 5001);
        }
    }
    return functionsInstance;
};

export const generateCharacterPDF = async (character: any): Promise<Blob> => {
    const generatePDF = httpsCallable<{ character: any }, { success: boolean; pdf: string; fileName: string }>(
        getFunctionsInstance(),
        'generateCharacterPDF'
    );

    const result = await generatePDF({ character });

    if (!result.data.success) {
        throw new Error('PDF generation failed');
    }

    // Converti Base64 → Blob
    const byteCharacters = atob(result.data.pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });
};
