import { Timestamp } from 'firebase/firestore';

export interface University {
  id?: string;
  name: string;
  country: string;
  qsRanking?: number;
  theRanking?: number;
  acceptanceRate?: number;
  popularCourses: string[];
  averageFees: {
    undergraduate?: number;
    postgraduate?: number;
    phd?: number;
    currency: string;
  };
  website?: string;
  description?: string;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Course {
  id?: string;
  universityId: string;
  name: string;
  level: 'undergraduate' | 'postgraduate' | 'phd' | 'diploma' | 'certificate';
  duration: {
    value: number;
    unit: 'months' | 'years';
  };
  fees: {
    amount: number;
    currency: string;
    per: 'year' | 'semester' | 'total';
  };
  intakeMonths: string[];
  requirements: {
    ielts?: number;
    toefl?: number;
    gre?: number;
    gmat?: number;
    academicPercentage?: number;
    workExperience?: number; // in years
  };
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Lender {
  id?: string;
  name: string;
  logoUrl?: string;
  website: string;
  description: string;
  interestRates: {
    min: number;
    max: number;
    type: 'fixed' | 'variable';
    repaymentPeriod: {
      min: number; // in months
      max: number; // in months
    };
  };
  eligibilityCriteria: {
    minCreditScore?: number;
    minIncome?: number;
    employmentTypes: string[]; // e.g., ['salaried', 'self-employed', 'student']
    coSignerRequired: boolean;
    coSignerCriteria?: string;
  };
  loanAmount: {
    min: number;
    max: number;
    currency: string;
  };
  processingFees: {
    type: 'percentage' | 'fixed';
    value: number;
    min?: number;
    max?: number;
  };
  prepaymentPenalty?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  documentsRequired: string[];
  benefits: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LenderUniversityMapping {
  id?: string;
  lenderId: string;
  universityId: string;
  specialTerms?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
