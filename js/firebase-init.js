import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let dbInstance = null;
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
        initialized = true;
        console.log('FirebaseInit: Firestore initialized successfully');
        return dbInstance;
    } catch (e) {
        console.error('FirebaseInit Error:', e);
        return null;
    }
}
