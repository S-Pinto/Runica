// functions/src/handlers/geminiHandler.ts

import {onCall, HttpsError} from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import {GoogleGenerativeAI} from '@google/generative-ai';

/**
 * Funzione onCall che interagisce con l'API di Gemini.
 * Viene esportata per essere usata in index.ts.
 */
export const callGemini = onCall(
    {
      secrets: ['GEMINI_API_KEY'],
      region: 'europe-west1', // È buona norma specificare la regione
    },
    async (request) => {
      // Aggiungiamo un controllo per assicurare che solo gli utenti loggati
      // possano chiamare la funzione, per sicurezza e controllo dei costi.
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'La funzione deve essere chiamata da un utente autenticato.');
      }

      const prompt = request.data as string;

      if (!prompt) {
        logger.error('Nessun prompt fornito nella richiesta.');
        throw new HttpsError('invalid-argument', 'Per favore, fornisci un prompt.');
      }

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          logger.error('La chiave API di Gemini non è stata trovata nei segreti.');
          throw new HttpsError('internal', 'Configurazione del server incompleta.');
        }
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        logger.info(`Richiesta a Gemini con prompt: "${prompt}"`);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        try {
          // Dato che abbiamo richiesto una risposta JSON, dovremmo analizzarla.
          const jsonResponse = JSON.parse(text);
          return {
            success: true,
            response: jsonResponse,
          };
        } catch (e) {
          logger.error("Impossibile analizzare la risposta di Gemini come JSON.", {text});
          throw new HttpsError("internal", "Il modello ha restituito una risposta JSON non valida.");
        }
      } catch (error) {
        logger.error('Errore durante la chiamata a Gemini:', error);
        throw new HttpsError('internal', 'Impossibile completare la richiesta a Gemini.');
      }
    }
);
