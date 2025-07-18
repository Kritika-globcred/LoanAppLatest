
'use server';
/**
 * @fileOverview An AI flow to generate university and course recommendations.
 *
 * - generateRecommendations - A function that handles the recommendation generation.
 * - GenerateRecommendationsInput - The input type for the flow.
 * - GenerateRecommendationsOutput - The return type for the flow.
 * - UniversityRecommendation - The structure for a single recommendation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRecommendationsInputSchema = z.object({
  preferredCountry1: z.string().describe("The user's first preferred country for studies."),
  preferredCountry2: z.string().nullable().describe("The user's second preferred country (optional)."),
  courseLevel: z.string().describe("The desired academic level (e.g., Graduation, Post-Graduation, Masters, PhD)."),
  courseField: z.string().describe("The desired field or name of the course (e.g., Computer Science, MBA)."),
  validUniversityNames: z.array(z.string()).describe("A list of valid university names to choose from. Only recommend from this list."),
  // Future considerations: academicScores (string), testScores (string), workExperience (string)
});
export type GenerateRecommendationsInput = z.infer<typeof GenerateRecommendationsInputSchema>;


const UniversityRecommendationSchema = z.object({
  universityName: z.string().describe("The name of the recommended university."),
  universitySummary: z.string().describe("A brief summary or highlight of the university (1-2 sentences)."),
  recommendedCourseName: z.string().describe("The specific name of the course recommended at this university."),
  courseDuration: z.string().describe("The typical duration of the course (e.g., '2 years', '4 semesters')."),
  estimatedFees: z.string().describe("Estimated annual or total tuition fees, including currency (e.g., '$20,000 USD per year', 'EUR 30,000 total')."),
  testsRequired: z.string().describe("Common standardized tests required for admission (e.g., 'GRE, TOEFL iBT 90+', 'IELTS 7.0', 'None specified')."),
});
export type UniversityRecommendation = z.infer<typeof UniversityRecommendationSchema>;

const GenerateRecommendationsOutputSchema = z.object({
  recommendations: z.array(UniversityRecommendationSchema).describe("A list of 3-5 university and course recommendations."),
});
export type GenerateRecommendationsOutput = z.infer<typeof GenerateRecommendationsOutputSchema>;

const generateRecommendationsPrompt = ai.definePrompt({
  name: 'generateRecommendationsPrompt',
  input: { schema: GenerateRecommendationsInputSchema },
  output: { schema: GenerateRecommendationsOutputSchema },
  prompt: `You are an expert academic advisor AI. Your role is to provide university and course recommendations based on the user's preferences.

IMPORTANT: Only recommend universities from the following list of valid university names. Do not recommend any university not in this list. Here is the list:
{{#each validUniversityNames}}
- {{this}}
{{/each}}

The user is looking for options in the following field: {{{courseField}}} at the {{{courseLevel}}} level.
Their preferred countries are:
1. {{{preferredCountry1}}}
{{#if preferredCountry2}}
2. {{{preferredCountry2}}}
{{/if}}

Please generate 3 to 5 diverse and plausible recommendations. For each recommendation, provide the following details accurately:
- University Name
- University Summary (1-2 concise, compelling sentences about the university)
- Recommended Course Name (specific to the user's field and level)
- Course Duration (e.g., "2 years", "4 semesters", "18 months")
- Estimated Fees (realistic, including currency and period, e.g., "$25,000 USD per year", "€15,000 for the program")
- Tests Required (common standardized tests like GRE, GMAT, TOEFL, IELTS with typical score ranges if applicable, or "None specified")

Consider the user's preferences and aim for realistic and helpful suggestions.
Return the recommendations in the specified JSON array format.
If the preferences are very broad or common (e.g., "Any" country, "Any" course), provide generally popular and well-regarded options that fit.
`,
});

const generateRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: GenerateRecommendationsInputSchema,
    outputSchema: GenerateRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await generateRecommendationsPrompt(input);
    if (!output) {
      // Fallback to an empty array if AI returns nothing, to ensure type compatibility
      return { recommendations: [] };
    }
    return output;
  }
);

export async function generateRecommendations(input: GenerateRecommendationsInput): Promise<GenerateRecommendationsOutput> {
  return generateRecommendationsFlow(input);
}
