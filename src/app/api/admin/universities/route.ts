import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { University } from '@/types/university';

// Get Firestore instance
const db = getAdminFirestore();

export async function GET() {
  try {
    const snapshot = await db.collection('universities').get();
    const universities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as University[];

    return NextResponse.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as Omit<University, 'id' | 'createdAt' | 'updatedAt'>;
    
    // Basic validation
    if (!data.name || !data.country) {
      return NextResponse.json(
        { error: 'Name and country are required' },
        { status: 400 }
      );
    }

    const universityData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: data.isActive ?? true
    };

    const docRef = await db.collection('universities').add(universityData);
    
    return NextResponse.json({
      id: docRef.id,
      ...universityData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating university:', error);
    return NextResponse.json(
      { error: 'Failed to create university' },
      { status: 500 }
    );
  }
}
