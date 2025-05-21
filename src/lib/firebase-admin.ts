import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin only once
let adminInitialized = false;

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
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
    });

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

// Export other admin services as needed
export * from 'firebase-admin/auth';
