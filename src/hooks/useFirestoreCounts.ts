'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

interface RecordCounts {
  customers: number | null;
  lenders: number | null;
  universities: number | null;
  loading: boolean;
  error: Error | null;
}

export function useFirestoreCounts() {
  const [state, setState] = useState<RecordCounts>({
    customers: null,
    lenders: null,
    universities: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Get database instances for each database
        const customerDb = getDb('customer');
        const lendersDb = getDb('lenders');
        const universityDb = getDb('university');
        
        // Fetch data from each database
        const [
          customerSnapshot, 
          lendersSnapshot, 
          universitiesSnapshot
        ] = await Promise.all([
          // Get all documents from each collection and count them
          getDocs(collection(customerDb, 'customer')),
          getDocs(collection(lendersDb, 'lenders')),
          getDocs(collection(universityDb, 'universities'))
        ]);

        setState({
          customers: customerSnapshot.size,
          lenders: lendersSnapshot.size,
          universities: universitiesSnapshot.size,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error fetching record counts:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Failed to fetch record counts'),
        }));
      }
    };

    fetchCounts();
  }, []);

  return state;
}
