'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { getCustomersCollection, getDbInstance } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  collection
} from 'firebase/firestore';

interface DocumentInfo {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date | { toDate: () => Date } | string;
  reviewedAt?: Date | { toDate: () => Date } | string;
  reviewerId?: string;
  [key: string]: any;
}

interface Customer {
  id: string;
  personalKyc: {
    nameOnPassport: string;
    email: string;
    mobileNumber: string;
    countryCode?: string;
    [key: string]: any;
  };
  admissionKyc: {
    courseName: string;
    universityName: string;
    admissionLevel: string;
    offerLetterUrl?: string;
    countryOfStudy?: string;
    [key: string]: any;
  };
  documents: {
    submitted: DocumentInfo[];
  };
  applicationStatus: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

// Helper function to safely convert Firestore timestamps to Date objects
const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  return new Date(value);
};

// Format timestamp for display
const formatTimestamp = (timestamp: Date | { toDate: () => Date } | string | undefined): string => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp as string);
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusText = {
    draft: 'Draft',
    submitted: 'Submitted',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
      {statusText[status as keyof typeof statusText] || status}
    </span>
  );
};

// Document status dropdown component
const DocumentStatusDropdown = ({
  status,
  customerId,
  docIndex,
  updatingDoc,
  onUpdateStatus
}: {
  status: string;
  customerId: string;
  docIndex: number;
  updatingDoc: { customerId: string; docIndex: number } | null;
  onUpdateStatus: (customerId: string, docIndex: number, status: 'pending' | 'approved' | 'rejected') => void;
}) => (
  <div className="relative">
    <select
      value={status}
      onChange={(e) => onUpdateStatus(customerId, docIndex, e.target.value as 'pending' | 'approved' | 'rejected')}
      className={`appearance-none text-xs rounded border ${
        status === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
        status === 'approved' ? 'bg-green-50 text-green-800 border-green-200' :
        'bg-red-50 text-red-800 border-red-200'
      } pl-2 pr-6 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
      disabled={updatingDoc?.customerId === customerId && updatingDoc?.docIndex === docIndex}
    >
      <option value="pending" className="bg-yellow-50">Pending</option>
      <option value="approved" className="bg-green-50">Approved</option>
      <option value="rejected" className="bg-red-50">Rejected</option>
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  </div>
);

// Search input component
const SearchInput = ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="relative">
    <input
      type="text"
      placeholder="Search customers..."
      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      value={value}
      onChange={onChange}
    />
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingDoc, setUpdatingDoc] = useState<{ customerId: string; docIndex: number } | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Set up real-time listener for customers
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Setting up Firestore listener for customers...');
      const customersQuery = query(
        getCustomersCollection(),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        customersQuery,
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          const customersData = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            
            // Extract and flatten the customer data
            const customerData: Customer = {
              id: doc.id,
              // Personal Info
              personalKyc: {
                nameOnPassport: data.personalKyc?.nameOnPassport || 'N/A',
                email: data.email || data.personalKyc?.email || 'N/A',
                mobileNumber: data.mobileNumber || data.personalKyc?.mobileNumber || 'N/A',
                countryCode: data.countryCode || data.personalKyc?.countryCode || '',
                ...data.personalKyc,
              },
              // Admission Info
              admissionKyc: {
                courseName: data.admissionKyc?.courseName || 'N/A',
                universityName: data.admissionKyc?.universityName || 'N/A',
                admissionLevel: data.admissionKyc?.admissionLevel || 'N/A',
                offerLetterUrl: data.admissionKyc?.offerLetterUrl || null,
                ...data.admissionKyc,
              },
              // Application Info
              applicationStatus: data.applicationStatus || data.application?.status || 'draft',
              // Documents
              documents: data.documents || { submitted: [] },
              // Timestamps
              createdAt: toDate(data.createdAt || new Date()),
              updatedAt: toDate(data.updatedAt || new Date()),
              // Spread the rest of the data
              ...data
            };
            
            return customerData;
          });
          
          console.log('Processed customers data:', customersData);
          setCustomers(customersData);
          setLoading(false);
        },
        (error: Error) => {
          console.error('Error in customers listener:', error);
          setError('Failed to load customers. Please try again.');
          setLoading(false);
        }
      );
      
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      console.error('Error setting up Firestore listener:', errorMessage, err);
      setError(errorMessage);
      setLoading(false);
    }
  }, [user, router]);

  // Update document status
  const handleUpdateDocumentStatus = useCallback(async (customerId: string, docIndex: number, status: 'pending' | 'approved' | 'rejected') => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setUpdatingDoc({ customerId, docIndex });
      const customer = customers.find(c => c.id === customerId);
      
      if (!customer?.documents?.submitted?.[docIndex]) return;
      
      const updatedDocs = [...(customer.documents.submitted || [])];
      const currentDoc = updatedDocs[docIndex];
      const updatedDoc: DocumentInfo = {
        ...currentDoc,
        status,
        reviewedAt: new Date()
      };
      updatedDocs[docIndex] = updatedDoc;
      
      // Update document status directly in Firestore
      const customerRef = doc(getDbInstance(), 'customers', customerId);
      await updateDoc(customerRef, {
        'documents.submitted': updatedDocs,
        updatedAt: serverTimestamp()
      });
      
      // Show success message
      setUpdateStatus({
        success: true,
        message: `Document status updated to ${status}`
      });
      
      // Clear the status message after 3 seconds
      setTimeout(() => setUpdateStatus(null), 3000);
      
    } catch (err) {
      console.error('Error updating document status:', err);
      setUpdateStatus({
        success: false,
        message: 'Failed to update document status. Please try again.'
      });
    } finally {
      setUpdatingDoc(null);
    }
  }, [customers, user, router]);

  // Filter and sort customers based on search term and sort config
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => {
        const name = customer.personalKyc?.nameOnPassport?.toLowerCase() || '';
        const email = customer.personalKyc?.email?.toLowerCase() || '';
        const phone = customer.personalKyc?.mobileNumber?.toLowerCase() || '';
        const course = customer.admissionKyc?.courseName?.toLowerCase() || '';
        const university = customer.admissionKyc?.universityName?.toLowerCase() || '';
        
        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          course.includes(searchLower) ||
          university.includes(searchLower) ||
          customer.id?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      // Handle nested properties
      const keys = sortConfig.key.toString().split('.');
      aValue = keys.reduce((obj: any, key: string) => obj?.[key], a);
      bValue = keys.reduce((obj: any, key: string) => obj?.[key], b);
      
      // Handle dates
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      if (aValue === bValue) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return filtered;
  }, [customers, searchTerm, sortConfig]);

  // Create a ref for the debounced search function
  const debouncedSetSearchTerm = useRef(
    debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset to first page on new search
    }, 300)
  ).current;

  // Handle search input changes
  const onSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchTerm(e.target.value);
  }, [debouncedSetSearchTerm]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);
  const currentItems = filteredAndSortedCustomers.slice(indexOfFirstItem, indexOfLastItem);

  // Loading and error states are handled in the main return statement

  // Pagination handlers
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel();
    };
  }, [debouncedSetSearchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Loading customers...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header and search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Customers</h2>
          <div className="w-full md:w-96">
            <SearchInput value={searchTerm} onChange={onSearchInputChange} />
          </div>
        </div>

        {/* Status message */}
        {updateStatus && (
          <div className={`mb-4 p-4 rounded ${updateStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {updateStatus.message}
          </div>
        )}

        {/* Customers table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.personalKyc?.nameOnPassport || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">ID: {customer.id}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.admissionKyc?.courseName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.admissionKyc?.admissionLevel || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.admissionKyc?.universityName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.admissionKyc?.countryOfStudy || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.personalKyc?.mobileNumber 
                            ? `${customer.personalKyc.countryCode || ''} ${customer.personalKyc.mobileNumber}` 
                            : 'N/A'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.personalKyc?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={customer.applicationStatus || 'draft'} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {customer.admissionKyc?.offerLetterUrl && (
                            <a
                              href={customer.admissionKyc.offerLetterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Offer Letter"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </a>
                          )}
                          <Link 
                            href={`/admin/customers/${customer.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'No customers found matching your search' : 'No customers found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredAndSortedCustomers.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredAndSortedCustomers.length}</span> customers
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
