import { GoogleGenerativeAI } from '@google/generative-ai';
import { parse } from 'csv-parse/sync';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Define the expected lender schema
export interface ExtractedLenderData {
  name: string;
  description?: string;
  interestRate?: number;
  maxLoanAmount?: number;
  minCreditScore?: number;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  isActive?: boolean;
  countries?: string[];
  // Allow additional fields
  [key: string]: any;
}

export async function extractLenderDataFromText(text: string, mimeType: string): Promise<{
  data: ExtractedLenderData[];
  newColumns: string[];
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are an expert at extracting structured data from documents. Extract lender information from the following ${mimeType} content.
  
Extract the following fields if available:
- name: The name of the lender (required)
- description: A brief description of the lender
- interestRate: The interest rate as a number
- maxLoanAmount: The maximum loan amount as a number
- minCreditScore: The minimum credit score required as a number
- logoUrl: URL to the lender's logo
- website: The lender's website URL
- contactEmail: Contact email address
- isActive: Boolean indicating if the lender is active
- countries: Array of country codes where the lender operates

For any additional fields that don't match the above, create new fields with appropriate names.

Format the output as a JSON array of objects. Include a 'newColumns' array with any new field names that were created.

Here's the content to process:
${text.slice(0, 10000)}`; // Limit input size for the API

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                     textResponse.match(/(\[\s*\{[\s\S]*?\}\s*\])/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[1]);
    
    // Ensure we have an array of lenders
    const lenders = Array.isArray(parsed) ? parsed : [parsed];
    
    // Extract new columns if present
    const newColumns = parsed.newColumns || [];
    
    return {
      data: lenders,
      newColumns
    };
  } catch (error) {
    console.error('Error extracting data with AI:', error);
    throw new Error('Failed to extract data with AI');
  }
}

export async function processCsvFile(file: File): Promise<{
  data: ExtractedLenderData[];
  newColumns: string[];
}> {
  const text = await file.text();
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
  });
  
  // Convert CSV records to our data structure
  const data = records.map((record: any) => {
    const lender: ExtractedLenderData = { name: '' };
    const newColumns: string[] = [];
    
    for (const [key, value] of Object.entries(record)) {
      const normalizedKey = key.trim().toLowerCase();
      
      // Map known fields
      if (normalizedKey.includes('name')) {
        lender.name = String(value);
      } else if (normalizedKey.includes('description')) {
        lender.description = String(value);
      } else if (normalizedKey.includes('interest') && normalizedKey.includes('rate')) {
        lender.interestRate = parseFloat(String(value).replace(/[^0-9.]/g, '')) || undefined;
      } else if (normalizedKey.includes('max') && normalizedKey.includes('loan')) {
        lender.maxLoanAmount = parseFloat(String(value).replace(/[^0-9.]/g, '')) || undefined;
      } else if (normalizedKey.includes('credit') && normalizedKey.includes('score')) {
        lender.minCreditScore = parseInt(String(value).replace(/\D/g, ''), 10) || undefined;
      } else if (normalizedKey.includes('logo')) {
        lender.logoUrl = String(value);
      } else if (normalizedKey.includes('website')) {
        lender.website = String(value);
      } else if (normalizedKey.includes('email')) {
        lender.contactEmail = String(value);
      } else if (normalizedKey.includes('active') || normalizedKey.includes('status')) {
        lender.isActive = String(value).toLowerCase() === 'true' || 
                         String(value).toLowerCase() === 'yes' ||
                         String(value) === '1';
      } else if (normalizedKey.includes('country') || normalizedKey.includes('countries')) {
        lender.countries = String(value).split(',').map(s => s.trim());
      } else if (value) {
        // Add as a new field
        lender[key] = value;
        newColumns.push(key);
      }
    }
    
    return { lender, newColumns };
  });
  
  // Combine all new columns found
  const allNewColumns = Array.from(new Set(data.flatMap(d => d.newColumns)));
  
  return {
    data: data.map(d => d.lender),
    newColumns: allNewColumns
  };
}

export async function processPdfFile(file: File): Promise<{
  data: ExtractedLenderData[];
  newColumns: string[];
}> {
  // In a real implementation, you would use a PDF parsing library like pdf-parse
  // For now, we'll use the AI extraction as a fallback
  const text = await file.text();
  return extractLenderDataFromText(text, 'PDF');
}

export async function processWordFile(file: File): Promise<{
  data: ExtractedLenderData[];
  newColumns: string[];
}> {
  // In a real implementation, you would use a Word parsing library like mammoth
  // For now, we'll use the AI extraction as a fallback
  const text = await file.text();
  return extractLenderDataFromText(text, 'Word document');
}
