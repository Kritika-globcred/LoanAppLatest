import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const getServiceAccount = () => {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Missing required Firebase Admin environment variables');
  }

  return {
    type: 'service_account',
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID || '',
    private_key: privateKey,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID || '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_ADMIN_CLIENT_EMAIL)}`,
    universe_domain: 'googleapis.com'
  };
};

// Initialize the admin app if it doesn't exist
let adminApp;
if (!getApps().length) {
  try {
    const serviceAccount = getServiceAccount();
    adminApp = initializeApp({
      credential: cert(serviceAccount as any), // Type assertion to handle the ServiceAccount type
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    }, 'customer-db');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
