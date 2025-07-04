import { GoogleGenAI } from "@google/genai";
import { ICharacter } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY as string });

interface PersonalityFields {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
}

export const generatePersonality = async (character: ICharacter, customPrompt?: string): Promise<Partial<PersonalityFields>> => {
  if (!API_KEY) {
    return Promise.resolve({
        personalityTraits: "AI functionality is disabled. API key not configured.",
        ideals: "AI functionality is disabled. API key not configured.",
        bonds: "AI functionality is disabled. API key not configured.",
        flaws: "AI functionality is disabled. API key not configured.",
    });
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
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);
    return {
        personalityTraits: parsedData.personalityTraits || "",
        ideals: parsedData.ideals || "",
        bonds: parsedData.bonds || "",
        flaws: parsedData.flaws || "",
    };

  } catch (error) {
    console.error("Error generating personality:", error);
    return {
        personalityTraits: "Error generating personality. Please check the console.",
        ideals: "Error generating ideals.",
        bonds: "Error generating bonds.",
        flaws: "Error generating flaws.",
    };
  }
};