import { University, BulkUploadResult, BulkUploadTemplate } from '@/types/university';

export const universityUploadTemplate: BulkUploadTemplate[] = [
  {
    name: 'name',
    required: true,
    type: 'string',
    description: 'Full name of the university',
    example: 'Massachusetts Institute of Technology'
  },
  {
    name: 'shortName',
    required: true,
    type: 'string',
    description: 'Short name or abbreviation',
    example: 'MIT'
  },
  {
    name: 'countries',
    required: true,
    type: 'array',
    description: 'Comma-separated list of ISO country codes',
    example: 'US,CA,GB'
  },
  {
    name: 'city',
    required: true,
    type: 'string',
    description: 'City where the university is located',
    example: 'Cambridge'
  },
  {
    name: 'address',
    required: false,
    type: 'string',
    description: 'Full address',
    example: '77 Massachusetts Ave, Cambridge, MA 02139, USA'
  },
  {
    name: 'website',
    required: true,
    type: 'url',
    description: 'University website URL',
    example: 'https://web.mit.edu/'
  },
  {
    name: 'email',
    required: true,
    type: 'email',
    description: 'Contact email',
    example: 'admissions@mit.edu'
  },
  {
    name: 'phone',
    required: false,
    type: 'phone',
    description: 'Contact phone number',
    example: '+16172531000'
  },
  {
    name: 'isActive',
    required: false,
    type: 'boolean',
    description: 'Whether the university is active',
    example: 'true'
  },
  {
    name: 'tags',
    required: false,
    type: 'array',
    description: 'Comma-separated list of tags',
    example: 'engineering,research,ivy-league'
  }
];

export const validateUniversityRow = (row: any, index: number) => {
  const errors: string[] = [];
  const result: Partial<University> = {};

  // Required fields
  if (!row.name) errors.push('Name is required');
  if (!row.shortName) errors.push('Short name is required');
  if (!row.countries) errors.push('At least one country is required');
  if (!row.city) errors.push('City is required');
  if (!row.website) errors.push('Website is required');
  if (!row.email) errors.push('Email is required');

  // Format validation
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push('Invalid email format');
  }

  if (row.website && !/^https?:\/\//.test(row.website)) {
    errors.push('Website must start with http:// or https://');
  }

  // Process countries
  if (row.countries) {
    const countries = String(row.countries).split(',').map(c => c.trim().toUpperCase());
    result.countries = countries;
  }

  // Process tags if present
  if (row.tags) {
    result.tags = String(row.tags).split(',').map(t => t.trim().toLowerCase());
  }

  // Process boolean field
  if (row.isActive !== undefined) {
    result.isActive = String(row.isActive).toLowerCase() === 'true';
  }

  return {
    data: result,
    errors: errors.length > 0 ? errors : undefined,
    row: index + 2 // +2 for 1-based index and header row
  };
};

export const processBulkUpload = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<BulkUploadResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const result: BulkUploadResult = {
      success: true,
      message: '',
      total: 0,
      successCount: 0,
      failedCount: 0,
      errors: []
    };

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        
        if (rows.length < 2) {
          throw new Error('CSV must have at least one data row');
        }


        // Process header row
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        
        // Process data rows
        const universities: University[] = [];
        const errors: { row: number; error: string }[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const values = row.split(',').map(v => v.trim());
          const rowData: Record<string, string> = {};
          
          // Map values to headers
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          // Validate row
          const { data, errors: rowErrors, row: rowNumber } = validateUniversityRow(rowData, i);
          
          if (rowErrors) {
            errors.push(...rowErrors.map(error => ({ row: rowNumber, error })));
            result.failedCount++;
          } else {
            universities.push(data as University);
            result.successCount++;
          }

          // Update progress
          if (onProgress) {
            onProgress(Math.round((i / (rows.length - 1)) * 100));
          }
        }


        // Save to database (pseudo-code - implement your actual save logic)
        try {
          // TODO: Implement actual save to database
          // await saveUniversities(universities);
          
          result.total = rows.length - 1; // Exclude header
          result.errors = errors.length > 0 ? errors : undefined;
          result.success = errors.length === 0;
          result.message = `Successfully processed ${result.successCount} universities`;
          if (result.failedCount > 0) {
            result.message += `, ${result.failedCount} failed`;
          }
        } catch (error) {
          result.success = false;
          result.message = `Error saving universities: ${error.message}`;
        }
      } catch (error) {
        result.success = false;
        result.message = `Error processing file: ${error.message}`;
      } finally {
        resolve(result);
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        message: 'Error reading file',
        total: 0,
        successCount: 0,
        failedCount: 0
      });
    };

    reader.readAsText(file);
  });
};

export const generateBulkTemplate = (): string => {
  const headers = universityUploadTemplate.map(field => field.name);
  const exampleRow = universityUploadTemplate.map(field => field.example);
  return [headers.join(','), exampleRow.join(',')].join('\n');
};
