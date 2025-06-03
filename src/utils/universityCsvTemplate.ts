import { University, Course } from "@/types/university";

export const generateUniversityCsvTemplate = (): string => {
  const headers = [
    'University / College Name',
    'Country',
    'Fees Currency',
    'Fees in Destination Currency',
    'Fees - INR',
    'INR - Self Contribution / Deposit',
    'Self Contribution / Deposit (Destination Currency)',
    'Scholarships',
    'TAT for University Offer',
    'Employability Success',
    'List of Course(s)'
  ];
  const exampleRow = [
    'Stanford University',
    'USA',
    'USD',
    '50000',
    '4100000',
    '1000000',
    '12000',
    'Upto 2000 USD',
    '7 Days',
    '85-95%',
    'Computer Science'
  ];
  return [headers.join(','), exampleRow.join(',')].join('\n');
};

export const downloadCsvTemplate = (): void => {
  const csvContent = generateUniversityCsvTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'university_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
