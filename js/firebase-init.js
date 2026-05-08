import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

let dbInstance = null;
let analyticsInstance = null;
let initialized = false;

export async function getFirebaseDb() {
    console.log('FirebaseInit: getFirebaseDb called. Initialized:', initialized);
    if (initialized) return dbInstance;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.error('FirebaseInit: fetch(/firebase-applet-config.json) timed out after 10s');
            controller.abort();
        }, 10000);
        
        console.log('FirebaseInit: Fetching /firebase-applet-config.json...');
        const response = await fetch('/firebase-applet-config.json', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log('FirebaseInit: Fetch response status:', response.status);
        if (!response.ok) throw new Error('Config missing (404)');
        
        const config = await response.json();
        console.log('FirebaseInit: Config loaded. Initializing app...');
        
        const app = initializeApp(config);
        dbInstance = getFirestore(app);
        
        // Initialize Analytics only if supported
        try {
            analyticsInstance = getAnalytics(app);
            console.log('FirebaseInit: Analytics initialized');
        } catch (analyticsError) {
            console.warn('FirebaseInit: Analytics not supported in this environment');
        }

        initialized = true;
        console.log('FirebaseInit: Firestore initialized successfully');
        return dbInstance;
    } catch (e) {
        console.error('FirebaseInit Error:', e);
        return null;
    }
}

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path, auth = null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
