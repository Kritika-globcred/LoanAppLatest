import { GoogleGenerativeAI } from '@google/generative-ai';
import { University } from '@/types/university';

// Get API key from environment variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. AI enrichment will be disabled.');
}

// Initialize Gemini AI only if API key is available
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Generate lender recommendations using Gemini AI client-side.
 * @param input Object containing user profile and all lenders
 * @returns Array of recommended lenders (filtered and/or ranked)
 */
export async function enrichLenderRecommendationsGemini(input: {
  graduationPercent?: string;
  countryOfResidence?: string;
  lastGraduationLevel?: string;
  coSignatoryAvailable?: boolean;
  offerLetter?: {
    universityName?: string;
    courseFees?: string;
    courseName?: string;
    courseLevel?: string;
  };
  lenders: any[];
}): Promise<any[]> {
  if (!genAI) throw new Error('Gemini AI is not configured.');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // Format a prompt for Gemini
  const prompt = `You are an expert AI student loan advisor. The user has the following profile:

- Country of Residence: ${input.countryOfResidence || 'N/A'}
- Graduation Percent: ${input.graduationPercent || 'N/A'}
- Last Graduation Level: ${input.lastGraduationLevel || 'N/A'}
- Co-signatory Available: ${input.coSignatoryAvailable ? 'Yes' : 'No'}
- Offer Letter: University: ${input.offerLetter?.universityName || 'N/A'}, Course: ${input.offerLetter?.courseName || 'N/A'}, Level: ${input.offerLetter?.courseLevel || 'N/A'}, Fees: ${input.offerLetter?.courseFees || 'N/A'}

Here is a database of lenders (in JSON):
${JSON.stringify(input.lenders, null, 2)}

Based on the user's profile and the lenders' criteria, recommend the 2-3 most suitable DOMESTIC lenders (from the user's country) and 2-3 most suitable FOREIGN lenders (from other major markets). For each, only include lenders that the user is likely eligible for (based on country, academic, and co-signatory requirements). Output a single JSON array of recommended lenders, each with these fields: name, countries, loanType, rateOfInterest, livingExpensesCovered, tatForSanctionLetter, and any other relevant field for display. Do NOT include any explanation, only the JSON array.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // Try to extract a JSON array from the response
  try {
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    }
    // Fallback: try to parse the whole text
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Failed to parse Gemini AI output as JSON.');
  }
}


/**
 * Extract university data from plain text using Gemini AI. Returns an array of mapped objects.
 * @param pdfText The extracted text from the PDF
 */
export async function enrichUniversityDataGemini(pdfText: string): Promise<any[]> {
  if (!genAI) throw new Error('Gemini AI is not configured.');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `Extract university data from the following document text. For each university, return a JSON object with these fields: universityName, courses, country, fees, currency, feesDestinationCurrency, feesINR, inrSelfContributionDeposit, selfContributionDepositDestinationCurrency, scholarships, tatForOffer, employabilitySuccess. Return an array of such objects. Only include data that clearly matches these fields.\n\nDocument text:\n${pdfText}`;
  const result = await model.generateContent(prompt);
  // Try to parse the response as JSON
  try {
    const text = result.response.text();
    // Find the first JSON array in the response
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    }
    // Fallback: try to parse the whole text
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Failed to parse Gemini AI output as JSON.');
  }
}

interface QSUniversityData {
  name: string;
  website: string;
  logoUrl: string;
  description: string;
  qsRanking?: number;
  qsRankingYear?: number;
  country: string;
  city: string;
  establishedYear?: number;
  totalStudents?: number;
  internationalStudents?: number;
  studentFacultyRatio?: number;
  programs: Array<{
    name: string;
    level: 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate';
    duration: string;
    tuition: {
      local: number;
      international: number;
      currency: string;
    };
    startDates: string[];
    language: string;
  }>;
  admissionRequirements: {
    ielts?: number;
    toefl?: number;
    pte?: number;
    gre?: number;
    gmat?: number;
    gpa?: number;
  };
  employabilityIndex?: number;
  campusFacilities?: string[];
  scholarships?: Array<{
    name: string;
    amount: number;
    currency: string;
    description: string;
  }>;
}

interface EnrichedUniversityData {
  name?: string;
  shortName?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  country?: string;
  countries?: string[];
  city?: string;
  email?: string;
  phone?: string;
  establishedYear?: number;
  type?: 'public' | 'private' | 'for-profit' | 'non-profit';
}

export async function enrichUniversityData(university: Partial<University>): Promise<Partial<University>> {
  // If no API key is available, return the original data
  if (!genAI) {
    console.warn('Gemini API key not configured. Returning original data.');
    return university;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
  const prompt = `
  You are a helpful assistant that enriches university information by searching official university websites and other reliable sources.
  
  For the university: ${university.name}${university.website ? ` (${university.website})` : ''}
  
  Please provide the following information in JSON format. If information is not available, use null:
  
  1. Official website URL (if not provided)
  2. University logo URL (high-quality, official logo)
  3. Brief description (1-2 paragraphs)
  4. Short name or abbreviation (if applicable)
  5. Location information:
     - Country (ISO 3166-1 alpha-2 code)
     - City
  6. Contact information:
     - Email
     - Phone number (with international format)
  7. Basic information:
     - Year established
     - Type (public/private/for-profit/non-profit)
  
  Format the response as valid JSON matching this interface:
  ${JSON.stringify({
    name: 'string',
    shortName: 'string',
    website: 'string',
    logoUrl: 'string',
    description: 'string',
    country: 'string (ISO 3166-1 alpha-2 code)',
    countries: 'string[] (array of country codes)',
    city: 'string',
    email: 'string',
    phone: 'string (international format)',
    establishedYear: 'number',
    type: 'public|private|for-profit|non-profit'
  }, null, 2)}
  
  Only include the JSON in your response, without any additional text or markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response (handling markdown code blocks and plain JSON)
    let jsonString = text.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\n([\s\S]*?)\n```/);
    
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else if (jsonString.startsWith('{') && jsonString.endsWith('}')) {
      // Already valid JSON
    } else {
      throw new Error('No valid JSON found in the response');
    }
    
    const enrichedData: EnrichedUniversityData = JSON.parse(jsonString);
    
    // Map the enriched data to our University type
    return {
      ...university,
      name: enrichedData.name || university.name,
      shortName: enrichedData.shortName || university.shortName,
      website: enrichedData.website || university.website,
      logoUrl: enrichedData.logoUrl || university.logoUrl,
      description: enrichedData.description || university.description,
      country: enrichedData.country || university.country,
      countries: enrichedData.countries || 
                (enrichedData.country ? [enrichedData.country] : university.countries),
      city: enrichedData.city || university.city,
      email: enrichedData.email || university.email,
      phone: enrichedData.phone || university.phone,
      establishedYear: enrichedData.establishedYear || university.establishedYear,
      type: enrichedData.type || university.type,
      dataSource: 'ai_enrichment',
      lastVerified: new Date(),
    };
  } catch (error) {
    console.error('Error enriching university data with Gemini:', error);
    
    let errorMessage = 'Failed to fetch university data';
    
    // Handle rate limit and quota exceeded errors specifically
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota')) {
        errorMessage = 'API rate limit or quota exceeded. Please try again later or check your billing.';
      } else if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'API authentication failed. Please check your API key configuration.';
      } else {
        errorMessage = error.message;
      }
    }
    
    // Return original data with error information
    return {
      ...university,
      _enrichmentError: errorMessage,
      _enrichmentFailed: true
    };
  }
}
