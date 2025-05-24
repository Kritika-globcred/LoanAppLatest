import { collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, listAll } from 'firebase/storage';
import { getDbInstance, getStorageInstance } from './firebase';

export async function testFirestoreConnection() {
  try {
    const db = getDbInstance();
    console.log('Testing Firestore connection...');
    
    // Try to get a document from the lenders collection
    const lendersRef = collection(db, 'lenders');
    const snapshot = await getDocs(lendersRef);
    
    console.log(`✅ Successfully connected to Firestore! Found ${snapshot.size} lenders.`);
    return true;
  } catch (error) {
    console.error('❌ Firestore connection error:', error);
    return false;
  }
}

export async function testStorageConnection() {
  try {
    const storage = getStorageInstance();
    if (!storage) {
      console.error('❌ Storage instance is not available');
      return false;
    }
    
    console.log('Testing Storage connection...');
    const storageRef = ref(storage, '/');
    const result = await listAll(storageRef);
    
    console.log(`✅ Successfully connected to Storage! Found ${result.items.length} files.`);
    return true;
  } catch (error) {
    console.error('❌ Storage connection error:', error);
    return false;
  }
}

export async function testAllConnections() {
  console.log('=== Testing Firebase Connections ===');
  await testFirestoreConnection();
  await testStorageConnection();  
  console.log('=== Tests Complete ===');
}

// Run the tests if this file is executed directly in the browser
if (typeof window !== 'undefined') {
  testAllConnections();
}
