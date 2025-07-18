import { University } from '@/types/university';

// The result type expected by UniversityUpload.tsx
interface BulkActionResult {
  success: boolean;
  message: string;
  total: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{ row: number; message?: string; error?: string }>;
}

import { getDb } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";

// Utility to remove undefined fields from an object (shallow)
function removeUndefinedFields<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>;
}

export async function bulkUploadUniversities(
  universities: University[],
  onProgress?: (progress: number) => void
): Promise<BulkActionResult> {
  const db = getDb("university");
  const batch = writeBatch(db);
  let successCount = 0;
  let failedCount = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < universities.length; i++) {
    try {
      console.log('[BulkUpload] Adding university:', universities[i]);
      const newDoc = doc(collection(db, "universities"));
      // Remove undefined fields before uploading
      const cleaned = removeUndefinedFields(universities[i]);
      batch.set(newDoc, cleaned);
      successCount++;
    } catch (err: any) {
      failedCount++;
      errors.push({ row: i + 1, error: err.message || "Unknown error" });
      console.error('[BulkUpload] Error adding university:', err);
    }
    if (onProgress) onProgress(i + 1);
  }

  try {
    await batch.commit();
    console.log('[BulkUpload] Batch commit successful');
    return {
      success: failedCount === 0,
      message: failedCount === 0
        ? "All universities uploaded successfully."
        : `${failedCount} failed, ${successCount} processed`,
      total: universities.length,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Batch upload failed.",
      total: universities.length,
      successCount,
      failedCount: universities.length,
      errors: [{ row: 0, error: err.message || "Batch error" }],
    };
  }
}


// Simulate a bulk delete operation
export async function bulkDeleteUniversities(ids: string[]): Promise<BulkActionResult> {
  let successCount = 0;
  let failedCount = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < ids.length; i++) {
    // Simulate a random failure for demonstration
    if (!ids[i] || ids[i].toLowerCase().includes('fail')) {
      failedCount++;
      errors.push({ row: i + 2, message: 'Simulated delete failure' });
    } else {
      successCount++;
    }
  }

  return {
    success: failedCount === 0,
    message: failedCount === 0 ? 'All universities deleted successfully' : `${failedCount} failed to delete`,
    total: ids.length,
    successCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Simulate fetching universities
export async function getUniversities(): Promise<University[]> {
  // Return a mock list for demonstration
  return [
    {
      id: '1',
      name: 'Sample University',
      shortName: 'SAMPLE',
      description: 'A sample university',
      countries: ['US'],
      country: 'US',
      state: 'CA',
      city: 'Sample City',
      address: '123 Sample St',
      website: 'https://sample.edu',
      email: 'info@sample.edu',
      phone: '+1234567890',
      courses: [],
      admissionRequirements: [],
      isActive: true,
    },
  ];
}
