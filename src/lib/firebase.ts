import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MOCK_PRODUCTS } from './mockData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Seed function
export async function seedProducts() {
  try {
    const productsRef = collection(db, 'products');
    console.log(`Updating/Seeding ${MOCK_PRODUCTS.length} products...`);
    
    // Process in batches of 500
    for (let i = 0; i < MOCK_PRODUCTS.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = MOCK_PRODUCTS.slice(i, i + 500);
      
      chunk.forEach((product) => {
        const productDoc = doc(productsRef, product.id);
        batch.set(productDoc, product, { merge: true });
      });
      
      await batch.commit();
      console.log(`Batch ${i / 500 + 1} committed.`);
    }
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
// testConnection();
// seedProducts();
