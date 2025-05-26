import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { University } from '@/types/university';

// Get Firestore instance
const db = getAdminFirestore();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await db.collection('universities').doc(params.id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error('Error fetching university:', error);
    return NextResponse.json(
      { error: 'Failed to fetch university' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json() as Partial<University>;
    
    // Check if document exists
    const doc = await db.collection('universities').doc(params.id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await db.collection('universities').doc(params.id).update(updateData);
    
    return NextResponse.json({
      id: params.id,
      ...updateData
    });
  } catch (error) {
    console.error('Error updating university:', error);
    return NextResponse.json(
      { error: 'Failed to update university' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if document exists
    const doc = await db.collection('universities').doc(params.id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    await db.collection('universities').doc(params.id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting university:', error);
    return NextResponse.json(
      { error: 'Failed to delete university' },
      { status: 500 }
    );
  }
}
