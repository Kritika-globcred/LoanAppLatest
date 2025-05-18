
'use server';
/**
 * @fileOverview An AI flow to extract professional profile information from a resume image or LinkedIn URL.
 *
 * - extractProfessionalProfileDetails - A function that handles the profile information extraction.
 * - ExtractProfessionalProfileInput - The input type for the flow.
 * - ExtractProfessionalProfileOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractProfessionalProfileInputSchema = z.object({
  profileDataSource: z
    .string()
    .describe(
      "The data source for the professional profile. This can be a resume image (as a data URI: 'data:<mimetype>;base64,<encoded_data>') or a public LinkedIn profile URL (e.g., 'https://www.linkedin.com/in/username')."
    ),
  sourceType: z.enum(["resumeImage", "linkedinUrl"]).describe("Specifies whether the profileDataSource is a 'resumeImage' or a 'linkedinUrl'." ),
});
export type ExtractProfessionalProfileInput = z.infer<typeof ExtractProfessionalProfileInputSchema>;

const ExtractProfessionalProfileOutputSchema = z.object({
  yearsOfExperience: z.string().describe("Total years of professional experience. E.g., '5 years', 'Less than 1 year', 'Not Specified'. If a range, provide the most likely single value or summary."),
  gapInLast3YearsMonths: z.string().describe("Any employment gap in the last 3 years, specified in months. E.g., '3 months', 'None', 'Not Specified'. If multiple gaps, sum them or specify the longest."),
  currentOrLastIndustry: z.string().describe("The primary industry of the current or most recent job. E.g., 'Information Technology', 'Healthcare', 'Finance'. If not found, state 'Not Specified'."),
  currentOrLastJobRole: z.string().describe("The current or most recent job title or role. E.g., 'Software Engineer', 'Project Manager', 'Marketing Specialist'. If not found, state 'Not Specified'."),
});
export type ExtractProfessionalProfileOutput = z.infer<typeof ExtractProfessionalProfileOutputSchema>;

const extractProfilePrompt = ai.definePrompt({
  name: 'extractProfessionalProfilePrompt',
  input: { schema: ExtractProfessionalProfileInputSchema },
  output: { schema: ExtractProfessionalProfileOutputSchema },
  prompt: `You are an expert AI assistant specializing in extracting professional information from resumes and LinkedIn profiles.
Analyze the provided {{sourceType}} carefully.
{{#if (eq sourceType "resumeImage")}}Resume Image:
{{media url=profileDataSource}}{{/if}}
{{#if (eq sourceType "linkedinUrl")}}LinkedIn Profile URL (analyze the content at this URL):
{{{profileDataSource}}}{{/if}}

Extract the following details and structure your response according to the defined output schema:

1.  **Years of Experience**: Estimate the total years of professional work experience. Summarize if multiple roles.
2.  **Gap in Last 3 Years (Months)**: Identify any significant employment gaps in the last 3 years. Specify the duration in months or "None".
3.  **Current or Last Industry**: The industry of their current or most recent position.
4.  **Current or Last Job Role**: Their current or most recent job title.

If a specific piece of information cannot be found or confidently determined, use "Not Specified" for that field.
For years of experience, be concise (e.g., "7 years", "10+ years").
For gaps, if no clear gap in the last 3 years, state "None".
Focus on the most recent and relevant information.
`,
});

const extractProfessionalProfileFlow = ai.defineFlow(
  {
    name: 'extractProfessionalProfileFlow',
    inputSchema: ExtractProfessionalProfileInputSchema,
    outputSchema: ExtractProfessionalProfileOutputSchema,
  },
  async (input) => {
    const { output } = await extractProfilePrompt(input);
    if (!output) {
        throw new Error("AI failed to process the professional profile or return valid data.");
    }
    return output;
  }
);

export async function extractProfessionalProfileDetails(input: ExtractProfessionalProfileInput): Promise<ExtractProfessionalProfileOutput> {
  return extractProfessionalProfileFlow(input);
}
