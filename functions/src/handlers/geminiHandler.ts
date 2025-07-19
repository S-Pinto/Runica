// functions/src/handlers/geminiHandler.ts

import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Funzione onCall che interagisce con l'API di Gemini.
 * Viene esportata per essere usata in index.ts.
 */
export const callGemini = onCall(
  { secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    const prompt = request.data as string;

    if (!prompt) {
      logger.error("Nessun prompt fornito nella richiesta.");
      throw new Error("Per favore, fornisci un prompt.");
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error("La chiave API di Gemini non è stata trovata nei segreti.");
        throw new Error("Configurazione del server incompleta.");
      }
      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      logger.info(`Richiesta a Gemini con prompt: "${prompt}"`);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        success: true,
        response: text,
      };
    } catch (error) {
      logger.error("Errore durante la chiamata a Gemini:", error);
      throw new Error("Impossibile completare la richiesta a Gemini.");
    }
  }
);