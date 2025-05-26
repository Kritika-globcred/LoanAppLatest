import { getFirestore } from 'firebase/firestore';
import { collection, query, getDocs, where, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

// Initialize Firestore
export const db = getFirestore(app);

export interface DocumentInfo {
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  url: string;
  name: string;
  submittedAt: Timestamp | Date;
  size?: number;
  contentType?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ApplicationInfo {
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  lastStepCompleted?: string;
  submittedAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  loanAmount?: number;
  loanPurpose?: string;
  loanTerm?: number;
}

export interface Customer {
  id: string;
  personalInfo: PersonalInfo;
  application: ApplicationInfo;
  documents: {
    submitted: DocumentInfo[];
  };
  recommendations?: string[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  userId: string; // Link to Firebase Auth user ID
}

const CUSTOMERS_COLLECTION = 'customer';

export const getCustomer = async (customerId: string): Promise<Customer | null> => {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Customer;
    }
    return null;
  } catch (error) {
    console.error('Error getting customer:', error);
    throw new Error('Failed to fetch customer');
  }
};

export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('Fetching customers from collection:', CUSTOMERS_COLLECTION);
    const q = query(collection(db, CUSTOMERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.docs.length} documents in collection '${CUSTOMERS_COLLECTION}'`);
    
    const customers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Document data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...data,
        personalInfo: data.personalInfo || {},
        documents: data.documents || { submitted: [] },
        application: data.application || { status: 'draft' },
      };
    });
    
    return customers as Customer[];
  } catch (error) {
    console.error('Error getting customers:', error);
    throw new Error('Failed to fetch customers');
  }
};

export const updateCustomer = async (customerId: string, updates: Partial<Customer>): Promise<void> => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(customerRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const customerRef = doc(collection(db, CUSTOMERS_COLLECTION));
    
    await setDoc(customerRef, {
      ...customerData,
      createdAt: now,
      updatedAt: now,
    });
    
    return customerRef.id;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
};
