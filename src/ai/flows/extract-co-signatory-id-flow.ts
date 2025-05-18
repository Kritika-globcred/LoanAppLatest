
'use server';
/**
 * @fileOverview An AI flow to extract information from a Co-Signatory's ID document.
 *
 * - extractCoSignatoryIdDetails - A function that handles the ID information extraction.
 * - ExtractCoSignatoryIdInput - The input type for the flow.
 * - ExtractCoSignatoryIdOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractCoSignatoryIdInputSchema = z.object({
  coSignatoryIdImageUri: z
    .string()
    .describe(
      "An image of the Co-Signatory's ID document (PAN Card or National ID), as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'. For best results, ensure the image is clear and legible."
    ),
  idDocumentType: z.enum(["PAN Card", "National ID"]).describe("The type of the ID document provided ('PAN Card' or 'National ID')."),
});
export type ExtractCoSignatoryIdInput = z.infer<typeof ExtractCoSignatoryIdInputSchema>;

const ExtractCoSignatoryIdOutputSchema = z.object({
  idNumber: z.string().describe("The ID number from the document. If not found, state 'Not Specified'."),
  idType: z.string().describe("The type of ID document confirmed from the image (e.g., 'PAN Card', 'National ID'). This should ideally match the input idDocumentType."),
  nameOnId: z.string().describe("The full name of the individual as it appears on the ID document. If not found, state 'Not Specified'."),
});
export type ExtractCoSignatoryIdOutput = z.infer<typeof ExtractCoSignatoryIdOutputSchema>;


const extractIdPrompt = ai.definePrompt({
  name: 'extractCoSignatoryIdPrompt',
  input: { schema: ExtractCoSignatoryIdInputSchema },
  output: { schema: ExtractCoSignatoryIdOutputSchema },
  prompt: `You are an expert AI assistant specializing in extracting information from personal identification documents.
Analyze the provided image of the Co-Signatory's {{idDocumentType}} carefully.
Extract the following details and structure your response according to the defined output schema:

1.  **ID Number**: The primary identification number from the {{idDocumentType}}.
2.  **ID Type**: Confirm the type of ID document from the image, it should be '{{idDocumentType}}'.
3.  **Name on ID**: The full name of the individual as it appears on the ID document.

Ensure all extracted text is accurate. If a specific piece of information cannot be found, use "Not Specified" for that field.

Co-Signatory ID Document Image:
{{media url=coSignatoryIdImageUri}}
`,
});

const extractCoSignatoryIdFlow = ai.defineFlow(
  {
    name: 'extractCoSignatoryIdFlow',
    inputSchema: ExtractCoSignatoryIdInputSchema,
    outputSchema: ExtractCoSignatoryIdOutputSchema,
  },
  async (input) => {
    const { output } = await extractIdPrompt(input);
    if (!output) {
        throw new Error("AI failed to process the Co-Signatory ID or return valid data.");
    }
    return output;
  }
);

export async function extractCoSignatoryIdDetails(input: ExtractCoSignatoryIdInput): Promise<ExtractCoSignatoryIdOutput> {
  return extractCoSignatoryIdFlow(input);
}
