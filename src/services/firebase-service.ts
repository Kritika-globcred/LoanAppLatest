
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

const CUSTOMER_COLLECTION = 'customer'; // This is the Firestore COLLECTION name
const DATABASE_ID = "customer"; // This is the Firestore DATABASE INSTANCE ID you specified

const getFirebaseConfig = () => {
  if (typeof window === "undefined") {
    console.warn("[Firebase Service] Firebase config is being accessed on the server. Client-side config will be undefined here.");
    return null;
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.projectId || !config.apiKey) {
    console.error("[Firebase Service] Firebase config not found or incomplete in environment variables. Ensure .env.local is set up correctly with NEXT_PUBLIC_ prefixed variables.");
    return null;
  }
  return config;
};

export const initializeFirebaseClientSDK = (): { firebaseApp: FirebaseApp | null, db: Firestore | null, storage: FirebaseStorage | null } => {
  if (firebaseApp && db && storage) {
    // Check if the existing db instance is for the correct database ID
    // @ts-ignore // Accessing private _databaseId for logging, not for production use
    if (db && db._databaseId && db._databaseId.database === DATABASE_ID) {
       console.log(`[Firebase Service] Firebase already initialized for DATABASE_ID: "${DATABASE_ID}" (Project ID: ${firebaseApp.options.projectId}). Returning existing instances.`);
       return { firebaseApp, db, storage };
    } else {
        console.warn(`[Firebase Service] Firebase was initialized, but for a different DB_ID or db instance is null. Re-initializing for DATABASE_ID: "${DATABASE_ID}".`);
    }
  }

  const config = getFirebaseConfig();
  if (!config) {
    console.error("[Firebase Service] Cannot initialize Firebase: Config is missing or invalid.");
    return { firebaseApp: null, db: null, storage: null };
  }

  console.log(`[Firebase Service] Attempting to initialize Firebase with Project ID: ${config.projectId} and TARGET DATABASE_ID: "${DATABASE_ID}"`);

  if (!getApps().length) {
    try {
      firebaseApp = initializeApp(config);
      console.log("[Firebase Service] Firebase App initialized successfully for project:", config.projectId);
    } catch (error) {
      console.error("[Firebase Service] Error initializing Firebase App:", error);
      return { firebaseApp: null, db: null, storage: null };
    }
  } else {
    firebaseApp = getApps()[0];
    if (firebaseApp.options.projectId !== config.projectId) {
         console.warn(`[Firebase Service] Mismatch: An app for project ${firebaseApp.options.projectId} is already initialized. Attempting to initialize for ${config.projectId} as a secondary app (this might not be ideal).`);
         try {
            firebaseApp = initializeApp(config, `app-${config.projectId?.replace(/-/g, '')}`);
            console.log("[Firebase Service] Firebase App re-initialized as named instance for project:", config.projectId);
         } catch (error) {
             console.error("[Firebase Service] Error re-initializing Firebase App as named instance:", error);
             return { firebaseApp: null, db: null, storage: null };
         }
    }
  }

  try {
    db = getFirestore(firebaseApp, DATABASE_ID); // Explicitly use the DATABASE_ID
    // @ts-ignore - Accessing private _databaseId for logging
    const actualDbId = db?._databaseId?.database || 'unknown';
    console.log(`[Firebase Service] Firestore CURENTLY INITIALIZED for DATABASE_ID: "${actualDbId}". Expected: "${DATABASE_ID}"`);
    if (actualDbId !== DATABASE_ID && actualDbId !== '(default)') { // (default) can sometimes be the internal representation before specific ID is applied
        console.warn(`[Firebase Service] Firestore initialized with DB ID "${actualDbId}" but expected "${DATABASE_ID}". This might lead to issues.`);
    } else if (actualDbId === DATABASE_ID) {
        console.log(`[Firebase Service] Firestore successfully targeting DATABASE_ID: "${DATABASE_ID}".`);
    }

  } catch (error) {
    console.error(`[Firebase Service] Error initializing Firestore for DATABASE_ID "${DATABASE_ID}":`, error);
    db = null; 
  }

  try {
    storage = getStorage(firebaseApp);
    console.log("[Firebase Service] Firebase Storage initialized successfully.");
  } catch (error) {
    console.error("[Firebase Service] Error initializing Firebase Storage:", error);
    storage = null;
  }
  
  return { firebaseApp, db, storage };
};

const ensureFirebaseInitialized = () => {
  if (!db || !storage || !firebaseApp) {
    console.warn("[Firebase Service] Firebase not fully initialized (db, storage, or app is null), attempting re-initialization.");
    return initializeFirebaseClientSDK();
  }
   // @ts-ignore
  const currentDbId = db?._databaseId?.database || 'unknown';
  if (currentDbId !== DATABASE_ID) {
      console.warn(`[Firebase Service] ensureFirebaseInitialized: DB instance ID "${currentDbId}" does not match expected "${DATABASE_ID}". Re-initializing.`);
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
  countryCode?: string; 
  countryShortName?: string; 
  hasOfferLetter?: boolean;
  admissionKyc?: {
    studentName?: string;
    universityName?: string;
    courseName?: string;
    admissionLevel?: string;
    admissionFees?: string;
    courseStartDate?: string;
    offerLetterType?: string;
    offerLetterUrl?: string; 
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
    idDocumentUrl?: string; 
    passportUrl?: string; 
    consentTimestamp?: string;
  };
  academicKyc?: any; 
  professionalKyc?: {
    coSignatoryChoice?: string | null;
    coSignatoryIdDocumentType?: "PAN Card" | "National ID" | null;
    coSignatoryIdUrl?: string | null; 
    coSignatoryRelationship?: string | null;
    coSignatoryIdNumber?: string; 
    coSignatoryIdType?: string;   
    coSignatoryNameOnId?: string; 

    workExperienceIndustry?: string;
    workExperienceYears?: string;
    workExperienceMonths?: string;
    workExperienceProofType?: 'resume' | 'linkedin' | null;
    resumeUrl?: string | null; 
    linkedInUrl?: string | null;
    
    extractedYearsOfExperience?: string; 
    extractedGapInLast3YearsMonths?: string; 
    extractedCurrentOrLastIndustry?: string; 
    extractedCurrentOrLastJobRole?: string; 
    
    isCurrentlyWorking?: 'yes' | 'no' | null;
    monthlySalary?: string | null;
    salaryCurrency?: string | null;
    familyMonthlySalary?: string | null;
    familySalaryCurrency?: string | null;
    consentTimestamp?: string;
  };
  preferences?: any; 
  lenderRecommendations?: any; 
  selectedLenderRecommendations?: string[];
  selectedUniversities?: string[];
}


export async function saveUserApplicationData(userId: string, data: Partial<UserApplicationData>): Promise<{success: boolean, error?: string}> {
  const { db: currentDb, firebaseApp: currentApp } = ensureFirebaseInitialized();

  if (!currentDb || !currentApp) {
    const errorMsg = "[Firebase Service] Firestore not initialized. Cannot save data for user: " + userId;
    console.error(errorMsg);
    return { success: false, error: "Firestore not initialized. Cannot save data." };
  }
  // @ts-ignore
  const currentDbId = currentDb?._databaseId?.database;
  if (currentDbId !== DATABASE_ID) {
      const errorMsg = `[Firebase Service] CRITICAL: saveUserApplicationData attempting to write to DB ID "${currentDbId}" but expected "${DATABASE_ID}". Aborting.`;
      console.error(errorMsg);
      return { success: false, error: `Internal configuration error: Attempting to write to wrong database instance (${currentDbId}). Expected ${DATABASE_ID}.` };
  }
  
  const dataToSet: any = { // Use 'any' for dataToSet temporarily for easier field management
    ...data, 
    userId, 
    updatedAt: serverTimestamp(),
  };

  // Add createdAt only if it's the initial save (i.e., if 'createdAt' is provided in the 'data' argument)
  if (data.createdAt) {
    dataToSet.createdAt = data.createdAt;
  }
  
  console.log(`[Firebase Service] Saving data for user ${userId} to collection '${CUSTOMER_COLLECTION}' in DATABASE_ID '${currentDbId}', project '${currentApp.options.projectId}'. Data being merged:`, JSON.parse(JSON.stringify(dataToSet)));
  
  try {
    const userDocRef = doc(currentDb, CUSTOMER_COLLECTION, userId);
    await setDoc(userDocRef, dataToSet, { merge: true });
    console.log(`[Firebase Service] Data for user ${userId} saved successfully to collection '${CUSTOMER_COLLECTION}' in DATABASE_ID '${currentDbId}'.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Firebase Service] Error saving user data for ${userId} to DB_ID '${currentDbId}':`, `"${error.code}"`, `"${error.message}"`, error);
    let detailedError = error.message || 'Unknown error during Firestore save.';
    if (error.code === 'unavailable') {
        detailedError = `Failed to save data: The client is offline or unable to reach Firestore. (Code: ${error.code})`;
    } else if (error.code === 'failed-precondition' && error.message.includes('database') && error.message.includes('not found')) {
        detailedError = `Firestore error: Database '${DATABASE_ID}' not found or not accessible. Please check database name and project configuration. (Code: ${error.code})`;
    } else if (error.code) {
        detailedError = `Firestore error: ${error.message} (Code: ${error.code})`;
    }
    return { success: false, error: detailedError };
  }
}


export async function getUserApplicationData(userId: string): Promise<{success: boolean, data?: UserApplicationData, error?: string}> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
     const errorMsg = "[Firebase Service] Firestore not initialized. Cannot get data for user: " + userId;
     console.error(errorMsg);
     return { success: false, error: "Firestore not initialized. Cannot get data." };
  }
  // @ts-ignore
  const currentDbId = currentDb?._databaseId?.database;
  console.log(`[Firebase Service] Fetching data for user ${userId} from collection '${CUSTOMER_COLLECTION}' in DATABASE_ID '${currentDbId}'`);
  try {
    const docRef = doc(currentDb, CUSTOMER_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.metadata.fromCache) {
        console.warn(`[Firebase Service] Read for user ${userId} was from cache. This might indicate an offline state or network issues for fresh data.`);
    }

    if (docSnap.exists()) {
      console.log(`[Firebase Service] Data found for user ${userId}.`);
      return { success: true, data: docSnap.data() as UserApplicationData };
    } else {
      console.log(`[Firebase Service] No application data found for user ${userId}.`);
      return { success: true, data: undefined }; 
    }
  } catch (error: any) {
    console.error(`[Firebase Service] Error fetching user data for ${userId}:`, `"${error.code}"`, `"${error.message}"`, error);
    let detailedError = error.message || 'Unknown error during Firestore get.';
    if (error.code === 'unavailable') {
        detailedError = `Failed to fetch data: The client is offline or unable to reach Firestore. (Code: ${error.code})`;
    } else if (error.code) {
        detailedError = `Firestore error: ${error.message} (Code: ${error.code})`;
    }
    return { success: false, error: detailedError };
  }
}


export async function uploadFileToStorage(
  userId: string,
  file: File | string, 
  documentPath: string 
): Promise<{success: boolean, downloadURL?: string, error?: string}> {
  const { storage: currentStorage, firebaseApp: currentApp } = ensureFirebaseInitialized();
  if (!currentStorage || !currentApp) {
    console.error("[Firebase Service] Firebase Storage not initialized. Cannot upload file:", documentPath);
    return { success: false, error: "Firebase Storage not initialized. Cannot upload file." };
  }
  
  const sanitizedDocumentPath = documentPath.replace(/\s+/g, '_'); 
  const filePath = `user_documents/${userId}/${sanitizedDocumentPath}`;
  console.log(`[Firebase Service] Attempting to upload file to Firebase Storage. Path: ${filePath} for user ${userId} in project '${currentApp.options.projectId}'.`);
  
  const fileStorageRefObj = storageRef(currentStorage, filePath);

  try {
    let uploadTask;
    if (typeof file === 'string') { 
      const mimeTypeMatch = file.match(/^data:(.+?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream'; 
      const base64String = file.substring(file.indexOf(',') + 1);

      if(!base64String || base64String.trim() === '') {
        console.error("[Firebase Service] Invalid or empty data URI provided for uploadString for path:", documentPath);
        return { success: false, error: "Invalid data URI provided for upload." };
      }
      uploadTask = uploadString(fileStorageRefObj, base64String, 'base64', { contentType: mimeType });
    } else { 
      uploadTask = uploadBytesResumable(fileStorageRefObj, file);
    }

    await uploadTask; 
    
    const downloadURL = await getDownloadURL(fileStorageRefObj);
    console.log(`[Firebase Service] File ${documentPath} uploaded successfully. Download URL: ${downloadURL}`);
    return { success: true, downloadURL };

  } catch (error: any) {
    console.error(`[Firebase Service] Error uploading file ${documentPath}:`, `"${error.code}"`, `"${error.message}"`, error);
    let detailedError = error.message || 'Unknown error during file upload.';
    if (error.code && (error.code.includes('storage/unauthorized') || error.code.includes('storage/object-not-found') || error.code.includes('storage/canceled') || error.code.includes('storage/unknown'))) {
      detailedError = `Storage Error: ${error.message}. Check Firebase Storage security rules for path: ${filePath} and network connectivity. (Code: ${error.code})`;
    } else if (error.code === 'unavailable') {
         detailedError = `Failed to upload file: The client is offline or unable to reach Firebase Storage. (Code: ${error.code})`;
    } else if (error.code) {
        detailedError = `Storage error: ${error.message} (Code: ${error.code})`;
    }
    return { success: false, error: detailedError };
  }
}



export async function checkUserExistsByMobile(mobileNumber: string, countryCodeVal: string): Promise<{success: boolean, exists: boolean, userId?: string, data?: UserApplicationData, error?: string}> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
    console.error("[Firebase Service] Firestore not initialized. Cannot check user by mobile:", mobileNumber);
    return { success: false, exists: false, error: "Firestore not initialized. Cannot check user." };
  }
  
  const formattedCountryCode = countryCodeVal.startsWith('+') ? countryCodeVal : `+${countryCodeVal}`;
   // @ts-ignore
  const currentDbId = currentDb?._databaseId?.database;
  console.log(`[Firebase Service] Checking if user exists with mobile ${mobileNumber} (country code ${formattedCountryCode}) in collection '${CUSTOMER_COLLECTION}' in DATABASE_ID '${currentDbId}'`);

  try {
    const usersRef = collection(currentDb, CUSTOMER_COLLECTION);
    const q = query(usersRef, where("mobileNumber", "==", mobileNumber), where("countryCode", "==", formattedCountryCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log(`[Firebase Service] User found with ID: ${userDoc.id} for mobile ${mobileNumber}`);
      return { success: true, exists: true, userId: userDoc.id, data: userDoc.data() as UserApplicationData };
    }
    console.log(`[Firebase Service] No user found with mobile ${mobileNumber} and country code ${formattedCountryCode}`);
    return { success: true, exists: false };
  } catch (error: any) {
    console.error(`[Firebase Service] Error checking user by mobile ${mobileNumber}:`, `"${error.code}"`, `"${error.message}"`, error);
    let detailedError = error.message || 'Unknown error during user check by mobile.';
     if (error.code === 'unavailable') {
        detailedError = `Failed to check user: The client is offline or unable to reach Firestore. (Code: ${error.code})`;
    } else if (error.code === 'failed-precondition' && error.message.includes('database') && error.message.includes('not found')) {
        detailedError = `Firestore error: Database '${DATABASE_ID}' not found or not accessible. Please check database name and project configuration. (Code: ${error.code})`;
    } else if (error.code) {
        detailedError = `Firestore error: ${error.message} (Code: ${error.code})`;
    }
    return { success: false, exists: false, error: detailedError };
  }
}


// --- Conceptual Admin functions (for future use, likely with Admin SDK) ---
export async function upsertUniversity(universityId: string, data: any): Promise<void> {
  console.log(`[Firebase Service] Placeholder: Upserting university ${universityId}`);
}

export async function getAllUniversities(): Promise<any[]> {
  console.log(`[Firebase Service] Placeholder: Fetching all universities`);
  return [{id: 'uni1', name: 'Placeholder University', courses: [{name: 'CS'}]}];
}

