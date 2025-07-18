import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { processCSVData } from '@/lib/university-utils';
import { University } from '@/types/university';

// Get Firestore instance
const db = getAdminFirestore();

export async function POST(request: Request) {
  try {
    // Check if request is multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    
    // Process CSV data
    const universities = await processCSVData(fileContent);
    
    // Save to Firestore in batch
    const batch = db.batch();
    const collectionRef = db.collection('universities');
    const results = {
      total: universities.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ name: string; error: string }>
    };

    for (const uni of universities) {
      try {
        const docRef = collectionRef.doc();
        batch.set(docRef, {
          ...uni,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          name: uni.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      message: 'Universities processed successfully',
      ...results
    });

  } catch (error) {
    console.error('Error processing university upload:', error);
    return NextResponse.json(
      { error: 'Failed to process university upload' },
      { status: 500 }
    );
  }
}
