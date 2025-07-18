import { initializeApp } from 'firebase/app';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const customerDb: Firestore = initializeFirestore(app, {}, 'customer');
const lendersDb: Firestore = initializeFirestore(app, {}, 'lenders');
const universityDb: Firestore = initializeFirestore(app, {}, 'university');

export function getDb(database: 'customer' | 'lenders' | 'university'): Firestore {
  if (database === 'customer') return customerDb;
  if (database === 'lenders') return lendersDb;
  if (database === 'university') return universityDb;
  throw new Error('Invalid database name');
}

// Minimal Auth support for client
const auth = getAuth(app);
export function getAuthInstance(): Auth {
  return auth;
}

// Minimal Storage support for client
let storage: FirebaseStorage | null = null;
export function getStorageInstance(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(app);
  }
  return storage;
}


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
