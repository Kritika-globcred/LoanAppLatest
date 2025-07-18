import { initializeApp, cert, type ServiceAccount, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only once
let adminInitialized = false;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

// Export the initialization function
export const initializeFirebaseAdmin = () => {
  if (adminInitialized) return;
  
  // Check if we're running in a server environment
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin should only be initialized on the server side');
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
    const app = getApps().length === 0 
      ? initializeApp({
          credential: cert(serviceAccount),
          databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
        }, 'admin')
      : getApp('admin');

    // Initialize Firestore and Auth
    firestoreInstance = getFirestore(app);
    authInstance = getAuth(app);
    
    adminInitialized = true;
    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error(`Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Export initialized auth instance
export const getAdminAuth = () => {
  if (!adminInitialized) {
    initializeFirebaseAdmin();
  }
  if (!authInstance) {
    throw new Error('Auth not initialized');
  }
  return authInstance;
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
