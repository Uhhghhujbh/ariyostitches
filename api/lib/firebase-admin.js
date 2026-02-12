import admin from 'firebase-admin';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
    if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
        const missing = [];
        if (!PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
        if (!CLIENT_EMAIL) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!PRIVATE_KEY) missing.push('FIREBASE_PRIVATE_KEY');
        console.error('[FATAL] Missing env vars:', missing.join(', '));
    } else {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: PROJECT_ID,
                    clientEmail: CLIENT_EMAIL,
                    privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log('[OK] Firebase Admin ready — project:', PROJECT_ID);
        } catch (err) {
            console.error('[FATAL] Firebase Admin init failed:', err.message);
        }
    }
}

export function getDb() {
    if (!admin.apps.length) throw new Error('Firebase not initialized');
    return admin.firestore();
}

export function getAuth() {
    if (!admin.apps.length) throw new Error('Firebase not initialized');
    return admin.auth();
}

export default admin;
