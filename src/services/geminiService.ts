// src/services/geminiService.ts (Versione Sicura con Cloud Function)

// 1. CAMBIAMO GLI IMPORT
// Non importiamo più GoogleGenAI, ma i tool per chiamare le Cloud Functions.
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getFirebase } from '../lib/getFirebase';
import { ICharacter } from '../features/character/characterTypes';

// 2. NIENTE PIÙ CHIAVE API QUI!
// La riga 'const apiKey = import.meta.env.VITE_GEMINI_API_KEY;' viene eliminata.
// La chiave ora vive solo sul server.

// Interfaccia per definire cosa ci aspettiamo dalla Cloud Function
interface GeminiFunctionResponse {
    success: boolean;
    // Oggetto JSON già analizzato dal server (non una stringa).
    response: Partial<Record<keyof PersonalityFields, unknown>> | null;
}

// Lunghezza massima dei testi liberi inseriti nel prompt (il server limita a 2000 caratteri totali).
const MAX_FIELD_LENGTH = 200;
const clip = (value: unknown): string => String(value ?? '').slice(0, MAX_FIELD_LENGTH);

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
const getCallable = () => {
    const { app } = getFirebase();
    const functions = getFunctions(app, 'europe-west1');
    return httpsCallable<string, GeminiFunctionResponse>(
        functions, 
        'callGemini' // Il nome esatto della funzione che abbiamo deployato
    );
};

// La firma della funzione rimane IDENTICA, così non devi cambiare il componente CharacterSheet.
export const generatePersonality = async (character: ICharacter, customPrompt?: string): Promise<Partial<PersonalityFields>> => {
  
    // 4. MANTENIAMO LA TUA LOGICA PER CREARE IL PROMPT
    // È scritta molto bene e non c'è motivo di cambiarla.
    const { name, race, 'class': characterClass, background, alignment } = character;
    const prompt = `
     Generate personality aspects for a Dungeons & Dragons character.
     Based on the following details:
     - Name: ${clip(name)}
     - Race: ${clip(race)}
     - Class: ${clip(characterClass)}
     - Background: ${clip(background)}
     - Alignment: ${clip(alignment)}
     ${customPrompt ? `\n- Additional Theme: "${clip(customPrompt)}"` : ''}

     Return a JSON object with four keys: "personalityTraits", "ideals", "bonds", and "flaws".
     - "personalityTraits": A short paragraph describing the character's general demeanor.
     - "ideals": A sentence describing a core belief.
     - "bonds": A sentence about something or someone the character cares deeply about.
     - "flaws": A sentence describing a significant weakness or fear.
   `;

    try {
        // 5. SOSTITUIAMO LA CHIAMATA DIRETTA CON LA CHIAMATA ALLA FUNZIONE
        console.log("Calling Cloud Function 'callGemini'...");
        const callGeminiFunction = getCallable();
        const result: HttpsCallableResult<GeminiFunctionResponse> = await callGeminiFunction(prompt);

        const parsedData = result.data.response;
        if (!result.data.success || !parsedData || typeof parsedData !== 'object') {
            throw new Error("La Cloud Function ha restituito una risposta non valida.");
        }

        // Il server restituisce già l'oggetto JSON: nessun JSON.parse lato client.
        const asText = (v: unknown) => (typeof v === 'string' ? v : "");
        return {
            personalityTraits: asText(parsedData.personalityTraits),
            ideals: asText(parsedData.ideals),
            bonds: asText(parsedData.bonds),
            flaws: asText(parsedData.flaws),
        };

    } catch (error) {
        console.error("Errore durante la chiamata alla Cloud Function 'callGemini':", error);
        return ERROR_RESPONSE;
    }
};