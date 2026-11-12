// functions/src/handlers/geminiHandler.ts

import {onCall, HttpsError} from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import {GoogleGenerativeAI} from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_PROMPT_LENGTH = 2000;

/**
 * Funzione onCall che interagisce con l'API di Gemini.
 * Risponde con `{ success, response }` dove `response` è l'oggetto JSON
 * già analizzato restituito dal modello.
 */
export const callGemini = onCall(
    {
      secrets: ['GEMINI_API_KEY'],
      region: 'europe-west1',
      timeoutSeconds: 60,
      maxInstances: 5,
    },
    async (request) => {
      // Solo utenti loggati, per sicurezza e controllo dei costi.
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'La funzione deve essere chiamata da un utente autenticato.');
      }

      const prompt = request.data;

      if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'Per favore, fornisci un prompt.');
      }
      if (prompt.length > MAX_PROMPT_LENGTH) {
        throw new HttpsError('invalid-argument', `Il prompt supera il limite di ${MAX_PROMPT_LENGTH} caratteri.`);
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error('La chiave API di Gemini non è stata trovata nei segreti.');
        throw new HttpsError('internal', 'Configurazione del server incompleta.');
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: GEMINI_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1024,
          },
        });

        // Il testo del prompt non viene loggato: può contenere dati dell'utente.
        logger.info('Richiesta a Gemini', {uid: request.auth.uid, promptLength: prompt.length});

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let jsonResponse: unknown;
        try {
          jsonResponse = JSON.parse(text);
        } catch {
          logger.error('Impossibile analizzare la risposta di Gemini come JSON.', {length: text.length});
          throw new HttpsError('internal', 'Il modello ha restituito una risposta JSON non valida.');
        }

        return {
          success: true,
          response: jsonResponse,
        };
      } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error('Errore durante la chiamata a Gemini:', error);
        throw new HttpsError('internal', 'Impossibile completare la richiesta a Gemini.');
      }
    }
);
