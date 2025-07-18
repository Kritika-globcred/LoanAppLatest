import { University } from '@/types/university';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface CSVUniversityData {
  name: string;
  website?: string;
  country?: string;
  [key: string]: any;
}

export async function enrichUniversityData(university: CSVUniversityData): Promise<Partial<University>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
  const prompt = `You are an AI assistant that helps enrich university data. 
  Given the following university information, provide additional details in JSON format.
  
  University: ${university.name}
  Website: ${university.website || 'Not provided'}
  Country: ${university.country || 'Not provided'}
  
  Return a JSON object with the following structure:
  {
    "alternativeNames": ["array of alternative names or abbreviations"],
    "shortName": "abbreviated name (3-5 letters)",
    "establishedYear": number,
    "type": "public|private|for-profit|non-profit",
    "campusSetting": "urban|suburban|rural|online",
    "qsRanking": number,
    "qsRankingYear": number,
    "timesRanking": number,
    "timesRankingYear": number,
    "totalStudents": number,
    "internationalStudents": number,
    "studentFacultyRatio": number,
    "description": "brief description (1-2 paragraphs)",
    "academicCalendar": "Semester|Quarter|Trimester",
    "notablePrograms": ["list of 3-5 notable programs"],
    "admissionRequirements": {
      "bachelor": {
        "ielts": number,
        "toefl": number,
        "gpa": number
      },
      "master": {
        "ielts": number,
        "toefl": number,
        "gpa": number,
        "gre": number,
        "gmat": number
      }
    }
  }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const enrichedData = JSON.parse(jsonStr);

    return {
      name: university.name,
      shortName: enrichedData.shortName || university.name.substring(0, 5).toUpperCase(),
      alternativeNames: enrichedData.alternativeNames || [],
      country: university.country || '',
      countries: university.country ? [university.country] : [],
      website: university.website || '',
      establishedYear: enrichedData.establishedYear,
      type: enrichedData.type,
      campusSetting: enrichedData.campusSetting,
      qsRanking: enrichedData.qsRanking,
      qsRankingYear: enrichedData.qsRankingYear,
      timesRanking: enrichedData.timesRanking,
      timesRankingYear: enrichedData.timesRankingYear,
      totalStudents: enrichedData.totalStudents,
      internationalStudents: enrichedData.internationalStudents,
      studentFacultyRatio: enrichedData.studentFacultyRatio,
      academicCalendar: enrichedData.academicCalendar,
      notes: enrichedData.description,
      programs: enrichedData.notablePrograms?.map((program: string) => ({
        name: program,
        level: program.toLowerCase().includes('bachelor') ? 'bachelor' : 
               program.toLowerCase().includes('master') ? 'master' :
               program.toLowerCase().includes('phd') || program.toLowerCase().includes('doctorate') ? 'phd' : 'certificate',
        duration: program.toLowerCase().includes('bachelor') ? 4 : 
                program.toLowerCase().includes('master') ? 2 :
                program.toLowerCase().includes('phd') || program.toLowerCase().includes('doctorate') ? 4 : 1,
        field: program.split(' ')[0],
        language: 'English'
      })),
      admissionRequirements: [
        {
          level: 'bachelor',
          ielts: enrichedData.admissionRequirements?.bachelor?.ielts,
          toefl: enrichedData.admissionRequirements?.bachelor?.toefl,
          gpa: enrichedData.admissionRequirements?.bachelor?.gpa
        },
        {
          level: 'master',
          ielts: enrichedData.admissionRequirements?.master?.ielts,
          toefl: enrichedData.admissionRequirements?.master?.toefl,
          gpa: enrichedData.admissionRequirements?.master?.gpa,
          gre: enrichedData.admissionRequirements?.master?.gre,
          gmat: enrichedData.admissionRequirements?.master?.gmat
        }
      ],
      dataSource: 'qs',
      lastVerified: new Date().toISOString(),
      isActive: true
    };
  } catch (error) {
    console.error('Error enriching university data:', error);
    // Return basic data if enrichment fails
    return {
      name: university.name,
      shortName: university.name.substring(0, 5).toUpperCase(),
      countries: university.country ? [university.country] : [],
      country: university.country || '',
      website: university.website || '',
      isActive: true,
      dataSource: 'manual',
      lastVerified: new Date().toISOString()
    };
  }
}

export async function processCSVData(csvData: string): Promise<Partial<University>[]> {
  // Simple CSV parser (you might want to use a library like 'csv-parse' for production)
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const universities: Partial<University>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Enrich data with AI
    const enrichedData = await enrichUniversityData(row);
    universities.push(enrichedData);
  }
  
  return universities;
}
