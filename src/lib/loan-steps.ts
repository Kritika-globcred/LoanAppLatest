
export interface LoanStep {
  path: string;
  name: string;
  subStepPaths?: string[]; // To help progress bar highlight parent
}

export const loanAppSteps: LoanStep[] = [
  { path: '/loan-application/mobile', name: 'Mobile Verification' },
  { path: '/loan-application/admission-kyc', name: 'Admission KYC' },
  { path: '/loan-application/personal-kyc', name: 'Personal KYC', subStepPaths: ['/loan-application/review-personal-kyc'] },
  { path: '/loan-application/academic-kyc', name: 'Academic KYC', subStepPaths: ['/loan-application/review-academic-kyc'] },
  { 
    path: '/loan-application/professional-kyc', // This will now be Co-Signatory KYC
    name: 'Professional KYC', 
    subStepPaths: [
      '/loan-application/work-employment-kyc', 
      '/loan-application/review-professional-kyc'
    ] 
  },
  // Example future steps:
  // { path: '/loan-application/financials', name: 'Financials' },
  // { path: '/loan-application/summary', name: 'Application Summary' },
];
