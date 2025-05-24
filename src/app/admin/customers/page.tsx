'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { debounce } from 'lodash';

interface DocumentInfo {
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  url: string;
  name: string;
  submittedAt: Timestamp | Date;
  size?: number;
  contentType?: string;
  reviewedAt?: Date;
}

interface Customer {
  id: string;
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  application?: {
    status?: string;
    lastStepCompleted?: string;
    submittedAt?: Timestamp;
    updatedAt?: Timestamp;
  };
  documents?: {
    submitted?: DocumentInfo[];
  };
  recommendations?: string[];
  [key: string]: any;
}

export default function CustomersPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingDoc, setUpdatingDoc] = useState<{customerId: string, docIndex: number} | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{success: boolean; message: string} | null>(null);

  // Fetch customers data from the API
  const fetchCustomers = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching customers from /api/customers...');
      const response = await fetch('/api/customers');
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get the response text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // Try to parse as JSON
      try {
        const result = JSON.parse(responseText);
        
        if (!response.ok) {
          console.error('API Error Response:', result);
          throw new Error(result.error || result.message || 'Failed to fetch customers');
        }
        
        console.log('Parsed response data:', result);
        
        const customersData = Array.isArray(result.data) 
          ? result.data.map((customer: any) => ({
              ...customer,
              personalInfo: customer.personalInfo || {},
              documents: customer.documents || { submitted: [] },
              application: customer.application || {}
            }))
          : [];
        
        console.log(`Processed ${customersData.length} customers`);
        setCustomers(customersData);
        
      } catch (parseError: unknown) {
        const errorMessage = parseError instanceof Error 
          ? parseError.message 
          : 'Failed to parse response';
        console.error('Failed to parse JSON response:', errorMessage);
        console.error('Response text that failed to parse:', responseText);
        throw new Error(`Invalid response from server: ${errorMessage}`);
      }
      
    } catch (err) {
      console.error('Error in fetchCustomers:', err);
      setError(err instanceof Error 
        ? `Failed to load customers: ${err.message}` 
        : 'An unknown error occurred while loading customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  // Initial data fetch
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Update document status
  const updateDocumentStatus = async (customerId: string, docIndex: number, status: 'pending' | 'approved' | 'rejected') => {
    try {
      setUpdatingDoc({ customerId, docIndex });
      const customer = customers.find(c => c.id === customerId);
      
      if (!customer || !customer.documents?.submitted?.[docIndex]) return;
      
      const updatedDocs = [...(customer.documents.submitted || [])];
      const currentDoc = updatedDocs[docIndex];
      const updatedDoc: DocumentInfo = {
        ...currentDoc, // Spread all existing properties first
        status,        // Then override the status
        reviewedAt: new Date()
      };
      updatedDocs[docIndex] = updatedDoc;
      
      // Update document status via API
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'documents.submitted': updatedDocs
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document status');
      }
      
      // Refresh the customer data
      await fetchCustomers();
      
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
  };

  // Handle search input changes with debounce
  const handleSearchChange = useCallback(debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, 300), []);

  // Format date for display
  const formatDate = useCallback((date: Timestamp | Date | undefined) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get document icon based on content type
  const getDocumentIcon = useCallback((contentType?: string) => {
    if (!contentType) return '📄';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('image')) return '🖼️';
    if (contentType.includes('word')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    return '📎';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center">
                <svg
                  className="h-8 w-8 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <h1 className="text-xl font-bold ml-2">Loan Application Portal</h1>
              </Link>
              <h1 className="text-xl font-bold ml-6">Customer Applications</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-700">{user?.email}</span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="max-w-xl">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Customers
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name, email, or phone..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {updateStatus && (
            <div className={`mb-6 p-4 rounded-md ${updateStatus.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              <div className="flex items-center">
                {updateStatus.success ? (
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p className="text-sm font-medium">{updateStatus.message}</p>
              </div>
            </div>
          )}
          {error && !updateStatus && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-600">Loading customers...</span>
            </div>
          ) : customers.length > 0 ? (
            <div className="space-y-6">
              {customers.map((customer) => (
                <div key={customer.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {customer.personalInfo?.fullName || 'Unnamed Customer'}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {customer.personalInfo?.email || 'No email provided'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/customers/${customer.id}`}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => {}}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200">
                    <dl className="divide-y divide-gray-200">
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Application Status</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            customer.application?.status === 'approved' ? 'bg-green-100 text-green-800' :
                            customer.application?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {customer.application?.status?.replace('_', ' ') || 'Pending'}
                          </span>
                          {customer.application?.updatedAt && (
                            <span className="ml-2 text-xs text-gray-500">
                              Last updated: {formatDate(customer.application.updatedAt)}
                            </span>
                          )}
                        </dd>
                      </div>
                      
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Contact Information</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium">Phone</p>
                              <p className="text-gray-600">{customer.personalInfo?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="font-medium">Email</p>
                              <p className="text-gray-600">{customer.personalInfo?.email || 'Not provided'}</p>
                            </div>
                            {customer.application?.submittedAt && (
                              <div>
                                <p className="font-medium">Application Date</p>
                                <p className="text-gray-600">{formatDate(customer.application.submittedAt)}</p>
                              </div>
                            )}
                          </div>
                        </dd>
                      </div>

                      {customer.documents?.submitted?.length ? (
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Submitted Documents</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                              {customer.documents.submitted.map((doc, index) => (
                                <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                  <div className="w-0 flex-1 flex items-center">
                                    <span className="mr-2">{getDocumentIcon(doc.contentType)}</span>
                                    <span className="flex-1 w-0 truncate">
                                      {doc.name}
                                      <span className="text-gray-500 ml-2">({doc.type})</span>
                                    </span>
                                  </div>
                                  <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                                    <span className="text-gray-500 text-sm">
                                      {formatFileSize(doc.size)}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <div className="relative">
                                        <select
                                          value={doc.status}
                                          onChange={(e) => updateDocumentStatus(customer.id, index, e.target.value as any)}
                                          className={`appearance-none text-xs rounded border ${
                                            doc.status === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                                            doc.status === 'approved' ? 'bg-green-50 text-green-800 border-green-200' :
                                            'bg-red-50 text-red-800 border-red-200'
                                          } pl-2 pr-6 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                          disabled={updatingDoc?.customerId === customer.id && updatingDoc?.docIndex === index}
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
                                        {updatingDoc?.customerId === customer.id && updatingDoc?.docIndex === index && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                                            <div className="h-4 w-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                          </div>
                                        )}
                                      </div>
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-indigo-600 hover:text-indigo-500 text-sm"
                                        title="View document"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </a>
                                      <a
                                        href={doc.url}
                                        download
                                        className="text-gray-500 hover:text-gray-700"
                                        title="Download document"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                      </a>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      ) : (
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Documents</dt>
                          <dd className="mt-1 text-sm text-gray-500 sm:mt-0 sm:col-span-2">
                            No documents have been submitted yet.
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'No customers match your search. Try a different search term.'
                  : 'No customer data available. Customers will appear here once they submit their applications.'
                }
              </p>
              {searchTerm && (
                <div className="mt-4">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
