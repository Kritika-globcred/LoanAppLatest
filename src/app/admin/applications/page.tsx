'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

export default function ApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
          <div className="flex items-center h-16">
            <Link 
              href="/admin/dashboard" 
              className="flex items-center text-indigo-600 hover:text-indigo-900 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold">View Applications</h1>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Loan Applications</h2>
                <p className="text-gray-600">Loan application management interface will be available here.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
