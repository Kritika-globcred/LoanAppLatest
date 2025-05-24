import { collection, getDocs } from 'firebase/firestore';
import { getDbInstance } from './firebase';

export async function testLendersConnection() {
  try {
    const db = getDbInstance();
    console.log('🔍 Testing Firestore connection to lenders collection...');
    
    const lendersRef = collection(db, 'lenders');
    const snapshot = await getDocs(lendersRef);
    
    console.log(`✅ Successfully connected to Firestore! Found ${snapshot.size} lenders.`);
    snapshot.forEach((doc) => {
      console.log(`- ${doc.id} =>`, doc.data());
    });
    
    return true;
  } catch (error) {
    console.error('❌ Firestore connection error:', error);
    return false;
  }
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  // @ts-ignore - For testing in browser console
  window.testLendersConnection = testLendersConnection;
}
