import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

export const generateCharacterPDF = async (character: any): Promise<Blob> => {
    const functions = getFunctions();

    // Supporto per i test in locale
    if (window.location.hostname === 'localhost') {
        connectFunctionsEmulator(functions, 'localhost', 5001);
    }

    const generatePDF = httpsCallable<{ character: any }, { success: boolean; pdf: string; fileName: string }>(
        functions,
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
