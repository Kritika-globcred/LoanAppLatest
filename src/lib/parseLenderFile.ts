import { Lender } from '@/types/lender';

export interface ParseResult {
  data: Partial<Lender>[];
  newColumns: string[];
  errors: Array<{ row: number; error: string }>;
}

export async function parseLenderFile(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    data: [],
    newColumns: [],
    errors: [],
  };

  try {
    const fileType = file.type;
    const fileContent = await readFileAsText(file);

    if (fileType === 'text/csv') {
      return await parseCsvFile(fileContent);
    } else if (fileType === 'application/json') {
      return await parseJsonFile(fileContent);
    } else if (fileType === 'text/plain') {
      return await parseTextFile(fileContent);
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'Failed to parse file',
    });
    return result;
  }
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function parseCsvFile(content: string): Promise<ParseResult> {
  const result: ParseResult = {
    data: [],
    newColumns: [],
    errors: [],
  };

  try {
    const Papa = (await import('papaparse')).default;
    const { data, errors } = await new Promise<any>((resolve) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results),
        error: (error: any) => {
          throw new Error(error.message || 'Failed to parse CSV');
        },
      });
    });

    if (data && data.length > 0) {
      // Build a flexible header map: lowercased, no spaces/underscores
      const headerMap: Record<string, string> = {};
      const canonicalHeaders: Record<string, string[]> = {
        fundedUniversities: ['funded universities', 'list of funded universities', 'universities funded', 'universitiesfunded', 'funded_universities'],
        fundedCourses: ['funded courses', 'list of funded courses', 'courses funded', 'coursesfunded', 'funded_courses'],
        loanType: ['loan type', 'loantype', 'type of loan'],
        coSignerStatus: ['co-signer status', 'cosignerstatus', 'co-signer', 'cosigner'],
        rateOfInterest: ['rate of interest', 'rateofinterest', 'roi'],
        loanCurrency: ['loan currency', 'loancurrency', 'currency'],
        tuitionFeesCovered: ['tuition fees covered', 'tuitionfeescovered', 'tuition fees', 'fees covered'],
        selfContributionFunding: ['self contribution / deposit funding', 'self contribution funding', 'deposit funding', 'selfcontributionfunding'],
        livingExpensesCovered: ['living expenses covered', 'livingexpensescovered', 'living expenses'],
        tatForSanctionLetter: ['tat for sanction letter', 'tatforsanctionletter', 'sanction tat', 'sanction letter tat'],
        name: ['lender name', 'name', 'lendername'],
        logoUrl: ['logo', 'logo url', 'logourl', 'logo_url', 'logoimage', 'image'],
        lenderType: ['lender type', 'type', 'lendertype'],
        baseCountry: ['base country', 'country', 'basecountry'],
        targetNationalities: ['target nationalities', 'targetnationalities', 'target nationality', 'targetnationality', 'countries', 'nationalities'],
        countries: ['target nationalities', 'targetnationalities', 'target nationality', 'targetnationality', 'countries', 'nationalities'],
        bankType: ['type of bank', 'bank type', 'banktype'],
        maxLoanAmountIndia: ['max loan (india)', 'maxloanindia', 'max loan india'],
        maxLoanAmountAbroad: ['max loan (abroad)', 'maxloanabroad', 'max loan abroad'],
        loanBrandName: ['loan brand name', 'brand name', 'loanbrandname', 'brand'],
        description: ['description', 'desc'],
        website: ['website', 'site', 'web'],
        contactEmail: ['contact email', 'email', 'contactemail'],
        contactPhone: ['contact phone', 'phone', 'contactphone', 'mobile'],
        isActive: ['isactive', 'active', 'enabled'],
        interestRate: ['interest rates', 'interest rate', 'interestrate', 'rates'],
        minCreditScore: ['credit score of co-applicant', 'min credit score', 'mincreditscore', 'creditscore'],
        createdAt: ['created at', 'createdat'],
        updatedAt: ['updated at', 'updatedat'],
        // Criteria fields
        minimumAcademicScore: ['minimum academic score', 'min academic score', 'minimumacademicscore'],
        admissionRequirement: ['admission requirement', 'admissionrequirement'],
        eligibleCourses: ['eligible courses', 'eligiblecourses', 'courses'],
        recognizedUniversities: ['recognized universities', 'recognizeduniversities', 'universities'],
        coApplicantRequired: ['co-applicant required', 'coapplicantrequired', 'co-applicant', 'coapplicant'],
        creditScoreRequirement: ['credit score of co-applicant', 'creditscorerequirement', 'credit score'],
        collateralRequired: ['collateral requirement', 'collateralrequired', 'collateral'],
        acceptedCollateralTypes: ['accepted collateral types', 'acceptedcollateraltypes', 'collateral types'],
        incomeProofRequired: ['income proof of co-applicant', 'incomeproofrequired', 'income proof'],
        moratoriumPeriod: ['moratorium period', 'moratorium'],
        processingTime: ['loan processing time', 'processing time', 'processingtime'],
        interestRates: ['interest rates', 'interest rate', 'interestrates'],
        prepaymentCharges: ['prepayment charges', 'prepayment'],
        loanLimitNoCollateral: ['loan limit (no collateral)', 'loanlimitnocollateral', 'loan limit no collateral'],
        loanLimitWithCollateral: ['loan limit (with collateral)', 'loanlimitwithcollateral', 'loan limit with collateral'],
        easeOfApproval: ['ease of approval', 'easeofapproval'],
      };
      // Build header map from actual CSV headers
      if (data.length > 0) {
        Object.keys(data[0]).forEach((header) => {
          const norm = header.toLowerCase().replace(/\s|_/g, '');
          Object.entries(canonicalHeaders).forEach(([key, variants]) => {
            if (variants.some(v => norm === v.replace(/\s|_/g, ''))) {
              headerMap[key] = header;
            }
          });
        });
      }
      // Helper to get value by canonical key
      const getVal = (row: any, key: string) => row[headerMap[key]] ?? row[key] ?? '';
      // Helper to parse arrays
      const parseArray = (val: string) => val ? val.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
      // Helper to parse booleans
      const parseBool = (val: string) => val && (val.toLowerCase() === 'yes' || val.toLowerCase() === 'true');

      result.data = data.map((row: any, index: number) => {
        try {
          // Helper for ALL or array (supports multiline, numbered, comma/newline/semicolon separated)
          const parseAllOrArray = (val: string) => {
            if (!val) return [];
            if (val.trim().toUpperCase() === 'ALL') return 'ALL';
            // Split on comma, semicolon, or newline
            let items = val.split(/,|;|\n/).map(x => x.trim()).filter(Boolean);
            // Remove leading numbers and dots (e.g. '1.', '2 ')
            items = items.map(x => x.replace(/^\d+\.?\s*/, '').trim());
            return items;
          };
          return {
            name: getVal(row, 'name') || `Lender ${index + 1}`,
            logoUrl: getVal(row, 'logoUrl'),
            fundedUniversities: parseAllOrArray(getVal(row, 'fundedUniversities')),
            fundedCourses: parseAllOrArray(getVal(row, 'fundedCourses')),
            loanType: getVal(row, 'loanType'),
            coSignerStatus: getVal(row, 'coSignerStatus'),
            rateOfInterest: getVal(row, 'rateOfInterest'),
            loanCurrency: getVal(row, 'loanCurrency'),
            tuitionFeesCovered: getVal(row, 'tuitionFeesCovered'),
            selfContributionFunding: getVal(row, 'selfContributionFunding'),
            livingExpensesCovered: getVal(row, 'livingExpensesCovered'),
            tatForSanctionLetter: getVal(row, 'tatForSanctionLetter'),
            lenderType: getVal(row, 'lenderType'),
            baseCountry: getVal(row, 'baseCountry'),
            targetNationalities: parseArray(getVal(row, 'targetNationalities')),
            countries: parseAllOrArray(getVal(row, 'countries')),
            bankType: getVal(row, 'bankType'),
            maxLoanAmountIndia: getVal(row, 'maxLoanAmountIndia'),
            maxLoanAmountAbroad: getVal(row, 'maxLoanAmountAbroad'),
            loanBrandName: getVal(row, 'loanBrandName'),
            description: getVal(row, 'description'),
            website: getVal(row, 'website'),
            contactEmail: getVal(row, 'contactEmail'),
            contactPhone: getVal(row, 'contactPhone'),
            isActive: getVal(row, 'isActive') !== 'false',
            interestRate: parseFloat(getVal(row, 'interestRate') || '0') || 0,
            minCreditScore: parseInt(getVal(row, 'minCreditScore') || '0') || 0,
            createdAt: getVal(row, 'createdAt') || undefined,
            updatedAt: getVal(row, 'updatedAt') || undefined,
            criteria: {
              minimumAcademicScore: getVal(row, 'minimumAcademicScore'),
              admissionRequirement: getVal(row, 'admissionRequirement'),
              eligibleCourses: parseArray(getVal(row, 'eligibleCourses')),
              recognizedUniversities: parseArray(getVal(row, 'recognizedUniversities')),
              coApplicantRequired: parseBool(getVal(row, 'coApplicantRequired')),
              creditScoreRequirement: getVal(row, 'creditScoreRequirement'),
              collateralRequired: parseBool(getVal(row, 'collateralRequired')),
              collateralDetails: {
                acceptedTypes: parseArray(getVal(row, 'acceptedCollateralTypes')),
              },
              incomeProofRequired: parseArray(getVal(row, 'incomeProofRequired')),
              moratoriumPeriod: getVal(row, 'moratoriumPeriod'),
              processingTime: getVal(row, 'processingTime'),
              interestRates: getVal(row, 'interestRates'),
              prepaymentCharges: getVal(row, 'prepaymentCharges'),
              loanLimits: {
                withoutCollateral: getVal(row, 'loanLimitNoCollateral'),
                withCollateral: getVal(row, 'loanLimitWithCollateral'),
              },
              easeOfApproval: getVal(row, 'easeOfApproval'),
            },
          };
        } catch (error) {
          result.errors.push({
            row: index + 1,
            error: 'Invalid row format',
          });
          return null;
        }
      }).filter(Boolean);
    }

    if (errors && errors.length > 0) {
      result.errors.push(...errors.map((error: any) => ({
        row: error.row,
        error: error.message || 'CSV parsing error',
      })));
    }
  } catch (error) {
    console.error('Error parsing CSV:', error);
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'Failed to parse CSV',
    });
  }

  return result;
}

async function parseJsonFile(content: string): Promise<ParseResult> {
  const result: ParseResult = {
    data: [],
    newColumns: [],
    errors: [],
  };

  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      result.data = data.map((item: any) => ({
        name: item.name || 'Unnamed Lender',
        description: item.description || '',
        logoUrl: item.logoUrl || '',
        website: item.website || '',
        contactEmail: item.contactEmail || '',
        contactPhone: item.contactPhone || '',
        isActive: item.isActive !== false,
        interestRate: Number(item.interestRate) || 0,
        maxLoanAmount: Number(item.maxLoanAmount) || 0,
        minCreditScore: Number(item.minCreditScore) || 0,
        countries: Array.isArray(item.countries) ? item.countries : [],
      }));
    } else {
      throw new Error('JSON file should contain an array of lenders');
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'Invalid JSON format',
    });
  }

  return result;
}

async function parseTextFile(content: string): Promise<ParseResult> {
  const result: ParseResult = {
    data: [],
    newColumns: [],
    errors: [],
  };

  try {
    // Simple text format: one lender per line, comma-separated values
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    result.data = lines.map((line, index) => {
      const [name, email, phone] = line.split(',').map(item => item.trim());
      return {
        name: name || `Lender ${index + 1}`,
        contactEmail: email || '',
        contactPhone: phone || '',
        isActive: true,
        interestRate: 0,
        maxLoanAmount: 0,
        minCreditScore: 0,
        countries: [],
      };
    });
  } catch (error) {
    console.error('Error parsing text file:', error);
    result.errors.push({
      row: 0,
      error: 'Failed to parse text file',
    });
  }

  return result;
}
