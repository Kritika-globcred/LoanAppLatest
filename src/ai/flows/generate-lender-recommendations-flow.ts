
'use server';
/**
 * @fileOverview An AI flow to generate lender recommendations.
 *
 * - generateLenderRecommendations - A function that handles recommendation generation.
 * - GenerateLenderRecommendationsInput - The input type for the flow.
 * - GenerateLenderRecommendationsOutput - The return type for the flow.
 * - LenderRecommendation - The structure for a single lender recommendation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateLenderRecommendationsInputSchema = z.object({
  userCountryOfResidence: z.string().describe("The user's country of residence (e.g., 'India', 'Nigeria'). This is key for determining domestic lenders."),
  admissionUniversityName: z.string().describe("The name of the university the user has been admitted to."),
  tuitionFees: z.string().describe("The tuition fees mentioned in the offer letter, including currency and period (e.g., '$20,000 USD per year', 'EUR 15,000 total')."),
  courseLevel: z.string().describe("The academic level of the course (e.g., 'Bachelor\\'s', 'Master\\'s', 'PhD')."),
  // Consider adding:
  // - academicProfileSummary: z.string().optional().describe("Brief summary of user's academic scores/profile."),
  // - professionalProfileSummary: z.string().optional().describe("Brief summary of user's work experience."),
  // - hasCoSigner: z.boolean().optional().describe("Whether the user has a co-signer."),
});
export type GenerateLenderRecommendationsInput = z.infer<typeof GenerateLenderRecommendationsInputSchema>;

const LenderRecommendationSchema = z.object({
  lenderName: z.string().describe("The name of the recommended lending institution."),
  loanType: z.string().describe("The type of loan product offered (e.g., 'Secured Education Loan', 'Unsecured Personal Loan for Studies')."),
  estimatedLoanAmount: z.string().describe("An estimated loan amount or coverage, ideally referencing the tuition fees (e.g., 'Covers up to 90% of tuition: approx. $18,000 USD', 'Up to EUR 25,000')."),
  keyFeatures: z.string().describe("1-2 key features or notes about this lender/loan (e.g., 'Competitive interest rates', 'Faster processing for [University Name] applicants', 'May require a co-signer from [User's Country]', 'Predefined offer available for your university')."),
});
export type LenderRecommendation = z.infer<typeof LenderRecommendationSchema>;

const GenerateLenderRecommendationsOutputSchema = z.object({
  domesticLenders: z.array(LenderRecommendationSchema).describe("A list of 2-3 recommended domestic lenders from the user's country of residence."),
  foreignLenders: z.array(LenderRecommendationSchema).describe("A list of 2-3 recommended foreign/international lenders from major markets like US, UK, Canada, Australia etc."),
});
export type GenerateLenderRecommendationsOutput = z.infer<typeof GenerateLenderRecommendationsOutputSchema>;

const generateLendersPrompt = ai.definePrompt({
  name: 'generateLenderRecommendationsPrompt',
  input: { schema: GenerateLenderRecommendationsInputSchema },
  output: { schema: GenerateLenderRecommendationsOutputSchema },
  prompt: `You are an expert AI loan advisor for international students.
The user is from {{{userCountryOfResidence}}} and has been admitted to {{{admissionUniversityName}}} for a {{{courseLevel}}} program.
Their stated tuition fees are: {{{tuitionFees}}}.

Based on this information, provide 2-3 DOMESTIC lender recommendations (from {{{userCountryOfResidence}}}) and 2-3 FOREIGN lender recommendations (from major international student lending markets like the US, UK, Canada, Australia, etc., if different from user's country).

For each lender, provide:
1.  **Lender Name**: A plausible name for a financial institution.
2.  **Loan Type**: e.g., "Secured Education Loan", "Unsecured Personal Loan for Study".
3.  **Estimated Loan Amount**: Base this on covering 80-95% of the stated {{{tuitionFees}}}. Show the approximate amount in the fee's currency.
4.  **Key Features (1-2 bullet points or short sentences)**: Mention things like interest rate competitiveness (e.g., "Competitive floating rates"), co-signer requirements (e.g., "May require a co-signer from {{{userCountryOfResidence}}} for domestic loans"), university tie-ups (e.g., "Faster processing for {{{admissionUniversityName}}} students"), or special offers (e.g., "Predefined offer for selected courses at {{{admissionUniversityName}}}").

Simulate having access to a database of lenders and their criteria. Make the recommendations diverse and realistic for international student loans.
If the user's country of residence is a major international market (e.g. US, UK), the foreign lenders should be from other distinct markets.
If the tuition fee currency is not obvious, assume USD or EUR as appropriate for international universities.

Return the recommendations in the specified JSON format with 'domesticLenders' and 'foreignLenders' arrays.
If no plausible lenders can be generated for a category, return an empty array for that category.
`,
});

const generateLenderRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateLenderRecommendationsFlow',
    inputSchema: GenerateLenderRecommendationsInputSchema,
    outputSchema: GenerateLenderRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await generateLendersPrompt(input);
    if (!output) {
      // Fallback to empty arrays if AI returns nothing
      return { domesticLenders: [], foreignLenders: [] };
    }
    return output;
  }
);

export async function generateLenderRecommendations(input: GenerateLenderRecommendationsInput): Promise<GenerateLenderRecommendationsOutput> {
  return generateLenderRecommendationsFlow(input);
}
