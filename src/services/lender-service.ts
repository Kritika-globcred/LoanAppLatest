import { getDb } from "@/lib/firebase";
import { collection, writeBatch, doc, setDoc } from "firebase/firestore";

// Lender type can be more specific if you have a type definition
export async function bulkUploadLenders(lenders: any[]): Promise<{
  success: boolean;
  message: string;
  processed: number;
  failed: number;
  errors?: Array<{ row: number; error: string }>;
}> {
  const db = getDb("lenders");
  const batch = writeBatch(db);
  let processed = 0;
  let failed = 0;
  const errors: Array<{ row: number; error: string }> = [];

  // Utility to remove undefined fields recursively
  function removeUndefinedFields(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeUndefinedFields);
    } else if (obj && typeof obj === 'object') {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = removeUndefinedFields(value);
        }
        return acc;
      }, {} as any);
    }
    return obj;
  }

  for (let i = 0; i < lenders.length; i++) {
    const lender = lenders[i];
    try {
      const newDoc = doc(collection(db, "lenders"));
      const cleaned = removeUndefinedFields(lender);
      batch.set(newDoc, cleaned);
      processed++;
    } catch (err: any) {
      failed++;
      errors.push({ row: i + 1, error: err.message || "Unknown error" });
    }
  }

  try {
    await batch.commit();
    return {
      success: failed === 0,
      message: failed === 0 ? "All lenders uploaded successfully." : `${failed} failed, ${processed} processed`,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Batch upload failed.",
      processed,
      failed: lenders.length,
      errors: [{ row: 0, error: err.message || "Batch error" }],
    };
  }
}
