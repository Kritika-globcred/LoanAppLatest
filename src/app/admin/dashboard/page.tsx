'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4">{user.email}</span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to the Admin Dashboard</h2>
                <p className="text-gray-600">You are successfully logged in as {user.email}</p>
                
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Dashboard cards */}
                  <Link 
                    href="/admin/universities"
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Universities</h3>
                      <p className="mt-2 text-sm text-gray-500">Add, edit, or remove universities</p>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/admin/lenders"
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Lenders</h3>
                      <p className="mt-2 text-sm text-gray-500">Manage lender information and criteria</p>
                    </div>
                  </Link>
                  
                  <Link 
                    href="/admin/applications"
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">View Applications</h3>
                      <p className="mt-2 text-sm text-gray-500">Review and process loan applications</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
