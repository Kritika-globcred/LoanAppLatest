
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
  Timestamp,
  Firestore
} from "firebase/firestore";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL, 
  uploadString,
  FirebaseStorage 
} from "firebase/storage";


// --- Firebase Configuration ---
let firebaseApp: FirebaseApp | null = null;
let db: Firestore | null = null; 
let storage: FirebaseStorage | null = null;

const getFirebaseConfig = () => {
  if (typeof window === "undefined") {
    console.warn("[Firebase Service] Firebase config is being accessed on the server. Client-side config will be undefined here.");
    return null;
  }
  // These NEXT_PUBLIC_ variables are replaced by their values by Next.js at build time
  // and are safe to use on the client-side.
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Basic check for essential config values
  if (!config.projectId || !config.apiKey) {
    console.error("[Firebase Service] Firebase config not found or incomplete. Ensure .env.local is set up correctly with NEXT_PUBLIC_ prefixed variables.");
    return null;
  }
  return config;
};

export const initializeFirebaseClientSDK = (): { firebaseApp: FirebaseApp | null, db: Firestore | null, storage: FirebaseStorage | null } => {
  // Prevent re-initialization if already done
  if (firebaseApp && db && storage) {
    return { firebaseApp, db, storage };
  }

  const config = getFirebaseConfig();
  if (!config) {
    console.error("[Firebase Service] Cannot initialize Firebase: Config is missing.");
    return { firebaseApp: null, db: null, storage: null };
  }

  console.log("[Firebase Service] Initializing Firebase with Project ID:", config.projectId);

  if (!getApps().length) {
    try {
      firebaseApp = initializeApp(config);
      console.log("[Firebase Service] Firebase App initialized successfully.");
    } catch (error) {
      console.error("[Firebase Service] Error initializing Firebase App:", error);
      return { firebaseApp: null, db: null, storage: null };
    }
  } else {
    firebaseApp = getApps()[0];
    console.log("[Firebase Service] Using existing Firebase App instance.");
  }

  try {
    db = getFirestore(firebaseApp);
    console.log("[Firebase Service] Firestore initialized successfully.");
  } catch (error) {
    console.error("[Firebase Service] Error initializing Firestore:", error);
    db = null; // Ensure db is null if initialization fails
  }

  try {
    storage = getStorage(firebaseApp);
    console.log("[Firebase Service] Firebase Storage initialized successfully.");
  } catch (error) {
    console.error("[Firebase Service] Error initializing Firebase Storage:", error);
    storage = null; // Ensure storage is null if initialization fails
  }
  
  return { firebaseApp, db, storage };
};

// Initialize on load for client-side usage if this module is imported.
// It's better to call this explicitly when needed, e.g., in a top-level component or layout.
// However, for simplicity in this context, we'll let it initialize if db/storage are accessed.
const ensureFirebaseInitialized = () => {
  if (!db || !storage) {
    return initializeFirebaseClientSDK();
  }
  return { firebaseApp, db, storage };
}


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
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
    return { success: false, error: "Firestore not initialized. Cannot save data." };
  }
  console.log(`[Firebase Service] Saving data for user ${userId} to collection '${CUSTOMER_COLLECTION}':`, data);
  try {
    const userDocRef = doc(currentDb, CUSTOMER_COLLECTION, userId);
    const dataToSave = {
      ...data,
      userId, 
      updatedAt: serverTimestamp(),
    };

    const docSnapshot = await getDoc(userDocRef);
    if (!docSnapshot.exists()) {
      (dataToSave as UserApplicationData).createdAt = serverTimestamp();
    }
    
    await setDoc(userDocRef, dataToSave, { merge: true });
    console.log(`[Firebase Service] Data for user ${userId} saved successfully.`);
    return { success: true };
  } catch (error) {
    console.error('[Firebase Service] Error saving user data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during Firestore save.' };
  }
}

/**
 * Retrieves user application data from Firestore.
 * @param userId - The unique ID of the user.
 * @returns Promise<{success: boolean, data?: UserApplicationData, error?: string}>
 */
export async function getUserApplicationData(userId: string): Promise<{success: boolean, data?: UserApplicationData, error?: string}> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
     return { success: false, error: "Firestore not initialized. Cannot get data." };
  }
  console.log(`[Firebase Service] Fetching data for user ${userId} from collection '${CUSTOMER_COLLECTION}'`);
  try {
    const docRef = doc(currentDb, CUSTOMER_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() as UserApplicationData };
    } else {
      return { success: false, error: 'No application data found for this user.' };
    }
  } catch (error) {
    console.error('[Firebase Service] Error fetching user data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during Firestore get.' };
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
  const { storage: currentStorage } = ensureFirebaseInitialized();
  if (!currentStorage) {
    return { success: false, error: "Firebase Storage not initialized. Cannot upload file." };
  }
  console.log(`[Firebase Service] Uploading file "${documentPath}" for user ${userId}.`);
  
  const filePath = `user_documents/${userId}/${documentPath.replace(/\s+/g, '_')}`; // Sanitize path a bit
  const fileStorageRefObj = storageRef(currentStorage, filePath);

  try {
    let uploadTask;
    if (typeof file === 'string') { 
      const base64String = file.split(',')[1];
      const mimeType = file.substring(file.indexOf(':') + 1, file.indexOf(';'));
      if(!base64String) throw new Error("Invalid data URI provided for uploadString.");
      uploadTask = uploadString(fileStorageRefObj, base64String, 'base64', { contentType: mimeType });
    } else { 
      uploadTask = uploadBytesResumable(fileStorageRefObj, file);
    }

    if (typeof file !== 'string') { 
        await new Promise<void>((resolve, reject) => {
            (uploadTask as any).on( // Cast to any because type defs might vary slightly
                'state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('[Firebase Service] Upload is ' + progress + '% done for ' + documentPath);
                },
                (error: any) => {
                    console.error('[Firebase Service] Upload failed for ' + documentPath + ':', error);
                    reject(error);
                },
                () => {
                    console.log('[Firebase Service] Upload successful for ' + documentPath);
                    resolve();
                }
            );
        });
    } else { 
        await uploadTask;
         console.log('[Firebase Service] Upload successful for ' + documentPath + ' (data URI)');
    }

    const downloadURL = await getDownloadURL(fileStorageRefObj);
    return { success: true, downloadURL };

  } catch (error) {
    console.error('[Firebase Service] Error uploading file ' + documentPath + ':', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during file upload.' };
  }
}


/**
 * Checks if a user document exists in Firestore based on a mobile number.
 * @param mobileNumber - The mobile number to search for.
 * @returns Promise<{exists: boolean, userId?: string, data?: UserApplicationData, error?: string}>
 */
export async function checkUserExistsByMobile(mobileNumber: string, countryCodeVal: string): Promise<{exists: boolean, userId?: string, data?: UserApplicationData, error?: string}> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
    return { exists: false, error: "Firestore not initialized. Cannot check user." };
  }
  console.log(`[Firebase Service] Checking if user exists with mobile ${mobileNumber} (country code ${countryCodeVal}) in collection '${CUSTOMER_COLLECTION}'`);
  try {
    const usersRef = collection(currentDb, CUSTOMER_COLLECTION);
    // Ensure the countryCodeVal from localStorage is in the format Firestore expects (e.g., "+91")
    const formattedCountryCode = countryCodeVal.startsWith('+') ? countryCodeVal : `+${countryCodeVal}`;

    const q = query(usersRef, where("mobileNumber", "==", mobileNumber), where("countryCode", "==", formattedCountryCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log(`[Firebase Service] User found with ID: ${userDoc.id}`);
      return { exists: true, userId: userDoc.id, data: userDoc.data() as UserApplicationData };
    }
    console.log(`[Firebase Service] No user found with mobile ${mobileNumber} and country code ${formattedCountryCode}`);
    return { exists: false };
  } catch (error) {
    console.error('[Firebase Service] Error checking user by mobile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during user check by mobile.' };
  }
}


// --- University/Loan List Management (Conceptual Admin functions - for future use) ---
// These would typically use Firebase Admin SDK if called from a secure backend environment

/**
 * Adds or updates a university in Firestore. (Conceptual admin function)
 */
export async function upsertUniversity(universityId: string, data: any): Promise<void> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) throw new Error("Firestore not initialized for upsertUniversity.");
  console.log(`[Firebase Service] Placeholder: Upserting university ${universityId}`);
  // await setDoc(doc(db, 'universities', universityId), data, { merge: true });
}

/**
 * Fetches all universities. (Conceptual function for Genkit flow if it were to use Firestore)
 */
export async function getAllUniversities(): Promise<any[]> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) throw new Error("Firestore not initialized for getAllUniversities.");
  console.log(`[Firebase Service] Placeholder: Fetching all universities`);
  // const snapshot = await getDocs(collection(db, 'universities'));
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return [{id: 'uni1', name: 'Placeholder University', courses: [{name: 'CS'}]}];
}
