import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator, GoogleAuthProvider, User } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator, 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Client-side Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
const auth = getAuth(app);

// Initialize Firestore with explicit database name
const db = getFirestore(app, 'customer');

// Export the Firestore instance
export const getDbInstance = () => db;

// Helper function to get customers collection reference
export const getCustomersCollection = () => collection(db, 'customer');

// Function to fetch all customers
export const getAllCustomers = async () => {
  try {
    const querySnapshot = await getDocs(getCustomersCollection());
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Function to fetch a single customer by ID
export const getCustomerById = async (customerId: string) => {
  try {
    const customersRef = getCustomersCollection();
    const q = query(customersRef, where('__name__', '==', customerId), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  } catch (error) {
    console.error('Error getting customer by ID:', error);
    throw error;
  }
};

const storage = getStorage(app);

// Export the storage instance
export const getStorageInstance = () => storage;

// Set up emulators in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  // Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099');
  
  // Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199);
  
  console.log('Firebase emulators connected');
}

// Export a function to get the auth instance (client-side only)
export const getAuthInstance = (): Auth => {
  if (typeof window === 'undefined') {
    throw new Error('Auth is not available on the server side');
  }
  return auth;
};

// Helper function to safely get error information
export const getErrorInfo = (error: unknown): { message: string; code: string; stack?: string } => {
  if (error instanceof Error) {
    // Type assertion to handle errors that might have a code property
    const errorWithCode = error as Error & { code?: string };
    return {
      message: error.message,
      code: errorWithCode.code || 'unknown',
      stack: error.stack
    };
  }
  return {
    message: 'An unknown error occurred',
    code: 'unknown'
  };
};
