import { Timestamp } from 'firebase/firestore';

export interface DocumentInfo {
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  url: string;
  name: string;
  submittedAt: Timestamp | Date;
  size?: number;
  contentType?: string;
  reviewedAt?: Date;
}

export interface Customer {
  id: string;
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  application?: {
    status?: string;
    lastStepCompleted?: string;
    submittedAt?: Timestamp;
    updatedAt?: Timestamp;
  };
  documents?: {
    submitted?: DocumentInfo[];
  };
  recommendations?: string[];
  // Add any additional fields that might be present in your customer documents
  [key: string]: any;
}

// Type for the customer data we get from Firestore
export type FirestoreCustomer = Omit<Customer, 'id'> & { id: string };
