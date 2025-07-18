import { NextResponse } from 'next/server';
import { getCustomersCollection } from '@/lib/firebase';
import { getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface CustomerData {
  id?: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    [key: string]: any;
  };
  employmentInfo?: {
    [key: string]: any;
  };
  loanDetails?: {
    [key: string]: any;
  };
  documents?: any[];
  submitted: any[];
  [key: string]: any;
  createdAt?: string;
  updatedAt?: string;
}

export async function GET() {
  try {
    const customersRef = getCustomersCollection();
    const querySnapshot = await getDocs(customersRef);
    
    const customers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(customers, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch customers',
        details: error.message,
        code: error.code
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const customersRef = getCustomersCollection();
    const data = await request.json();
    
    // Basic validation
    if (!data.personalInfo || !data.personalInfo.fullName || !data.personalInfo.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const now = serverTimestamp();
    const customerData = {
      ...data,
      createdAt: now,
      updatedAt: now,
      application: {
        status: 'draft',
        ...(data.application || {})
      },
      documents: {
        submitted: [],
        ...(data.documents || {})
      }
    };
    
    const docRef = await addDoc(customersRef, customerData);
    
    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: 'Customer created successfully'
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create customer',
        details: error.message,
        code: error.code
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}

// Update a customer
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const customersRef = getCustomersCollection();
    const data = await request.json();
    
    // Don't allow updating the ID
    if (data.id) {
      delete data.id;
    }
    
    const now = serverTimestamp();
    await updateDoc(doc(customersRef, id), {
      ...data,
      updatedAt: now
    });
    
    return NextResponse.json(
      { success: true, message: 'Customer updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating customer:', error);
    
    const errorResponse = {
      success: false,
      error: 'Failed to update customer',
      details: error.message || 'Unknown error',
      ...(process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name,
        message: error.message
      } : {})
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Delete a customer
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const customersRef = getCustomersCollection();
    await deleteDoc(doc(customersRef, id));
    
    return NextResponse.json(
      { success: true, message: 'Customer deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    
    const errorResponse = {
      success: false,
      error: 'Failed to delete customer',
      details: error.message || 'Unknown error',
      ...(process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name,
        message: error.message
      } : {})
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
