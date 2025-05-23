import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

const isClient = typeof window !== 'undefined';

// Initialize Firebase
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    if (isClient) {
      // Client-side initialization
      authInstance = getAuth(app);
      
      // Client-side initialization
      dbInstance = getFirestore(app);
      
      storageInstance = getStorage(app);
      
      // Only connect to emulators if explicitly enabled in environment variables
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
        console.log('Using Firebase Emulators');
        const authPort = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || '9099';
        const firestorePort = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080';
        const storagePort = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT || '9199';
        
        try {
          connectAuthEmulator(authInstance, `http://localhost:${authPort}`);
          connectFirestoreEmulator(dbInstance, 'localhost', parseInt(firestorePort, 10));
          connectStorageEmulator(storageInstance, 'localhost', parseInt(storagePort, 10));
          console.log('Firebase emulators connected successfully');
        } catch (error) {
          console.error('Failed to connect to Firebase emulators:', error);
          // Continue with production if emulator connection fails
        }
      }
    } else {
      // Server-side initialization
      dbInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    }
  } else {
    app = getApps()[0];
    if (isClient) {
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
      storageInstance = getStorage(app);
    } else {
      dbInstance = getFirestore(app);
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Export a function that ensures we always have an auth instance
export function getAuthInstance(): Auth | null {
  if (isClient && !authInstance && app) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

// Export a function to get Firestore instance
export function getDbInstance(): Firestore {
  if (!dbInstance && app) {
    dbInstance = isClient ? getFirestore(app) : initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }
  if (!dbInstance) throw new Error('Firestore not initialized');
  return dbInstance;
}

// Export a function to get Storage instance
export function getStorageInstance(): FirebaseStorage | null {
  if (isClient && !storageInstance && app) {
    storageInstance = getStorage(app);
  }
  return storageInstance;
}

// Export the db instance (lazy-loaded)
let _db: Firestore | null = null;
export function db(): Firestore {
  if (!_db) {
    _db = getDbInstance();
  }
  return _db;
}

// Export the auth instance (lazy-loaded, client-side only)
let _auth: Auth | null = null;
export function auth(): Auth | null {
  if (isClient && !_auth) {
    _auth = getAuthInstance();
  }
  return _auth;
}

// Export the storage instance (lazy-loaded, client-side only)
let _storage: FirebaseStorage | null = null;
export function storage(): FirebaseStorage | null {
  if (isClient && !_storage) {
    _storage = getStorageInstance();
  }
  return _storage;
}

// Export the app instance
export const firebaseApp = app;
