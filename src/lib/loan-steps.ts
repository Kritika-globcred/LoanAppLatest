
export type ApplicationType = 'loan' | 'study' | 'work';

export interface LoanStep {
  path: string;
  name: string;
  subStepPaths?: string[]; // To help progress bar highlight parent
  showForTypes?: ApplicationType[]; // Which application types should show this step
  requiresOfferLetter?: boolean; // Whether this step requires an offer letter
}

export const loanAppSteps: LoanStep[] = [
  { 
    path: '/loan-application/mobile', 
    name: 'Mobile Verification',
    showForTypes: ['loan', 'study', 'work']
  },
  { 
    path: '/loan-application/admission-kyc', 
    name: 'Admission KYC',
    showForTypes: ['loan'], // Only for loan applications
    requiresOfferLetter: true // Requires offer letter
  },
  {
    path: '/loan-application/personal-kyc',
    name: 'Personal KYC',
    subStepPaths: ['/loan-application/review-personal-kyc'],
    showForTypes: ['loan', 'study', 'work']
  },
  {
    path: '/loan-application/academic-kyc',
    name: 'Academic KYC',
    subStepPaths: ['/loan-application/review-academic-kyc'],
    showForTypes: ['loan', 'study', 'work']
  },
  {
    path: '/loan-application/professional-kyc',
    name: 'Professional KYC',
    subStepPaths: [
      '/loan-application/work-employment-kyc',
      '/loan-application/review-professional-kyc'
    ],
    showForTypes: ['loan', 'study', 'work']
  },
  // Conditional steps - Order here determines general visual flow in progress bar if all are shown
  { 
    path: '/loan-application/preferences', 
    name: 'Preferences',
    showForTypes: ['loan'], // Only for loan applications
    requiresOfferLetter: false // Only shown when no offer letter
  },
  { 
    path: '/loan-application/lender-recommendations', 
    name: 'Lender Recommendations',
    showForTypes: ['loan'], // Only for loan applications
    requiresOfferLetter: true // Only shown when offer letter is available
  },
  { 
    path: '/loan-application/final-summary', 
    name: 'Final Summary',
    showForTypes: ['loan', 'study', 'work']
  },
];
