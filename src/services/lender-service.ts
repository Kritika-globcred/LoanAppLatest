import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Lender } from '@/types/lender';

const LENDERS_COLLECTION = 'lenders';

export const getLenders = async (): Promise<Lender[]> => {
  try {
    const q = query(collection(db, LENDERS_COLLECTION), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Lender[];
  } catch (error) {
    console.error('Error getting lenders:', error);
    throw error;
  }
};

export const addLender = async (lender: Omit<Lender, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, LENDERS_COLLECTION), {
      ...lender,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding lender:', error);
    throw error;
  }
};

export const updateLender = async (id: string, lender: Partial<Lender>): Promise<void> => {
  try {
    await updateDoc(doc(db, LENDERS_COLLECTION, id), {
      ...lender,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating lender:', error);
    throw error;
  }
};

export const deleteLender = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, LENDERS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting lender:', error);
    throw error;
  }
};
