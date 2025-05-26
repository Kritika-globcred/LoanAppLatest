import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log('Attempting to list collections...');
    const db = getAdminFirestore();
    const collections = await db.listCollections();
    const collectionNames = collections.map((collection: any) => collection.id);
    console.log('Successfully listed collections:', collectionNames);
    
    return NextResponse.json({
      success: true,
      collections: collectionNames
    });
  } catch (error: any) {
    console.error('Error in /api/collections:', {
      message: error.message,
      code: error.code,
      details: error.details || error
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch collections',
      message: error.message,
      code: error.code
    }, { status: 500 });
  }
}
