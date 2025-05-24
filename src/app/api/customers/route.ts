import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

// Get Firestore instance
const db = getAdminFirestore();

export async function GET() {
  console.log('GET /api/customers called');
  
  try {
    console.log('Attempting to connect to Firestore...');
    
    // Query the 'customer' collection
    const customersSnapshot = await db.collection('customer').get();
    console.log(`Found ${customersSnapshot.size} customers`);
    
    const customers = customersSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Customer ${doc.id}:`, JSON.stringify(data, null, 2));
      return {
        id: doc.id,
        ...data
      };
    });
    
    const responseData = { 
      success: true, 
      data: customers,
      count: customers.length
    };
    
    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(
      responseData,
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        } 
      }
    );
    
  } catch (error) {
    console.error('API Error:', error);
    
    const errorResponse = { 
      success: false, 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { 
        stack: error.stack,
        name: error.name,
        message: error.message
      } : {})
    };
    
    console.error('Error response:', JSON.stringify(errorResponse, null, 2));
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}
