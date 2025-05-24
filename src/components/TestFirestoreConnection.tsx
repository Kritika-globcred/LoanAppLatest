'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';

export function TestFirestoreConnection() {
  const [lenders, setLenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLenders = async () => {
      try {
        const db = getDbInstance();
        console.log('Fetching lenders from Firestore...');
        
        const querySnapshot = await getDocs(collection(db, 'lenders'));
        const lendersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setLenders(lendersData);
        console.log('Lenders fetched successfully:', lendersData);
      } catch (err) {
        console.error('Error fetching lenders:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch lenders');
      } finally {
        setLoading(false);
      }
    };

    fetchLenders();
  }, []);

  if (loading) {
    return <div>Loading lenders...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
        <p className="mt-2 text-sm">Check browser console for more details.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-4">Lenders in Firestore</h2>
      {lenders.length === 0 ? (
        <p>No lenders found in the database.</p>
      ) : (
        <div className="space-y-2">
          {lenders.map(lender => (
            <div key={lender.id} className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium">{lender.name || 'Unnamed Lender'}</h3>
              <p className="text-sm text-gray-600">ID: {lender.id}</p>
              <pre className="text-xs mt-1 p-2 bg-black text-green-300 overflow-x-auto">
                {JSON.stringify(lender, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
