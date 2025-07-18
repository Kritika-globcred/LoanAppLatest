import dotenv from 'dotenv';
// Load .env.local first if it exists, then .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // Loads .env

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Log the key to verify (REMOVE IN PRODUCTION)
console.log('[Genkit Init] Attempting to use GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Key Found (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'Key NOT Found');

export const ai = genkit({
  plugins: [
    googleAI({
      // The API key is typically picked up from GEMINI_API_KEY or GOOGLE_API_KEY env var automatically
      // but can be explicitly provided:
      // apiKey: process.env.GEMINI_API_KEY 
    })
  ],
  // Default model for text generation if not specified in the flow
  model: 'googleai/gemini-2.0-flash', 
  // You can also specify other defaults like this:
  // textDataType: 'text/plain', // Default, can be 'text/markdown'
});

console.log('[Genkit Init] Genkit object initialized.');
