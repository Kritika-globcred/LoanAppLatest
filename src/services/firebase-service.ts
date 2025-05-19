
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

const CUSTOMER_COLLECTION = 'customer';

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
  console.log("[Firebase Service] Loaded Firebase config from environment variables for Project ID:", config.projectId);
  return config;
};

export const initializeFirebaseClientSDK = (): { firebaseApp: FirebaseApp | null, db: Firestore | null, storage: FirebaseStorage | null } => {
  if (firebaseApp && db && storage) {
    // console.log("[Firebase Service] Firebase already initialized. Returning existing instances.");
    return { firebaseApp, db, storage };
  }

  const config = getFirebaseConfig();
  if (!config) {
    console.error("[Firebase Service] Cannot initialize Firebase: Config is missing or invalid.");
    return { firebaseApp: null, db: null, storage: null };
  }

  console.log("[Firebase Service] Attempting to initialize Firebase with Project ID:", config.projectId);

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
    if (firebaseApp.options.projectId === config.projectId) {
      // console.log("[Firebase Service] Using existing Firebase App instance for project:", config.projectId);
    } else {
      console.error("[Firebase Service] Mismatch: An app for a different project is already initialized. Expected:", config.projectId, "Found:", firebaseApp.options.projectId);
      // This indicates a significant issue if multiple projects are being mixed.
      // For now, we'll proceed with the already initialized app, but this should be investigated.
    }
  }

  try {
    db = getFirestore(firebaseApp);
    console.log("[Firebase Service] Firestore initialized successfully.");
  } catch (error) {
    console.error("[Firebase Service] Error initializing Firestore:", error);
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
    console.warn("[Firebase Service] Firebase not fully initialized, attempting re-initialization.");
    return initializeFirebaseClientSDK();
  }
  // console.log("[Firebase Service] Firebase instances confirmed.");
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
    coSignatoryIdUrl?: string | null; // Storing URL of the uploaded ID
    coSignatoryRelationship?: string | null;
    coSignatoryIdNumber?: string; // AI Extracted
    coSignatoryIdType?: string;   // AI Extracted
    coSignatoryNameOnId?: string; // AI Extracted

    workExperienceIndustry?: string;
    workExperienceYears?: string;
    workExperienceMonths?: string;
    workExperienceProofType?: 'resume' | 'linkedin' | null;
    resumeUrl?: string | null; // Storing URL of uploaded resume
    linkedInUrl?: string | null;
    
    // AI Extracted from professional profile
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
    console.error("[Firebase Service] Firestore not initialized. Cannot save data for user:", userId);
    return { success: false, error: "Firestore not initialized. Cannot save data." };
  }
  console.log(`[Firebase Service] Attempting to save data for user ${userId} to collection '${CUSTOMER_COLLECTION}' in project '${currentApp.options.projectId}'. Data:`, JSON.parse(JSON.stringify(data))); // Log a copy
  try {
    const userDocRef = doc(currentDb, CUSTOMER_COLLECTION, userId);
    
    let dataToSave: Partial<UserApplicationData> = { ...data, userId, updatedAt: serverTimestamp() };

    // Check if document exists to conditionally add createdAt
    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.metadata.fromCache) {
        console.warn(`[Firebase Service] Read for user ${userId} was from cache. This might indicate an offline state or network issues.`);
    }

    if (!docSnapshot.exists()) {
      console.log(`[Firebase Service] Document for user ${userId} does not exist. Adding createdAt timestamp.`);
      (dataToSave as UserApplicationData).createdAt = serverTimestamp();
    } else {
      console.log(`[Firebase Service] Document for user ${userId} exists. Merging data.`);
    }
    
    await setDoc(userDocRef, dataToSave, { merge: true });
    console.log(`[Firebase Service] Data for user ${userId} saved successfully.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Firebase Service] Error saving user data for ${userId}:`, error.code, error.message, error);
    if (error.code === 'unavailable' || error.message.toLowerCase().includes('offline')) {
        return { success: false, error: 'Failed to save data: The client is offline or unable to reach Firestore.' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during Firestore save.' };
  }
}


export async function getUserApplicationData(userId: string): Promise<{success: boolean, data?: UserApplicationData, error?: string}> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
     console.error("[Firebase Service] Firestore not initialized. Cannot get data for user:", userId);
     return { success: false, error: "Firestore not initialized. Cannot get data." };
  }
  console.log(`[Firebase Service] Fetching data for user ${userId} from collection '${CUSTOMER_COLLECTION}'`);
  try {
    const docRef = doc(currentDb, CUSTOMER_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log(`[Firebase Service] Data found for user ${userId}.`);
      return { success: true, data: docSnap.data() as UserApplicationData };
    } else {
      console.log(`[Firebase Service] No application data found for user ${userId}.`);
      return { success: true, data: undefined }; // Return success true but undefined data if not found
    }
  } catch (error: any) {
    console.error(`[Firebase Service] Error fetching user data for ${userId}:`, error.code, error.message, error);
    if (error.code === 'unavailable' || error.message.toLowerCase().includes('offline')) {
        return { success: false, error: 'Failed to fetch data: The client is offline or unable to reach Firestore.' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during Firestore get.' };
  }
}


export async function uploadFileToStorage(
  userId: string,
  file: File | string,
  documentPath: string // e.g., "offer_letter/my_offer.pdf" or "id_documents/pan_card.jpg"
): Promise<{success: boolean, downloadURL?: string, error?: string}> {
  const { storage: currentStorage, firebaseApp: currentApp } = ensureFirebaseInitialized();
  if (!currentStorage || !currentApp) {
    console.error("[Firebase Service] Firebase Storage not initialized. Cannot upload file:", documentPath);
    return { success: false, error: "Firebase Storage not initialized. Cannot upload file." };
  }
  
  const sanitizedDocumentPath = documentPath.replace(/\s+/g, '_'); // Replace spaces
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
        throw new Error("Invalid data URI provided for uploadString.");
      }
      // console.log(`[Firebase Service] Uploading data URI as ${mimeType} for path: ${documentPath}`);
      uploadTask = uploadString(fileStorageRefObj, base64String, 'base64', { contentType: mimeType });
    } else { 
      // console.log(`[Firebase Service] Uploading File object: ${file.name}, type: ${file.type} for path: ${documentPath}`);
      uploadTask = uploadBytesResumable(fileStorageRefObj, file);
    }

    if (typeof file !== 'string') { 
        // For File objects, use the resumable upload to track progress if needed (not fully implemented here for brevity)
        await new Promise<void>((resolve, reject) => {
            (uploadTask as any).on( // Using 'any' as Firebase's UploadTask type can be complex with overloads
                'state_changed',
                (snapshot: any) => {
                    // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // console.log('[Firebase Service] Upload is ' + progress + '% done for ' + documentPath);
                },
                (uploadError: any) => { // Explicitly type uploadError
                    console.error(`[Firebase Service] Upload failed during state_changed for ${documentPath}:`, uploadError.code, uploadError.message, uploadError);
                    reject(uploadError);
                },
                async () => { // This is the success callback
                    console.log(`[Firebase Service] Upload successful (via state_changed) for ${documentPath}`);
                    try {
                        const url = await getDownloadURL(fileStorageRefObj);
                        resolve(); // Resolve the outer promise here
                    } catch (getUrlError) {
                        console.error(`[Firebase Service] Error getting download URL for ${documentPath} after upload:`, getUrlError);
                        reject(getUrlError);
                    }
                }
            );
        });
    } else { 
        await uploadTask; // For data URI strings, 'uploadString' returns a promise that resolves on completion
        console.log(`[Firebase Service] Data URI upload successful for ${documentPath}`);
    }

    const downloadURL = await getDownloadURL(fileStorageRefObj);
    console.log(`[Firebase Service] File ${documentPath} uploaded successfully. Download URL: ${downloadURL}`);
    return { success: true, downloadURL };

  } catch (error: any) {
    console.error(`[Firebase Service] Error uploading file ${documentPath}:`, error.code, error.message, error);
    if (error.code && (error.code.includes('storage/unauthorized') || error.code.includes('storage/object-not-found'))) {
      console.error("[Firebase Service] Suggestion: Check Firebase Storage security rules for the path:", filePath);
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during file upload.' };
  }
}



export async function checkUserExistsByMobile(mobileNumber: string, countryCodeVal: string): Promise<{success: boolean, exists: boolean, userId?: string, data?: UserApplicationData, error?: string}> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
    console.error("[Firebase Service] Firestore not initialized. Cannot check user by mobile:", mobileNumber);
    return { success: false, exists: false, error: "Firestore not initialized. Cannot check user." };
  }
  
  const formattedCountryCode = countryCodeVal.startsWith('+') ? countryCodeVal : `+${countryCodeVal}`;
  console.log(`[Firebase Service] Checking if user exists with mobile ${mobileNumber} (country code ${formattedCountryCode}) in collection '${CUSTOMER_COLLECTION}'`);

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
    console.error(`[Firebase Service] Error checking user by mobile ${mobileNumber}:`, error.code, error.message, error);
     if (error.code === 'unavailable' || error.message.toLowerCase().includes('offline')) {
        return { success: false, exists: false, error: 'Failed to check user: The client is offline or unable to reach Firestore.' };
    }
    return { success: false, exists: false, error: error instanceof Error ? error.message : 'Unknown error during user check by mobile.' };
  }
}


// --- Conceptual Admin functions (for future use, likely with Admin SDK) ---
export async function upsertUniversity(universityId: string, data: any): Promise<void> {
  // const { db: currentDb } = ensureFirebaseInitialized();
  // if (!currentDb) throw new Error("Firestore not initialized for upsertUniversity.");
  console.log(`[Firebase Service] Placeholder: Upserting university ${universityId}`);
  // await setDoc(doc(db, 'universities', universityId), data, { merge: true });
}

export async function getAllUniversities(): Promise<any[]> {
  // const { db: currentDb } = ensureFirebaseInitialized();
  // if (!currentDb) throw new Error("Firestore not initialized for getAllUniversities.");
  console.log(`[Firebase Service] Placeholder: Fetching all universities`);
  // const snapshot = await getDocs(collection(db, 'universities'));
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return [{id: 'uni1', name: 'Placeholder University', courses: [{name: 'CS'}]}];
}

