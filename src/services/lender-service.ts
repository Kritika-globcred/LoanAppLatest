import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch,
  Firestore
} from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { Lender, LenderCriteria, LenderUploadResult } from '@/types/lender';

const LENDERS_COLLECTION = 'lenders';

export const getLenders = async (): Promise<Lender[]> => {
  try {
    const db = getDbInstance();
    const q = query(collection(db, LENDERS_COLLECTION), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Lender[];
  } catch (error) {
    console.error('Error getting lenders:', error);
    throw error;
  }
};

export const getLenderById = async (id: string): Promise<Lender | null> => {
  try {
    const db = getDbInstance();
    const docRef = doc(db, LENDERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as Lender;
  } catch (error) {
    console.error('Error getting lender:', error);
    throw error;
  }
};

export const addLender = async (lender: Omit<Lender, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const db = getDbInstance();
    const docRef = await addDoc(collection(db, LENDERS_COLLECTION), {
      ...lender,
      isActive: lender.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding lender:', error);
    throw error;
  }
};

export const updateLender = async (id: string, lender: Partial<Lender>): Promise<void> => {
  try {
    const db = getDbInstance();
    await updateDoc(doc(db, LENDERS_COLLECTION, id), {
      ...lender,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating lender:', error);
    throw error;
  }
};

export const deleteLender = async (id: string): Promise<void> => {
  try {
    const db = getDbInstance();
    await deleteDoc(doc(db, LENDERS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting lender:', error);
    throw error;
  }
};

export const bulkUploadLenders = async (lendersData: any[]): Promise<LenderUploadResult> => {
  const result: LenderUploadResult = { success: 0, failed: 0, errors: [] };
  const now = new Date();

  try {
    const db = getDbInstance();
    
    // Process lenders in chunks to avoid batch size limits
    const chunkSize = 100;
    for (let i = 0; i < lendersData.length; i += chunkSize) {
      const chunk = lendersData.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      
      // Process each lender in the chunk
      for (let j = 0; j < chunk.length; j++) {
        const lenderData = chunk[j];
        const rowNumber = i + j + 1;
        
        try {
          // Map the uploaded data to the lender structure
          const lender: Omit<Lender, 'id' | 'createdAt' | 'updatedAt'> = {
            name: lenderData.name || `Lender ${rowNumber}`,
            description: lenderData.description || '',
            logoUrl: lenderData.logoUrl || '',
            website: lenderData.website || '',
            contactEmail: lenderData.contactEmail || '',
            contactPhone: lenderData.contactPhone || '',
            isActive: lenderData.isActive ?? true,
            interestRate: lenderData.interestRate,
            maxLoanAmount: lenderData.maxLoanAmount,
            minCreditScore: lenderData.minCreditScore,
            countries: Array.isArray(lenderData.countries) ? lenderData.countries : [],
            criteria: {
              minimumAcademicScore: '',
              admissionRequirement: '',
              eligibleCourses: [],
              recognizedUniversities: [],
              coApplicantRequired: false,
              creditScoreRequirement: lenderData.minCreditScore ? 
                `Minimum credit score of ${lenderData.minCreditScore}` : 'Varies',
              collateralRequired: false,
              collateralDetails: {
                threshold: '',
                acceptedTypes: []
              },
              incomeProofRequired: [],
              moratoriumPeriod: '',
              processingTime: '',
              interestRates: lenderData.interestRate ? 
                `${lenderData.interestRate}%` : 'Varies',
              prepaymentCharges: '',
              loanLimits: {
                withoutCollateral: lenderData.maxLoanAmount ? 
                  `Up to $${lenderData.maxLoanAmount.toLocaleString()}` : 'Varies',
              },
              easeOfApproval: ''
            },
            // Include any additional fields
            ...Object.fromEntries(
              Object.entries(lenderData).filter(
                ([key]) => ![
                  'name', 'description', 'logoUrl', 'website', 'contactEmail',
                  'contactPhone', 'isActive', 'interestRate', 'maxLoanAmount',
                  'minCreditScore', 'countries'
                ].includes(key)
              )
            )
          };
          
          // Add the lender to the batch
          const docRef = doc(collection(db, LENDERS_COLLECTION));
          batch.set(docRef, {
            ...lender,
            createdAt: now,
            updatedAt: now,
          });
          
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors = result.errors || [];
          result.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Commit the batch
      await batch.commit();
    }

    return result;
  } catch (error) {
    console.error('Error in bulk upload:', error);
    throw error;
  }
};

export const validateLenderData = (data: any): Omit<Lender, 'id' | 'createdAt' | 'updatedAt'> | null => {
  try {
    // Basic validation - in a real app, you'd want more comprehensive validation
    if (!data.name || !Array.isArray(data.countries) || data.countries.length === 0 || !data.criteria) {
      return null;
    }

    return {
      name: String(data.name),
      logoUrl: data.logoUrl ? String(data.logoUrl) : undefined,
      description: data.description ? String(data.description) : undefined,
      countries: Array.isArray(data.countries) ? data.countries.map(String) : [],
      criteria: {
        minimumAcademicScore: String(data.criteria.minimumAcademicScore || ''),
        admissionRequirement: String(data.criteria.admissionRequirement || ''),
        eligibleCourses: Array.isArray(data.criteria.eligibleCourses) 
          ? data.criteria.eligibleCourses.map(String) 
          : [],
        recognizedUniversities: Array.isArray(data.criteria.recognizedUniversities) 
          ? data.criteria.recognizedUniversities.map(String) 
          : [],
        coApplicantRequired: Boolean(data.criteria.coApplicantRequired),
        creditScoreRequirement: String(data.criteria.creditScoreRequirement || ''),
        collateralRequired: Boolean(data.criteria.collateralRequired),
        collateralDetails: {
          threshold: data.criteria.collateralDetails?.threshold 
            ? String(data.criteria.collateralDetails.threshold) 
            : undefined,
          acceptedTypes: Array.isArray(data.criteria.collateralDetails?.acceptedTypes)
            ? data.criteria.collateralDetails.acceptedTypes.map(String)
            : [],
        },
        incomeProofRequired: Array.isArray(data.criteria.incomeProofRequired)
          ? data.criteria.incomeProofRequired.map(String)
          : [],
        moratoriumPeriod: String(data.criteria.moratoriumPeriod || ''),
        processingTime: String(data.criteria.processingTime || ''),
        interestRates: String(data.criteria.interestRates || ''),
        prepaymentCharges: String(data.criteria.prepaymentCharges || ''),
        loanLimits: {
          withoutCollateral: data.criteria.loanLimits?.withoutCollateral 
            ? String(data.criteria.loanLimits.withoutCollateral) 
            : undefined,
          withCollateral: data.criteria.loanLimits?.withCollateral 
            ? String(data.criteria.loanLimits.withCollateral) 
            : undefined,
        },
        easeOfApproval: String(data.criteria.easeOfApproval || ''),
      },
      website: data.website ? String(data.website) : undefined,
      contactEmail: data.contactEmail ? String(data.contactEmail) : undefined,
      contactPhone: data.contactPhone ? String(data.contactPhone) : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    };
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
};
