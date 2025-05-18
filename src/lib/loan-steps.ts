
export interface LoanStep {
  path: string;
  name: string;
  subStepPaths?: string[]; // To help progress bar highlight parent
}

export const loanAppSteps: LoanStep[] = [
  { path: '/loan-application/mobile', name: 'Mobile Verification' },
  { path: '/loan-application/admission-kyc', name: 'Admission KYC' },
  { 
    path: '/loan-application/personal-kyc', 
    name: 'Personal KYC', 
    subStepPaths: ['/loan-application/review-personal-kyc'] 
  },
  { 
    path: '/loan-application/academic-kyc', 
    name: 'Academic KYC', 
    subStepPaths: ['/loan-application/review-academic-kyc'] 
  },
  {
    path: '/loan-application/professional-kyc',
    name: 'Professional KYC',
    subStepPaths: [
      '/loan-application/work-employment-kyc',
      '/loan-application/review-professional-kyc'
    ]
  },
  // Conditional Steps based on Offer Letter status
  { path: '/loan-application/preferences', name: 'Preferences' }, // For "No" Offer Letter flow
  { path: '/loan-application/lender-recommendations', name: 'Lender Recommendations' }, // For "Yes" Offer Letter flow
  { path: '/loan-application/final-summary', name: 'Final Summary' },
];

// Note: The progress bar will need intelligent logic to show the correct "next" step
// if the flow branches significantly. For now, all listed steps will appear if their path is matched.
// For a truly dynamic progress bar based on answers, the steps array itself might need to be
// dynamically constructed or filtered in the ProgressBar component based on localStorage flags.
// For simplicity here, Lender Recommendations and Preferences will both appear if their paths are hit,
// though only one will be relevant per user journey.
