import { GoogleGenAI, Type } from "@google/genai";
import { ICharacter } from '../types';

// The API key must be prefixed with VITE_ to be exposed to the client-side code by Vite.
// This key is sourced from Netlify's environment variables during the build process.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the AI client only if the API key is provided.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface PersonalityFields {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
}

const ERROR_RESPONSE: Partial<PersonalityFields> = {
    personalityTraits: "AI generation failed. The API key might be missing or invalid.",
    ideals: "Error generating ideals.",
    bonds: "Error generating bonds.",
    flaws: "Error generating flaws.",
};


export const generatePersonality = async (character: ICharacter, customPrompt?: string): Promise<Partial<PersonalityFields>> => {
  if (!ai) {
    console.error("Gemini AI client is not initialized. Make sure VITE_GEMINI_API_KEY is set.");
    return ERROR_RESPONSE;
  }
  
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                personalityTraits: { type: Type.STRING },
                ideals: { type: Type.STRING },
                bonds: { type: Type.STRING },
                flaws: { type: Type.STRING },
            }
        }
      },
    });
    
    const jsonStr = response.text.trim();
    const parsedData = JSON.parse(jsonStr);

    return {
        personalityTraits: parsedData.personalityTraits || "",
        ideals: parsedData.ideals || "",
        bonds: parsedData.bonds || "",
        flaws: parsedData.flaws || "",
    };

  } catch (error) {
    console.error("Error generating personality:", error);
    return ERROR_RESPONSE;
  }
};