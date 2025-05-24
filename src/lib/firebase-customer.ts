import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');

// Initialize the admin app if it doesn't exist
let adminApp;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
  }, 'customer-db');
} else {
  adminApp = getApps().find(app => app.name === 'customer-db') || getApps()[0];
}

// Get Firestore instance with the customer database
const customerDb = getFirestore(adminApp);

// Set the database ID
// @ts-ignore - This is a workaround to set the database ID
customerDb._databaseId = { databaseId: 'customer' };

export { customerDb as db };
