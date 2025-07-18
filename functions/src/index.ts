// functions/src/index.ts (Versione Migliorata con JSON Mode)

import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {GoogleGenerativeAI} from "@google/generative-ai";

exports.callGemini = onCall(
  {secrets: ["GEMINI_API_KEY"]},
  async (request) => {
    // Il prompt è ancora una stringa che arriva dal frontend
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

      // *** MODIFICA QUI ***
      // Specifichiamo la configurazione per forzare una risposta JSON
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Usiamo un modello recente
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      logger.info(`Richiesta a Gemini con prompt: "${prompt}"`);

      // La chiamata a `generateContent` non cambia
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Il testo ora sarà una stringa JSON garantita (es. '{"trait": "...", ...}')
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
