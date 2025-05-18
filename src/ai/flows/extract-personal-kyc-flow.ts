
'use server';
/**
 * @fileOverview An AI flow to extract information from Personal KYC documents (PAN/National ID and Passport).
 *
 * - extractPersonalKycDetails - A function that handles the KYC information extraction.
 * - ExtractPersonalKycInput - The input type for the flow.
 * - ExtractPersonalKycOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractPersonalKycInputSchema = z.object({
  idDocumentImageUri: z
    .string()
    .describe(
      "An image of the PAN Card or National ID, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'. For best results, ensure the image is clear and legible."
    ),
  passportImageUri: z
    .string()
    .describe(
      "An image of the Passport, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'. For best results, ensure the image is clear and legible."
    ),
  idDocumentType: z.enum(["PAN Card", "National ID"]).describe("The type of the primary ID document provided ('PAN Card' or 'National ID')."),
});
export type ExtractPersonalKycInput = z.infer<typeof ExtractPersonalKycInputSchema>;

const ExtractPersonalKycOutputSchema = z.object({
  idNumber: z.string().describe("The ID number from the PAN Card or National ID. If not found, state 'Not Specified'."),
  idType: z.string().describe("The type of ID document provided (e.g., 'PAN Card', 'National ID'). This should reflect the input idDocumentType."),
  passportNumber: z.string().describe("The Passport number. If not found, state 'Not Specified'."),
  mothersName: z.string().optional().describe("Mother's full name, if available on the documents. If not found, state 'Not Specified'."),
  fathersName: z.string().optional().describe("Father's full name, if available on the documents. If not found, state 'Not Specified'."),
  passportExpiryDate: z.string().describe("Passport expiry date (e.g., 'YYYY-MM-DD'). If not found, state 'Not Specified'."),
  passportIssueDate: z.string().describe("Passport issue date (e.g., 'YYYY-MM-DD'). If not found, state 'Not Specified'."),
  nameOnPassport: z.string().describe("The full name of the individual as it appears on the Passport. If not found, state 'Not Specified'."),
  countryOfUser: z.string().describe("The country of citizenship or issuance as indicated on the Passport. If not found, state 'Not Specified'."),
  dateOfBirth: z.string().describe("Date of birth (e.g., 'YYYY-MM-DD') from the documents. If not found, state 'Not Specified'."),
  permanentAddress: z.string().describe("Permanent address as mentioned on the documents. If not found or partially found, state 'Not Specified' or provide partial information."),
});
export type ExtractPersonalKycOutput = z.infer<typeof ExtractPersonalKycOutputSchema>;


const extractKycPrompt = ai.definePrompt({
  name: 'extractPersonalKycPrompt',
  input: { schema: ExtractPersonalKycInputSchema },
  output: { schema: ExtractPersonalKycOutputSchema },
  prompt: `You are an expert AI assistant specializing in extracting information from personal identification documents.
You will be provided with two images: one is a {{idDocumentType}} and the other is a Passport.
Analyze both documents carefully. Extract the following details and structure your response according to the defined output schema:

Primary ID Document ({{idDocumentType}}):
{{media url=idDocumentImageUri}}

Passport Document:
{{media url=passportImageUri}}

Extraction Fields:
1.  **ID Number**: The primary identification number from the {{idDocumentType}}.
2.  **ID Type**: Confirm the type as '{{idDocumentType}}'.
3.  **Passport Number**: The main number on the passport.
4.  **Mother's Name**: If listed on either document. Default to 'Not Specified'.
5.  **Father's Name**: If listed on either document. Default to 'Not Specified'.
6.  **Passport Expiry Date**: In YYYY-MM-DD format. Default to 'Not Specified'.
7.  **Passport Issue Date**: In YYYY-MM-DD format. Default to 'Not Specified'.
8.  **Name on Passport**: Full name as it appears on the passport.
9.  **Country of User**: Country of citizenship or issuance from the passport. Default to 'Not Specified'.
10. **Date of Birth**: In YYYY-MM-DD format, from either document (prefer passport if available). Default to 'Not Specified'.
11. **Permanent Address**: Full permanent address from either document. If address differs, prefer the one that seems most complete or official. Default to 'Not Specified'.

Ensure all extracted text is accurate. If a specific piece of information cannot be found on EITHER document, use "Not Specified" for that field, unless a default is mentioned above.
Prioritize information from the Passport for fields like Name, DOB, and Country if available on both.
For dates, if the format is different, convert to YYYY-MM-DD. If only year is present, use YYYY-01-01. If month and year, use YYYY-MM-01.
`,
});

const extractPersonalKycFlow = ai.defineFlow(
  {
    name: 'extractPersonalKycFlow',
    inputSchema: ExtractPersonalKycInputSchema,
    outputSchema: ExtractPersonalKycOutputSchema,
  },
  async (input) => {
    const { output } = await extractKycPrompt(input);
    if (!output) {
        throw new Error("AI failed to process the KYC documents or return valid data.");
    }
    // Ensure optional fields are present, defaulting to "Not Specified" if AI omits them
    const ensuredOutput: ExtractPersonalKycOutput = {
        ...output,
        mothersName: output.mothersName || "Not Specified",
        fathersName: output.fathersName || "Not Specified",
    };
    return ensuredOutput;
  }
);

export async function extractPersonalKycDetails(input: ExtractPersonalKycInput): Promise<ExtractPersonalKycOutput> {
  return extractPersonalKycFlow(input);
}
