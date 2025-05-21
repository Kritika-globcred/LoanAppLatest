export interface Lender {
  id?: string;
  name: string;
  description: string;
  interestRate: number;
  maxLoanAmount: number;
  minCreditScore: number;
  logoUrl?: string;
  website?: string;
  contactEmail: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LenderFormData = Omit<Lender, 'id' | 'createdAt' | 'updatedAt'>;
