import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';

// Database names
export const DB_NAMES = {
  DEFAULT: '(default)',
  LENDERS: 'lenders',
  UNIVERSITIES: 'universities',
  CUSTOMERS: 'customers'
} as const;

type DatabaseName = typeof DB_NAMES[keyof typeof DB_NAMES];

// Store database instances
const dbInstances: Partial<Record<DatabaseName, Firestore>> = {};

/**
 * Get a Firestore instance for a specific database
 * @param dbName Name of the database (must be created in Firebase Console first)
 * @returns Firestore instance
 */
export function getDatabase(dbName: DatabaseName = DB_NAMES.DEFAULT): Firestore {
  // Return cached instance if available
  if (dbInstances[dbName]) {
    return dbInstances[dbName]!;
  }

  // Get or initialize Firebase app
  const app = getApps().length === 0 ? initializeApp({}) : getApp();
  
  // Initialize Firestore with specific settings
  const db = initializeFirestore(app, {
    experimentalForceLongPolling: false,
    ignoreUndefinedProperties: true,
  }, dbName);
  
  console.log(`Initialized Firestore for database: ${dbName}`);
  
  // Cache the instance
  dbInstances[dbName] = db;
  
  return db;
}

// Export individual database getters for convenience
export const getDefaultDb = () => getDatabase(DB_NAMES.DEFAULT);
export const getLendersDb = () => getDatabase(DB_NAMES.LENDERS);
export const getUniversitiesDb = () => getDatabase(DB_NAMES.UNIVERSITIES);
export const getCustomersDb = () => getDatabase(DB_NAMES.CUSTOMERS);
