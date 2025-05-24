import { initializeApp, cert, type ServiceAccount, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only once
let adminInitialized = false;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;

export const initializeFirebaseAdmin = () => {
  if (adminInitialized) return;
  
  // Check if we're running in a server environment
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin should only be initialized on the server side');
  }

  // Check if already initialized
  if (getApps().length > 0) {
    adminInitialized = true;
    return;
  }

  // Check if environment variables are set
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || 
      !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
      !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    throw new Error('Missing Firebase Admin environment variables');
  }

  try {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    // Initialize the Firebase Admin SDK
    const app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
    });

    // Initialize Firestore
    firestoreInstance = getFirestore(app);
    
    adminInitialized = true;
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
};

// Export initialized auth instance
export const getAdminAuth = () => {
  if (!adminInitialized) {
    initializeFirebaseAdmin();
  }
  return getAuth();
};

// Export Firestore instance
export const getAdminFirestore = () => {
  if (!adminInitialized) {
    initializeFirebaseAdmin();
  }
  if (!firestoreInstance) {
    throw new Error('Firestore not initialized');
  }
  return firestoreInstance;
};

// Export other admin services as needed
export * from 'firebase-admin/auth';
