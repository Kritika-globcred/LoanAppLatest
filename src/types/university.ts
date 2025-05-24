export interface Country {
  code: string;
  name: string;
}

export interface University {
  // Basic Information
  id?: string;
  name: string;
  shortName: string;
  alternativeNames?: string[];
  
  // Location
  countries: string[]; // Array of country codes (ISO 3166-1 alpha-2)
  country: string; // Primary country code (ISO 3166-1 alpha-2)
  region?: string; // Region/state/province
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
  
  // Academic Information
  type?: 'public' | 'private' | 'for-profit' | 'non-profit';
  establishedYear?: number;
  academicCalendar?: string; // e.g., 'Semester', 'Quarter', 'Trimester'
  campusSetting?: 'urban' | 'suburban' | 'rural' | 'online';
  
  // Rankings
  qsRanking?: number;
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
  
  // Programs
  programs?: {
    level: 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate';
    name: string;
    duration: number; // in years
    field: string;
    language: string;
    tuition?: number;
  }[];
  
  // Admission Requirements
  admissionRequirements?: {
    level: 'bachelor' | 'master' | 'phd';
    ielts?: number;
    toefl?: number;
    pte?: number;
    gre?: number;
    gmat?: number;
    gpa?: number;
    otherRequirements?: string;
  }[];
  
  // Media
  logoUrl?: string;
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
  dataSource?: 'manual' | 'qs' | 'university_website' | 'other';
  tags?: string[]; // For additional categorization
  notes?: string; // For internal use
  
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
