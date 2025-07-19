/**
 * index.ts
 *
 * Questo è il file di ingresso principale per le tue Cloud Functions.
 * Da qui, importa e riesporta tutte le funzioni che vuoi deployare.
 * Questo approccio mantiene il codice pulito e modulare.
 */

// 1. Importa le funzioni dai loro file dedicati.
import { callGemini } from "./handlers/geminiHandler";

// 2. Esportale in modo che Firebase possa trovarle.
// Il nome della funzione nel cloud sarà lo stesso nome della costante importata.
export { callGemini };
