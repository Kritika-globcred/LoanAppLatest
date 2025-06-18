// Firebase Admin and Functions v2
import { onCall, HttpsOptions } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// File processing libraries
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { createWorker, PSM } from 'tesseract.js';

// Initialize Firebase Admin
admin.initializeApp();

// Define types for Tesseract worker
type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

export interface ExtractOfferLetterRequest {
  fileData: string; // base64 encoded file
  mimeType: string;
  fileName: string;
}

export interface ExtractOfferLetterResponse {
  success: boolean;
  extractedText: string;
  error?: string;
  __headers?: {
    [key: string]: string;
  };
}

// Helper function to process image with Tesseract
async function processImageWithTesseract(buffer: Buffer): Promise<string> {
  const worker = await createWorker();
  try {
    await (worker as any).load();
    await (worker as any).loadLanguage('eng');
    await (worker as any).initialize('eng');
    await (worker as any).setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });
    const { data: { text } } = await (worker as any).recognize(buffer);
    return text;
  } finally {
    await (worker as any).terminate();
  }
}

// Cloud Function options
const functionOptions: HttpsOptions = {
  region: 'us-central1',
  cors: [
    'http://localhost:9003',
    'https://your-production-domain.com' // Replace with your production domain
  ]
};

// Cloud Function to extract text from offer letters
export const extractOfferLetter = onCall(functionOptions, async (request) => {
    // Extract data and context from request
    const { data: requestData, auth } = request;
    
    // Set CORS headers
    const corsHandler = (response: Omit<ExtractOfferLetterResponse, '__headers'>): ExtractOfferLetterResponse => ({
      ...response,
      __headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

    try {
      // Ensure user is authenticated
      if (!auth) {
        console.error('Unauthenticated request');
        return corsHandler({
          success: false,
          extractedText: '',
          error: 'User must be authenticated'
        });
      }

      const { fileData, mimeType, fileName } = requestData as ExtractOfferLetterRequest;

      if (!fileData || !mimeType || !fileName) {
        console.error('Missing required parameters', { hasFileData: !!fileData, mimeType, fileName });
        return corsHandler({
          success: false,
          extractedText: '',
          error: 'Missing required parameters'
        });
      }

      console.log(`Processing file: ${fileName}, type: ${mimeType}`);

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');
      let extractedText = '';

      // Process different file types
      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse.default(buffer);
        extractedText = pdfData.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (mimeType.startsWith('image/')) {
        extractedText = await processImageWithTesseract(buffer);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      console.log('Successfully extracted text');
      return corsHandler({
        success: true,
        extractedText
      });
    } catch (error) {
      console.error('Error processing document:', error);
      return corsHandler({
        success: false,
        extractedText: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
