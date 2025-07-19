// src/services/geminiService.ts (Versione Sicura con Cloud Function)

// 1. CAMBIAMO GLI IMPORT
// Non importiamo più GoogleGenAI, ma i tool per chiamare le Cloud Functions.
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import { ICharacter } from '../src/features/character/characterTypes';

// 2. NIENTE PIÙ CHIAVE API QUI!
// La riga 'const apiKey = import.meta.env.VITE_GEMINI_API_KEY;' viene eliminata.
// La chiave ora vive solo sul server.

// Interfaccia per definire cosa ci aspettiamo dalla Cloud Function
interface GeminiFunctionResponse {
    success: boolean;
    response: string; // Questa sarà la stringa JSON restituita da Gemini
}

interface PersonalityFields {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
}

const ERROR_RESPONSE: Partial<PersonalityFields> = {
    personalityTraits: "Generazione AI fallita. Impossibile contattare il servizio.",
    ideals: "Errore.",
    bonds: "Errore.",
    flaws: "Errore.",
};

// 3. CREIAMO UN RIFERIMENTO ALLA NOSTRA FUNZIONE
// Questa funzione 'callable' gestisce per noi l'autenticazione e la comunicazione.
const callGemini = httpsCallable<string, GeminiFunctionResponse>(
    getFunctions(), 
    'callGemini' // Il nome esatto della funzione che abbiamo deployato
);

// La firma della funzione rimane IDENTICA, così non devi cambiare il componente CharacterSheet.
export const generatePersonality = async (character: ICharacter, customPrompt?: string): Promise<Partial<PersonalityFields>> => {
  
    // 4. MANTENIAMO LA TUA LOGICA PER CREARE IL PROMPT
    // È scritta molto bene e non c'è motivo di cambiarla.
    const { name, race, 'class': characterClass, background, alignment } = character;
    const prompt = `
     Generate personality aspects for a Dungeons & Dragons character.
     Based on the following details:
     - Name: ${name}
     - Race: ${race}
     - Class: ${characterClass}
     - Background: ${background}
     - Alignment: ${alignment}
     ${customPrompt ? `\n- Additional Theme: "${customPrompt}"` : ''}

     Return a JSON object with four keys: "personalityTraits", "ideals", "bonds", and "flaws".
     - "personalityTraits": A short paragraph describing the character's general demeanor.
     - "ideals": A sentence describing a core belief.
     - "bonds": A sentence about something or someone the character cares deeply about.
     - "flaws": A sentence describing a significant weakness or fear.
   `;

    try {
        // 5. SOSTITUIAMO LA CHIAMATA DIRETTA CON LA CHIAMATA ALLA FUNZIONE
        console.log("Calling Cloud Function 'callGemini'...");
        const result: HttpsCallableResult<GeminiFunctionResponse> = await callGemini(prompt);

        if (!result.data.success || !result.data.response) {
            throw new Error("La Cloud Function ha riportato un errore: " + result.data.response);
        }

        // La tua logica di parsing JSON è perfetta e la riutilizziamo qui.
        // La Cloud Function ci restituisce una stringa JSON, che noi parsifichiamo.
        const jsonStr = result.data.response.trim();
        const parsedData = JSON.parse(jsonStr);

        return {
            personalityTraits: parsedData.personalityTraits || "",
            ideals: parsedData.ideals || "",
            bonds: parsedData.bonds || "",
            flaws: parsedData.flaws || "",
        };

    } catch (error) {
        console.error("Errore durante la chiamata alla Cloud Function 'callGemini':", error);
        return ERROR_RESPONSE;
    }
};