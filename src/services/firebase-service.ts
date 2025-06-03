// For this version, we'll use the modular SDK v9+
import { FirebaseApp } from "firebase/app";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  Firestore,
  query,
  where,
  getDocs
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  uploadString,
  FirebaseStorage
} from "firebase/storage";
import { getDb } from "@/lib/firebase";
import { getStorageInstance } from "@/lib/firebase";

// --- Firebase Configuration ---
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const CUSTOMER_COLLECTION = 'customer'; // Updated: store all customer data in the 'customer' collection of the 'customer' database
const DATABASE_ID = "customer"; // The name of the customer database instance

const getFirebaseConfig = () => {
  if (typeof window === "undefined") {
    console.warn("[Firebase Service] getFirebaseConfig called on the server. Client-side config will be undefined here.");
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
    console.error("[Firebase Service] Firebase config not found or incomplete in environment variables. Ensure .env.local is set up correctly. Project ID:", config.projectId || "UNKNOWN_PROJECT_ID");
    return null;
  }
  // console.log("[Firebase Service] Loaded Firebase config for Project ID:", config.projectId);
  return config;
};

export const initializeFirebaseClientSDK = (): { db: Firestore | null, storage: FirebaseStorage | null } => {
  try {
    // Initialize the customer database
    db = getDb('customer');
    
    // Get the storage instance
    storage = getStorageInstance();
    
    console.log('[Firebase Service] Successfully initialized Firestore and Storage');
    return { db, storage };
  } catch (error) {
    console.error('[Firebase Service] Error initializing Firebase services:', error);
    return { db: null, storage: null };
  }
};

const ensureFirebaseInitialized = () => {
  if (!db || !storage) {
    console.warn('[Firebase Service] Firebase not fully initialized, attempting re-initialization.');
    return initializeFirebaseClientSDK();
  }
  return { db, storage };
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
    idTypeFromDoc?: string; // This was likely a typo, should match idType
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
  academicKyc?: any; // Define this more specifically later
  professionalKyc?: {
    coSignatory?: {
      coSignatoryChoice?: string | null;
      coSignatoryIdDocumentType?: "PAN Card" | "National ID" | null;
      coSignatoryIdUrl?: string | null;
      coSignatoryRelationship?: string | null;
      idNumber?: string;
      idType?: string;
      nameOnId?: string;
      consentTimestamp?: string;
    },
    workEmployment?: {
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
    },
    reviewedTimestamp?: string;
  };
  preferences?: any; // Define this more specifically later
  lenderRecommendations?: any; // Define this
  selectedLenderRecommendations?: string[];
  selectedUniversities?: string[];
}

import { addDoc } from "firebase/firestore";

export async function saveUserApplicationData(userId: string | undefined, data: Partial<UserApplicationData>): Promise<{success: boolean, error?: string, userId?: string}> {
  const { db } = ensureFirebaseInitialized();

  if (!db) {
    const errorMsg = `[Firebase Service] Firestore not initialized. Cannot save data for user: ${userId}`;
    console.error(errorMsg);
    return { success: false, error: "Firestore not initialized. Cannot save data." };
  }

  // Ensure data is a plain object suitable for Firestore
  const dataToSet: any = {
    ...JSON.parse(JSON.stringify(data)),
    updatedAt: serverTimestamp(),
  };

  try {
    if (userId) {
      // Update existing user
      const userDocRef = doc(db, CUSTOMER_COLLECTION, userId);
      await setDoc(userDocRef, { ...dataToSet, userId }, { merge: true });
      return { success: true, userId };
    } else {
      // Create new user
      const docRef = await addDoc(collection(db, CUSTOMER_COLLECTION), {
        ...dataToSet,
        createdAt: serverTimestamp(),
      });
      return { success: true, userId: docRef.id };
    }
  } catch (error: any) {
    console.error(`[Firebase Service] Error saving data for user ${userId}:`, error);
    let detailedError = error.message || 'Unknown error during Firestore operation.';
    if (error.code === 'unavailable') {
      detailedError = `Failed to save data: The client is offline or unable to reach Firestore. (Code: ${error.code})`;
    } else if (error.code === 'failed-precondition' && error.message.includes('database') && error.message.includes('not found')) {
      detailedError = `Firestore error: Database '${DATABASE_ID}' not found or not accessible. Please check database name and project configuration. (Code: ${error.code})`;
    } else if (error.code === 'permission-denied') {
      detailedError = userId
        ? `Firestore error: Permission denied for path '${CUSTOMER_COLLECTION}/${userId}'. Check security rules. (Code: ${error.code})`
        : `Firestore error: Permission denied while adding a new customer document. Check security rules. (Code: ${error.code})`;
    } else if (error.code === 'invalid-argument') {
      detailedError = userId
        ? `Invalid data format for Firestore: ${error.message}. Path: '${CUSTOMER_COLLECTION}/${userId}'. Data: ${JSON.stringify(dataToSet, null, 2)}`
        : `Invalid data format for Firestore: ${error.message}. Data: ${JSON.stringify(dataToSet, null, 2)}`;
    } else if (error.code) {
      detailedError = `Firestore error: ${error.message} (Code: ${error.code})`;
    }
    return { success: false, error: detailedError };
  }
}

export async function getUserApplicationData(userId: string): Promise<{success: boolean, data?: UserApplicationData, error?: string}> {
  const { db } = ensureFirebaseInitialized();
  if (!db) {
     const errorMsg = "[Firebase Service] Firestore not initialized. Cannot get data for user: " + userId;
     console.error(errorMsg);
     return { success: false, error: "Firestore not initialized. Cannot get data." };
  }
  // @ts-ignore
  const currentDbId = db?._databaseId?.database;
  // console.log(`[Firebase Service] Fetching data for user ${userId} from collection '${CUSTOMER_COLLECTION}' in DATABASE_ID '${currentDbId}'`);
  try {
    const docRef = doc(db, CUSTOMER_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.metadata.fromCache) {
        console.warn(`[Firebase Service] Read for user ${userId} was from cache. This might indicate an offline state or network issues for fresh data.`);
    }

    if (docSnap.exists()) {
      // console.log(`[Firebase Service] Data found for user ${userId}.`);
      return { success: true, data: docSnap.data() as UserApplicationData };
    } else {
      // console.log(`[Firebase Service] No application data found for user ${userId}.`);
      return { success: true, data: undefined };
    }
  } catch (error: any) {
    console.error(`[Firebase Service] Error fetching user data for ${userId}:`, `"${error.code}"`, `"${error.message}"`, error);
    let detailedError = error.message || 'Unknown error during Firestore get.';
    if (error.code === 'unavailable') {
        detailedError = `Failed to fetch data: The client is offline or unable to reach Firestore. (Code: ${error.code})`;
    } else if (error.code === 'failed-precondition' && error.message.includes('database') && error.message.includes('not found')) {
        detailedError = `Firestore error: Database '${DATABASE_ID}' not found or not accessible. Please check database name and project configuration. (Code: ${error.code})`;
    } else if (error.code === 'permission-denied') {
        detailedError = `Firestore error: Permission denied for query. Check security rules. (Code: ${error.code})`;
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
  const { storage } = ensureFirebaseInitialized();
  if (!storage) {
    console.error("[Firebase Service] Firebase Storage not initialized. Cannot upload file:", documentPath);
    return { success: false, error: "Firebase Storage not initialized. Cannot upload file." };
  }

  const sanitizedDocumentPath = documentPath.replace(/\s+/g, '_');
  const filePath = `user_documents/${userId}/${sanitizedDocumentPath}`;
  // console.log(`[Firebase Service] Attempting to upload file to Firebase Storage. Path: ${filePath} for user ${userId} in project '${projectId}'.`);

  const fileStorageRef = storageRef(storage, filePath);

  try {
    let uploadTask;
    if (typeof file === 'string' && file.startsWith('data:')) {
      const mimeTypeMatch = file.match(/^data:(.+?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
      const base64String = file.substring(file.indexOf(',') + 1);

      if(!base64String || base64String.trim() === '') {
        console.error("[Firebase Service] Invalid or empty data URI provided for uploadString for path:", documentPath);
        return { success: false, error: "Invalid data URI provided for upload." };
      }
      // console.log(`[Firebase Service] Uploading data URI as base64. MimeType: ${mimeType}`);
      uploadTask = uploadString(fileStorageRef, base64String, 'base64', { contentType: mimeType });
    } else if (file instanceof File) {
      // console.log(`[Firebase Service] Uploading File object. Name: ${file.name}, Type: ${file.type}`);
      uploadTask = uploadBytesResumable(fileStorageRef, file);
    } else {
      console.error("[Firebase Service] Invalid file type provided for upload. Must be File object or data URI string.");
      return { success: false, error: "Invalid file type provided for upload." };
    }

    await uploadTask;

    const downloadURL = await getDownloadURL(fileStorageRef);
    // console.log(`[Firebase Service] File ${documentPath} uploaded successfully. Download URL: ${downloadURL}`);
    return { success: true, downloadURL };

  } catch (error: any) {
    console.error(`[Firebase Service] Error uploading file ${documentPath}:`, `"${error.code}"`, `"${error.message}"`, error);
    let detailedError = error.message || 'Unknown error during file upload.';
    if (error.code && (error.code.includes('storage/unauthorized') || error.code.includes('storage/object-not-found') || error.code.includes('storage/canceled') || error.code.includes('storage/unknown'))) {
      detailedError = `Storage Error: ${error.message}. Check Firebase Storage security rules for path: ${filePath} and network connectivity. (Code: ${error.code})`;
    } else if (error.code === 'unavailable') {
         detailedError = `Failed to upload file: The client is offline or unable to reach Firebase Storage. (Code: ${error.code})`;
    } else if (error.code === 'permission-denied') {
        detailedError = `Storage error: Permission denied. Check Storage security rules for path '${filePath}'. (Code: ${error.code})`;
    } else if (error.code) {
        detailedError = `Storage error: ${error.message} (Code: ${error.code})`;
    }
    return { success: false, error: detailedError };
  }
}

export async function checkUserExistsByMobile(mobileNumber: string, countryCodeVal: string): Promise<{success: boolean, exists: boolean, userId?: string, data?: UserApplicationData, error?: string}> {
  const { db } = ensureFirebaseInitialized();
  if (!db) {
    console.error("[Firebase Service] Firestore not initialized. Cannot check user by mobile:", mobileNumber);
    return { success: false, exists: false, error: "Firestore not initialized. Cannot check user." };
  }

  const formattedCountryCode = countryCodeVal.startsWith('+') ? countryCodeVal : `+${countryCodeVal}`;
  // @ts-ignore
  const currentDbId = db?._databaseId?.database;
  // console.log(`[Firebase Service] Checking if user exists with mobile ${mobileNumber} (country code ${formattedCountryCode}) in collection '${CUSTOMER_COLLECTION}' in DATABASE_ID '${currentDbId}'`);

  try {
    const usersRef = collection(db, CUSTOMER_COLLECTION);
    const q = query(usersRef, where("mobileNumber", "==", mobileNumber), where("countryCode", "==", formattedCountryCode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      // console.log(`[Firebase Service] User found with ID: ${userDoc.id} for mobile ${mobileNumber}`);
      return { success: true, exists: true, userId: userDoc.id, data: userDoc.data() as UserApplicationData };
    }
    // console.log(`[Firebase Service] No user found with mobile ${mobileNumber} and country code ${formattedCountryCode}`);
    return { success: true, exists: false };
  } catch (error: any) {
    console.error(`[Firebase Service] Error checking user by mobile ${mobileNumber}:`, `"${error.code}"`, `"${error.message}"`, error);
    let detailedError = error.message || 'Unknown error during user check by mobile.';
     if (error.code === 'unavailable') {
        detailedError = `Failed to check user: The client is offline or unable to reach Firestore. (Code: ${error.code})`;
    } else if (error.code === 'failed-precondition' && error.message.includes('database') && error.message.includes('not found')) {
        detailedError = `Firestore error: Database '${DATABASE_ID}' not found or not accessible. Please check database name and project configuration. (Code: ${error.code})`;
    } else if (error.code === 'permission-denied') {
        detailedError = `Firestore error: Permission denied for query. Check security rules. (Code: ${error.code})`;
    } else if (error.code) {
        detailedError = `Firestore error: ${error.message} (Code: ${error.code})`;
    }
    return { success: false, exists: false, error: detailedError };
  }
}

// --- Conceptual Admin functions (for future use, likely with Admin SDK) ---
export async function upsertUniversity(universityId: string, data: any): Promise<void> {
  // console.log(`[Firebase Service] Placeholder: Upserting university ${universityId}`);
}

export async function getAllUniversities(): Promise<any[]> {
  const db = getDb('university'); // Use the correct DB instance for universities
  const universitiesCol = collection(db, "universities");
  const snapshot = await getDocs(universitiesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
