import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let app, db;
let initialized = false;

async function initFirebase() {
    if (initialized) return { db };
    try {
        const response = await fetch('/firebase-applet-config.json');
        if (!response.ok) throw new Error('No config');
        const config = await response.json();
        const { initializeApp } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');
        app = initializeApp(config);
        db = getFirestore(app);
        initialized = true;
    } catch (e) {
        // Silent fail
    }
    return { db };
}

export { initFirebase as db }; // Changed export name to clarify it returns a promise/function
