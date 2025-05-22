import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch, 
  serverTimestamp, 
  limit, 
  startAfter, 
  getCountFromServer,
  DocumentData,
  CollectionReference,
  QueryDocumentSnapshot,
  Query,
  where,
  getFirestore
} from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { University, BulkUploadResult } from '@/types/university';
import { v4 as uuidv4 } from 'uuid';

const UNIVERSITIES_COLLECTION = 'universities';
const PAGE_SIZE = 20; // Number of items per page

export const getUniversities = async (page = 1): Promise<{ data: University[], pagination: { currentPage: number, totalPages: number, totalItems: number, hasNextPage: boolean, hasPreviousPage: boolean } }> => {
  try {
    const db = getDbInstance();
    const universitiesRef = collection(db, UNIVERSITIES_COLLECTION);
    
    // Get total count
    const countSnapshot = await getCountFromServer(universitiesRef);
    const totalItems = countSnapshot.data().count;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    // Adjust page number if it's out of bounds
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * PAGE_SIZE;

    // Create base query
    let q = query(
      universitiesRef,
      orderBy('name'),
      limit(PAGE_SIZE)
    );
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Map documents to University array
    const universities = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as University;
    });
    
    return {
      data: universities,
      pagination: {
        currentPage: currentPage,
        totalPages,
        totalItems,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    };
  } catch (error) {
    console.error('Error getting universities:', error);
    throw error;
  }
};

export const addUniversity = async (university: Omit<University, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const db = getDbInstance();
    const docRef = await addDoc(collection(db, UNIVERSITIES_COLLECTION), {
      ...university,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding university:', error);
    throw error;
  }
};

export const updateUniversity = async (id: string, university: Partial<University>): Promise<void> => {
  try {
    const db = getDbInstance();
    await updateDoc(doc(db, UNIVERSITIES_COLLECTION, id), {
      ...university,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating university:', error);
    throw error;
  }
};

export const deleteUniversity = async (id: string): Promise<void> => {
  try {
    const db = getDbInstance();
    await deleteDoc(doc(db, UNIVERSITIES_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting university:', error);
    throw error;
  }
};

/**
 * Bulk upload universities from a CSV file
 * @param universities Array of university data to upload
 * @param onProgress Optional progress callback
 * @returns BulkUploadResult with upload statistics
 */
export const bulkUploadUniversities = async (
  universities: Omit<University, 'id' | 'createdAt' | 'updatedAt'>[],
  onProgress?: (progress: number) => void
): Promise<BulkUploadResult> => {
  try {
    const db = getDbInstance();
    const batchSize = 500; // Firestore batch limit
    const total = universities.length;
    let successCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Process in batches to avoid Firestore limits
    for (let i = 0; i < universities.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchEnd = Math.min(i + batchSize, universities.length);
      
      // Add each university in the current batch
      for (let j = i; j < batchEnd; j++) {
        const university = universities[j];
        const docRef = doc(collection(db, UNIVERSITIES_COLLECTION));
        
        try {
          // Prepare university data with timestamps
          const universityData = {
            ...university,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          batch.set(docRef, universityData);
          successCount++;
        } catch (error) {
          console.error(`Error preparing university at index ${j}:`, error);
          errors.push({
            row: j + 1, // 1-based index for user feedback
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        
        // Update progress
        if (onProgress) {
          onProgress(Math.round(((j + 1) / total) * 100));
        }
      }
      
      // Commit the current batch
      try {
        await batch.commit();
      } catch (batchError) {
        console.error('Error committing batch:', batchError);
        // If batch fails, mark all items in this batch as failed
        for (let j = i; j < batchEnd; j++) {
          errors.push({
            row: j + 1,
            error: 'Batch upload failed',
          });
        }
        successCount -= (batchEnd - i);
      }
    }
    
    return {
      success: errors.length === 0,
      message: `Successfully uploaded ${successCount} of ${total} universities`,
      total,
      successCount,
      failedCount: total - successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Bulk upload failed:', error);
    return {
      success: false,
      message: 'Bulk upload failed',
      total: 0,
      successCount: 0,
      failedCount: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
};
