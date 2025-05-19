
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

const CUSTOMER_COLLECTION = 'customer'; // Using your specified collection name

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
    console.error("[Firebase Service] Firebase config not found or incomplete. Ensure .env.local is set up correctly with NEXT_PUBLIC_ prefixed variables.");
    return null;
  }
  return config;
};

export const initializeFirebaseClientSDK = (): { firebaseApp: FirebaseApp | null, db: Firestore | null, storage: FirebaseStorage | null } => {
  if (firebaseApp && db && storage) {
    // console.log("[Firebase Service] Firebase already initialized. Returning existing instances.");
    return { firebaseApp, db, storage };
  }

  const config = getFirebaseConfig();
  if (!config) {
    console.error("[Firebase Service] Cannot initialize Firebase: Config is missing.");
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
    // Check if the existing app is for the correct project
    if (firebaseApp.options.projectId === config.projectId) {
      console.log("[Firebase Service] Using existing Firebase App instance for project:", config.projectId);
    } else {
      // This case is complex; ideally, you only initialize one app.
      // For simplicity, we'll log an error if a different project is already initialized.
      console.error("[Firebase Service] Mismatch: An app for a different project is already initialized. Expected:", config.projectId, "Found:", firebaseApp.options.projectId);
      // To handle this, you might need to ensure only one Firebase app is initialized or manage multiple apps.
      // For now, we'll proceed with the already initialized app, but this is a potential issue.
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
  if (!db || !storage || !firebaseApp) { // also check firebaseApp
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
    offerLetterUrl?: string; 
    consentTimestamp?: string;
  };
  personalKyc?: {
    idDocumentType?: "PAN Card" | "National ID";
    idNumber?: string;
    idTypeFromDoc?: string; // This might be redundant if idDocumentType is reliable
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
  professionalKyc?: any; 
  preferences?: any; 
  lenderRecommendations?: any; 
  selectedLenderRecommendations?: string[];
  selectedUniversities?: string[];
}


export async function saveUserApplicationData(userId: string, data: Partial<UserApplicationData>): Promise<{success: boolean, error?: string}> {
  const { db: currentDb, firebaseApp: currentApp } = ensureFirebaseInitialized();
  if (!currentDb || !currentApp) {
    return { success: false, error: "Firestore not initialized. Cannot save data." };
  }
  console.log(`[Firebase Service] Saving data for user ${userId} to collection '${CUSTOMER_COLLECTION}' in project '${currentApp.options.projectId}':`, data);
  try {
    const userDocRef = doc(currentDb, CUSTOMER_COLLECTION, userId);
    const dataToSave: Partial<UserApplicationData> = {
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
      console.log(`[Firebase Service] No application data found for user ${userId}.`);
      return { success: false, error: 'No application data found for this user.' };
    }
  } catch (error) {
    console.error('[Firebase Service] Error fetching user data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during Firestore get.' };
  }
}


export async function uploadFileToStorage(
  userId: string,
  file: File | string,
  documentPath: string
): Promise<{success: boolean, downloadURL?: string, error?: string}> {
  const { storage: currentStorage, firebaseApp: currentApp } = ensureFirebaseInitialized();
  if (!currentStorage || !currentApp) {
    return { success: false, error: "Firebase Storage not initialized. Cannot upload file." };
  }
  console.log(`[Firebase Service] Uploading file "${documentPath}" for user ${userId} to project '${currentApp.options.projectId}'.`);
  
  const sanitizedDocumentPath = documentPath.replace(/\s+/g, '_');
  const filePath = `user_documents/${userId}/${sanitizedDocumentPath}`;
  const fileStorageRefObj = storageRef(currentStorage, filePath);

  try {
    let uploadTask;
    if (typeof file === 'string') { 
      // Data URI
      const mimeTypeMatch = file.match(/^data:(.+?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream'; // Default MIME type
      const base64String = file.substring(file.indexOf(',') + 1);

      if(!base64String) throw new Error("Invalid data URI provided for uploadString.");
      console.log(`[Firebase Service] Uploading data URI as ${mimeType}`);
      uploadTask = uploadString(fileStorageRefObj, base64String, 'base64', { contentType: mimeType });
    } else { 
      // File object
      console.log(`[Firebase Service] Uploading File object: ${file.name}, type: ${file.type}`);
      uploadTask = uploadBytesResumable(fileStorageRefObj, file);
    }

    if (typeof file !== 'string') { 
        await new Promise<void>((resolve, reject) => {
            (uploadTask as any).on( 
                'state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // console.log('[Firebase Service] Upload is ' + progress + '% done for ' + documentPath);
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
    console.log(`[Firebase Service] File ${documentPath} uploaded successfully. Download URL: ${downloadURL}`);
    return { success: true, downloadURL };

  } catch (error) {
    console.error('[Firebase Service] Error uploading file ' + documentPath + ':', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during file upload.' };
  }
}



export async function checkUserExistsByMobile(mobileNumber: string, countryCodeVal: string): Promise<{success: boolean, exists: boolean, userId?: string, data?: UserApplicationData, error?: string}> {
  const { db: currentDb } = ensureFirebaseInitialized();
  if (!currentDb) {
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
      console.log(`[Firebase Service] User found with ID: ${userDoc.id}`);
      return { success: true, exists: true, userId: userDoc.id, data: userDoc.data() as UserApplicationData };
    }
    console.log(`[Firebase Service] No user found with mobile ${mobileNumber} and country code ${formattedCountryCode}`);
    return { success: true, exists: false };
  } catch (error) {
    console.error('[Firebase Service] Error checking user by mobile:', error);
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
