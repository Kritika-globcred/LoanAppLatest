
'use server';
/**
 * @fileOverview An AI flow to extract information from an academic offer letter.
 *
 * - extractOfferLetterDetails - A function that handles the offer letter information extraction.
 * - ExtractOfferLetterInput - The input type for the flow.
 * - ExtractOfferLetterOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Genkit re-exports z

const ExtractOfferLetterInputSchema = z.object({
  offerLetterImageUri: z
    .string()
    .describe(
      "An image of the academic offer letter, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. For best results, ensure the image is clear and legible."
    ),
});
export type ExtractOfferLetterInput = z.infer<typeof ExtractOfferLetterInputSchema>;

const ExtractOfferLetterOutputSchema = z.object({
  studentName: z.string().describe("The full name of the student as mentioned in the offer letter."),
  universityName: z.string().describe("The name of the university offering the admission."),
  courseName: z.string().describe("The name of the course or program of study."),
  admissionLevel: z.string().describe("The level of study (e.g., Bachelor's, Master's, PhD, Diploma, Post-Graduate Diploma)."),
  admissionFees: z.string().describe("The tuition or admission fees mentioned, including currency and amount per period (e.g., '$20,000 USD per year', 'EUR 15,000 total'). If not found, state 'Not Specified'."),
  courseStartDate: z.string().describe("The start date of the course (e.g., 'YYYY-MM-DD', 'September 2024'). If not found, state 'Not Specified'."),
  offerLetterType: z.string().describe("Whether the offer letter is conditional or unconditional. If not found, state 'Not Specified'."),
});
export type ExtractOfferLetterOutput = z.infer<typeof ExtractOfferLetterOutputSchema>;


const extractPrompt = ai.definePrompt({
  name: 'extractOfferLetterPrompt',
  input: { schema: ExtractOfferLetterInputSchema },
  output: { schema: ExtractOfferLetterOutputSchema },
  prompt: `You are an expert AI assistant specializing in extracting information from academic offer letters.
Analyze the provided image of the offer letter carefully.
Extract the following details and structure your response according to the defined output schema:

1.  **Student's Full Name**: The complete name of the applicant.
2.  **University Name**: The official name of the institution offering admission.
3.  **Course Name**: The specific title of the program or course.
4.  **Admission Level**: The academic level (e.g., Bachelor's, Master's, PhD, Post-Graduate Diploma, Graduate Certificate, Diploma).
5.  **Admission Fees**: The tuition fees, including currency and period (e.g., "$25,000 USD per annum", "€10,000 for the program"). If not explicitly stated, respond with "Not Specified".
6.  **Course Start Date**: The commencement date of the course (e.g., "2024-09-01", "Fall 2024", "September 1st, 2024"). If not explicitly stated, respond with "Not Specified".
7.  **Offer Letter Type**: Determine if the offer is 'Conditional' or 'Unconditional'. If it's not clearly stated or ambiguously worded, assume 'Not Specified'.

Ensure all extracted text is accurate and matches the letter. If a specific piece of information cannot be found, use "Not Specified" for that field.

Offer Letter Image:
{{media url=offerLetterImageUri}}
`,
});


const extractOfferLetterFlow = ai.defineFlow(
  {
    name: 'extractOfferLetterFlow',
    inputSchema: ExtractOfferLetterInputSchema,
    outputSchema: ExtractOfferLetterOutputSchema,
  },
  async (input) => {
    const { output } = await extractPrompt(input);
    if (!output) {
        throw new Error("AI failed to process the offer letter or return valid data.");
    }
    return output;
  }
);

export async function extractOfferLetterDetails(input: ExtractOfferLetterInput): Promise<ExtractOfferLetterOutput> {
  return extractOfferLetterFlow(input);
}
