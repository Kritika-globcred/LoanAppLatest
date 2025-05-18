
export interface LoanStep {
  path: string;
  name: string;
}

export const loanAppSteps: LoanStep[] = [
  { path: '/loan-application/mobile', name: 'Mobile Verification' },
  { path: '/loan-application/admission-kyc', name: 'Admission KYC' },
  { path: '/loan-application/personal-kyc', name: 'Personal KYC' },
  { path: '/loan-application/academic-kyc', name: 'Academic KYC' },
  { path: '/loan-application/professional-kyc', name: 'Professional KYC' },
  // Example future steps:
  // { path: '/loan-application/financials', name: 'Financials' },
  // { path: '/loan-application/summary', name: 'Application Summary' },
];
