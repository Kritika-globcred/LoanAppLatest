export interface Country {
  code: string;
  name: string;
}

export interface Course {
  name: string;
  industry: string;
  startDate: string; // ISO date string
  applicationDeadline: string; // ISO date string
  roundOfApplication: string;
  gmatRequired: boolean;
  greRequired: boolean;
  gmatScore?: number;
  greScore?: number;
  courseFees: number;
  level: 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate';
  admissionFees: number;
  otherExpenses: {
    hostel: number;
    books: number;
    insurance: number;
    living: number;
    other: number;
  };
  duration: number; // in months
  language: string;
  intakeMonths: string[];
  scholarshipAvailable: boolean;
  scholarshipDetails?: string;
}

export interface University {
  // Basic Information
  id?: string;
  name: string;
  shortName: string;
  description: string;
  alternativeNames?: string[];

  /**
   * University-level fees (tuition or total cost per year, for recommendations)
   * Optional, number (can be in destination currency or INR as per your data model)
   */
  fees?: number;
  
  // Rankings & Stats
  qsRanking?: number;
  employabilityRate?: number; // percentage
  averagePlacement?: number; // in USD
  
  // Location
  countries: string[]; // Array of country codes (ISO 3166-1 alpha-2)
  country: string; // Primary country code (ISO 3166-1 alpha-2)
  region?: string; // Region/state/province
  state: string;
  city: string;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  
  // Contact Information
  website: string;
  email: string;
  phone: string;
  fax?: string;
  logoUrl?: string;
  
  // Academic Information
  type?: 'public' | 'private' | 'for-profit' | 'non-profit';
  establishedYear?: number;
  academicCalendar?: string; // e.g., 'Semester', 'Quarter', 'Trimester'
  campusSetting?: 'urban' | 'suburban' | 'rural' | 'online';
  
  // Rankings (additional)
  qsRankingYear?: number;
  timesRanking?: number;
  timesRankingYear?: number;
  nationalRanking?: number;
  
  // Student Body
  totalStudents?: number;
  internationalStudents?: number;
  studentFacultyRatio?: number;
  
  // Financial
  tuitionLocal?: number;
  tuitionInternational?: number;
  financialAidAvailable?: boolean;
  
  // Programs & Courses
  courses: string;

  // Admin CSV/table fields
  currency?: string;
  feesDestinationCurrency?: string;
  feesINR?: string;
  inrSelfContributionDeposit?: string;
  selfContributionDepositDestinationCurrency?: string;
  scholarships?: string;
  tatForOffer?: string;
  employabilitySuccess?: string;

  // Admission Requirements
  admissionRequirements: {
    level: 'bachelor' | 'master' | 'phd';
    ielts?: {
      overall: number;
      writing?: number;
      speaking?: number;
      reading?: number;
      listening?: number;
    };
    toefl?: {
      overall: number;
      writing?: number;
      speaking?: number;
      reading?: number;
      listening?: number;
    };
    pte?: number;
    gre?: {
      overall: number;
      quant?: number;
      verbal?: number;
      awa?: number;
    };
    gmat?: {
      overall: number;
      quant?: number;
      verbal?: number;
      awa?: number;
      ir?: number;
    };
    gpa?: number;
    workExperience?: {
      required: boolean;
      years?: number;
    };
    otherRequirements?: string;
  }[];
  
  // Media
  imageUrls?: string[];
  videoTourUrl?: string;
  virtualTourUrl?: string;
  
  // Social Media
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  
  // Metadata
  isActive: boolean;
  lastVerified?: Date;
  dataSource?: 'manual' | 'qs' | 'university_website' | 'other' | 'ai_enrichment';
  tags?: string[]; // For additional categorization
  notes?: string; // For internal use
  _enrichmentError?: string; // For tracking enrichment errors
  _enrichmentFailed?: boolean; // Flag to indicate if enrichment failed
  
  // System
  createdAt?: Date;
  updatedAt?: Date;
}

export type UniversityFormData = Omit<University, 'id' | 'createdAt' | 'updatedAt' | 'countries' | 'metadata'> & {
  countries: string[];
  metadata?: Record<string, any>;
};

export interface BulkUploadResult {
  success: boolean;
  message: string;
  total: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

export interface BulkUploadTemplate {
  name: string;
  required: boolean;
  type: 'string' | 'email' | 'url' | 'phone' | 'boolean' | 'array';
  description: string;
  example: string;
}
