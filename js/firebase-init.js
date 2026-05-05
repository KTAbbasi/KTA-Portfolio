import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let dbInstance = null;
let initialized = false;

export async function getFirebaseDb() {
    if (initialized) return dbInstance;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/firebase-applet-config.json', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Config missing');
        const config = await response.json();
        
        const app = initializeApp(config);
        dbInstance = getFirestore(app);
        initialized = true;
        return dbInstance;
    } catch (e) {
        console.error('Firebase Init Error:', e);
        return null;
    }
}
