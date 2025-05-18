
// import { initializeApp, getApps } from "firebase/app";
// import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
// import { getStorage, ref, uploadBytesResumable, getDownloadURL, uploadString } from "firebase/storage";

// For this version, we'll use the modular SDK v9+
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL, 
  uploadString 
} from "firebase/storage";


// --- Firebase Configuration ---
let firebaseApp: FirebaseApp | null = null;
let db: any | null = null; // Using 'any' for Firestore to simplify for now
let storage: any | null = null; // Using 'any' for Storage

const getFirebaseConfig = () => {
  if (typeof window === "undefined") {
    // Running on the server, Firebase Admin SDK should be used if needed for server-side ops
    // For now, these client-side functions won't be called server-side without a user context
    return null;
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
};

export const initializeFirebaseClientSDK = () => {
  if (firebaseApp) return { firebaseApp, db, storage };

  const config = getFirebaseConfig();
  if (!config || !config.projectId) {
    console.error("Firebase config not found. Ensure .env.local is set up.");
    return { firebaseApp: null, db: null, storage: null };
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(config);
  } else {
    firebaseApp = getApps()[0];
  }
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
  return { firebaseApp, db, storage };
};

initializeFirebaseClientSDK(); // Initialize on load for client-side usage

// --- Interfaces ---
export interface UserApplicationData {
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  mobileNumber?: string;
  countryCode?: string; // e.g., +91
  countryShortName?: string; // e.g., IN
  hasOfferLetter?: boolean;
  admissionKyc?: {
    studentName?: string;
    universityName?: string;
    courseName?: string;
    admissionLevel?: string;
    admissionFees?: string;
    courseStartDate?: string;
    offerLetterType?: string;
    offerLetterUrl?: string; // Firebase Storage URL
    consentTimestamp?: string;
  };
  personalKyc?: {
    idDocumentType?: "PAN Card" | "National ID";
    idNumber?: string;
    idTypeFromDoc?: string;
    passportNumber?: string;
    mothersName?: string;
    fathersName?: string;
    passportExpiryDate?: string;
    passportIssueDate?: string;
    nameOnPassport?: string;
    countryOfUser?: string;
    dateOfBirth?: string;
    ageInYears?: string | number;
    permanentAddress?: string;
    idDocumentUrl?: string; // Firebase Storage URL
    passportUrl?: string; // Firebase Storage URL
    consentTimestamp?: string;
  };
  academicKyc?: any; // Define more specifically later
  professionalKyc?: any; // Define more specifically later
  preferences?: any; // Define more specifically later
  lenderRecommendations?: any; // Define more specifically later
  // ... other fields
}

const CUSTOMER_COLLECTION = 'customer'; // Using your specified collection name

/**
 * Saves or updates user application data in Firestore.
 * @param userId - The unique ID of the user.
 * @param data - The application data to save.
 * @returns Promise<{success: boolean, error?: string}>
 */
export async function saveUserApplicationData(userId: string, data: Partial<UserApplicationData>): Promise<{success: boolean, error?: string}> {
  if (!db) {
    initializeFirebaseClientSDK();
    if (!db) return { success: false, error: "Firestore not initialized." };
  }
  console.log(`[Firebase Service] Saving data for user ${userId} to collection '${CUSTOMER_COLLECTION}':`, data);
  try {
    const userDocRef = doc(db, CUSTOMER_COLLECTION, userId);
    const dataToSave = {
      ...data,
      userId, // ensure userId is part of the document data
      updatedAt: serverTimestamp(),
    };
    if (!(await getDoc(userDocRef)).exists()) {
      (dataToSave as UserApplicationData).createdAt = serverTimestamp();
    }
    await setDoc(userDocRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('[Firebase Service] Error saving user data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Retrieves user application data from Firestore.
 * @param userId - The unique ID of the user.
 * @returns Promise<{success: boolean, data?: UserApplicationData, error?: string}>
 */
export async function getUserApplicationData(userId: string): Promise<{success: boolean, data?: UserApplicationData, error?: string}> {
  if (!db) {
    initializeFirebaseClientSDK();
    if (!db) return { success: false, error: "Firestore not initialized." };
  }
  console.log(`[Firebase Service] Fetching data for user ${userId} from collection '${CUSTOMER_COLLECTION}'`);
  try {
    const docRef = doc(db, CUSTOMER_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() as UserApplicationData };
    } else {
      return { success: false, error: 'No application data found.' };
    }
  } catch (error) {
    console.error('[Firebase Service] Error fetching user data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Uploads a file (from a data URI or File object) to Firebase Storage.
 * @param userId - The user's ID, for path organization.
 * @param file - The File object or a data URI string.
 * @param documentPath - e.g., 'offer_letter.png', 'ids/pan_card.jpg'
 * @returns Promise<{success: boolean, downloadURL?: string, error?: string}>
 */
export async function uploadFileToStorage(
  userId: string,
  file: File | string,
  documentPath: string
): Promise<{success: boolean, downloadURL?: string, error?: string}> {
  if (!storage) {
    initializeFirebaseClientSDK();
    if (!storage) return { success: false, error: "Firebase Storage not initialized." };
  }
  console.log(`[Firebase Service] Uploading file "${documentPath}" for user ${userId}.`);
  
  const filePath = `user_documents/${userId}/${documentPath}`;
  const fileStorageRef = storageRef(storage, filePath);

  try {
    let uploadTask;
    if (typeof file === 'string') { // Data URI
      const base64String = file.split(',')[1];
      uploadTask = uploadString(fileStorageRef, base64String, 'base64', { contentType: file.split(':')[1].split(';')[0] });
    } else { // File object
      uploadTask = uploadBytesResumable(fileStorageRef, file);
    }

    // Using await with uploadTask (which is actually a snapshot from uploadString or UploadTask from uploadBytesResumable)
    // uploadBytesResumable returns an UploadTask, you can await its completion or listen to state changes
    // uploadString returns a promise that resolves with an UploadResult
    
    if (typeof file !== 'string') { // It's an UploadTask from uploadBytesResumable
        await new Promise<void>((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error('[Firebase Service] Upload failed:', error);
                    reject(error);
                },
                () => {
                    resolve();
                }
            );
        });
    } else { // It's a Promise<UploadResult> from uploadString
        await uploadTask;
    }

    const downloadURL = await getDownloadURL(fileStorageRef);
    return { success: true, downloadURL };

  } catch (error) {
    console.error('[Firebase Service] Error uploading file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


/**
 * Checks if a user document exists in Firestore based on a mobile number.
 * @param mobileNumber - The mobile number to search for.
 * @returns Promise<{exists: boolean, userId?: string, data?: UserApplicationData, error?: string}>
 */
export async function checkUserExistsByMobile(mobileNumber: string): Promise<{exists: boolean, userId?: string, data?: UserApplicationData, error?: string}> {
  if (!db) {
    initializeFirebaseClientSDK();
    if (!db) return { exists: false, error: "Firestore not initialized." };
  }
  console.log(`[Firebase Service] Checking if user exists with mobile ${mobileNumber} in collection '${CUSTOMER_COLLECTION}'`);
  try {
    const usersRef = collection(db, CUSTOMER_COLLECTION);
    const q = query(usersRef, where("mobileNumber", "==", mobileNumber), where("countryCode", "==", "+91")); // Example, adjust query as needed
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { exists: true, userId: userDoc.id, data: userDoc.data() as UserApplicationData };
    }
    return { exists: false };
  } catch (error) {
    console.error('[Firebase Service] Error checking user by mobile:', error);
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


// --- University/Loan List Management (Conceptual Admin functions - for future use) ---
// These would typically use Firebase Admin SDK if called from a secure backend environment

/**
 * Adds or updates a university in Firestore. (Conceptual admin function)
 */
export async function upsertUniversity(universityId: string, data: any): Promise<void> {
  if (!db) {
    initializeFirebaseClientSDK();
    if (!db) throw new Error("Firestore not initialized for upsertUniversity.");
  }
  console.log(`[Firebase Service] Placeholder: Upserting university ${universityId}`);
  // await setDoc(doc(db, 'universities', universityId), data, { merge: true });
}

/**
 * Fetches all universities. (Conceptual function for Genkit flow if it were to use Firestore)
 */
export async function getAllUniversities(): Promise<any[]> {
  if (!db) {
    initializeFirebaseClientSDK();
    if (!db) throw new Error("Firestore not initialized for getAllUniversities.");
  }
  console.log(`[Firebase Service] Placeholder: Fetching all universities`);
  // const snapshot = await getDocs(collection(db, 'universities'));
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return [{id: 'uni1', name: 'Placeholder University', courses: [{name: 'CS'}]}];
}
