export interface Country {
  code: string;
  name: string;
}

export interface University {
  id?: string;
  name: string;
  shortName: string;
  countries: string[]; // Array of country codes
  country: string; // Legacy field for backward compatibility
  city: string;
  address: string;
  website: string;
  email: string;
  phone: string;
  logoUrl?: string;
  isActive: boolean;
  tags?: string[]; // For additional categorization
  metadata?: Record<string, any>; // For any additional fields
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
