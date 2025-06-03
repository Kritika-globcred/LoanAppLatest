
'use server';
/**
 * @fileOverview An AI flow to extract professional profile information from a resume image, text, or LinkedIn URL.
 *
 * - extractProfessionalProfileDetails - A function that handles the profile information extraction.
 * - ExtractProfessionalProfileInput - The input type for the flow.
 * - ExtractProfessionalProfileOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { registerHandlebarsHelpers } from './handlebars-helpers';
import { z } from 'genkit';

// Register Handlebars helpers (especially 'eq') before using any Handlebars templates
registerHandlebarsHelpers();

const ExtractProfessionalProfileInputSchema = z.object({
  profileDataSource: z
    .string()
    .nullable()
    .describe(
      "The data source for the professional profile. Can be a resume image (as a data URI: 'data:<mimetype>;base64,<encoded_data>'), a PDF/DOC resume (as a data URI), or a public LinkedIn profile URL (e.g., 'https://www.linkedin.com/in/username'). This will be null if resumeTextContent is provided."
    ),
  sourceType: z.enum(["resumeImage", "linkedinUrl", "resumeText"]).describe("Specifies whether the profileDataSource is a 'resumeImage' (or PDF/DOC data URI), a 'linkedinUrl', or if 'resumeText' is provided." ),
  resumeTextContent: z
    .string()
    .nullable()
    .describe(
      "Plain text content extracted from the resume, if it was a .txt file. This will be null if profileDataSource is an image URI or LinkedIn URL."
    ),
  isResumeImage: z.boolean().optional().describe("True if the profileDataSource is a resume image or document, false otherwise."),
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
Analyze the provided professional profile content carefully. Prioritize text content if available.

{{#if resumeTextContent}}
Resume Text Content:
{{{resumeTextContent}}}
{{else}}
  {{#if profileDataSource}}
    {{#if isResumeImage}}
      Resume Document/Image (could be JPG, PNG, PDF, DOC data URI):
      {{media url=profileDataSource}}
    {{else}}
      LinkedIn Profile URL (analyze the content at this URL):
      {{{profileDataSource}}}
    {{/if}}
  {{else}}
No professional profile content provided.
  {{/if}}
{{/if}}

Extract the following details and structure your response according to the defined output schema:

1.  **Years of Experience**: Estimate the total years of professional work experience. Summarize if multiple roles.
2.  **Gap in Last 3 Years (Months)**: Identify any significant employment gaps in the last 3 years. Specify the duration in months or "None".
3.  **Current or Last Industry**: The industry of their current or most recent position.
4.  **Current or Last Job Role**: Their current or most recent job title.

If a specific piece of information cannot be found or confidently determined, use "Not Specified" for that field.
For years of experience, be concise (e.g., "7 years", "10+ years").
For gaps, if no clear gap in the last 3 years, state "None".
Focus on the most recent and relevant information.
If no content was provided, return "Not Specified" for all fields.
`,
});

const extractProfessionalProfileFlow = ai.defineFlow(
  {
    name: 'extractProfessionalProfileFlow',
    inputSchema: ExtractProfessionalProfileInputSchema,
    outputSchema: ExtractProfessionalProfileOutputSchema,
  },
  async (input) => {
    if (!input.profileDataSource && !input.resumeTextContent) {
      return {
        yearsOfExperience: "Not Specified",
        gapInLast3YearsMonths: "Not Specified",
        currentOrLastIndustry: "Not Specified",
        currentOrLastJobRole: "Not Specified",
      };
    }
    // Add isResumeImage for template logic
    const isResumeImage = input.sourceType === 'resumeImage';
    const patchedInput = { ...input, isResumeImage };
    const { output } = await extractProfilePrompt(patchedInput);
    if (!output) {
        throw new Error("AI failed to process the professional profile or return valid data.");
    }
    return output;
  }
);

export async function extractProfessionalProfileDetails(input: ExtractProfessionalProfileInput): Promise<ExtractProfessionalProfileOutput> {
  return extractProfessionalProfileFlow(input);
}

    