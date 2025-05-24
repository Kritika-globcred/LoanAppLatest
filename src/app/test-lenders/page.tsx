'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';

interface Lender extends DocumentData {
  id: string;
  name?: string;
  email?: string;
}

export default function TestLendersPage() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firestoreInfo, setFirestoreInfo] = useState<{
    projectId: string;
    databaseId: string;
    appName: string;
    config: {
      apiKey: string;
      projectId: string;
      authDomain: string;
    };
  } | null>(null);

  useEffect(() => {
    const fetchLenders = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Initializing Firestore connection...');
        const db = getDbInstance();
        
        const dbInfo = {
          projectId: db.app.options.projectId || '',
          databaseId: (db as any)._databaseId?.databaseId || '(default)',
          appName: db.app.name,
          config: {
            apiKey: db.app.options.apiKey || '',
            projectId: db.app.options.projectId || '',
            authDomain: db.app.options.authDomain || ''
          }
        };
        
        setFirestoreInfo(dbInfo);
        console.log('Firestore initialized with config:', dbInfo);

        // Fetch lenders collection
        console.log('Fetching lenders collection...');
        const lendersSnapshot = await getDocs(collection(db, 'lenders'));
        const lendersData = lendersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lender[];

        console.log('Fetched lenders:', lendersData);
        setLenders(lendersData);
      } catch (err) {
        const error = err as Error;
        console.error('Error fetching lenders:', error);
        setError(`Failed to fetch lenders: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLenders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lenders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lenders Database Test</h1>
          <p className="text-gray-600">Testing Firestore connection and data retrieval</p>
        </div>

        {firestoreInfo && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Firestore Connection Info</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Firebase project and database information</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Project ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {firestoreInfo.projectId}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Database ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {firestoreInfo.databaseId}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">App Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {firestoreInfo.appName}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">API Key</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                    {firestoreInfo.config.apiKey ? `••••••••${firestoreInfo.config.apiKey.slice(-4)}` : 'Not available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Lenders</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {lenders.length} {lenders.length === 1 ? 'lender' : 'lenders'} found
            </p>
          </div>
          <div className="border-t border-gray-200">
            {lenders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {lenders.map((lender) => (
                  <li key={lender.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-indigo-600 truncate">
                          {lender.name || 'Unnamed Lender'}
                        </h4>
                        {lender.email && (
                          <p className="mt-1 text-sm text-gray-500">{lender.email}</p>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Document ID: {lender.id}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No lenders found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no lenders in the database yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
