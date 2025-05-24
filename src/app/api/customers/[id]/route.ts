import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');

// Initialize the admin app if it doesn't exist
let adminApp;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
  }, 'customer-db');
} else {
  adminApp = getApps().find(app => app.name === 'customer-db') || getApps()[0];
}

// Get Firestore instance with the customer database
const db = getFirestore(adminApp);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    const updateData = await request.json();
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    // Update the customer document in the 'customer' collection
    const customerRef = db.collection('customer').doc(customerId);
    await customerRef.update(updateData);
    
    // Get the updated document
    const doc = await customerRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { id: doc.id, ...doc.data() } 
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}
