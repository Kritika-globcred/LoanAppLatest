
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
  // Conditional steps - Order here determines general visual flow in progress bar if all are shown
  { path: '/loan-application/preferences', name: 'Preferences' }, // For "No Offer Letter" flow
  { path: '/loan-application/lender-recommendations', name: 'Lender Recommendations' }, // For "Yes Offer Letter" flow
  { path: '/loan-application/final-summary', name: 'Final Summary' },
];
