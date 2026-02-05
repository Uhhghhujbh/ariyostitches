import admin from 'firebase-admin';

// Helper to check if credentials exist
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const missing = [];
if (!projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

const hasCredentials = missing.length === 0;

if (!admin.apps.length && hasCredentials) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
        });
        console.log('✅ Firebase Admin Initialized');
    } catch (error) {
        console.error('❌ Firebase Admin Init Error:', error.message);
    }
} else if (!hasCredentials) {
    console.error(`❌ Firebase Admin: Missing variables: ${missing.join(', ')}`);
}

// Safely export services (will throw only when used, not on import)
export const getDb = () => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized - check environment variables');
    return admin.firestore();
};

export const getAuth = () => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized - check environment variables');
    return admin.auth();
};

export const getStorage = () => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized - check environment variables');
    return admin.storage();
};

// Legacy exports for backward compatibility (may still throw if accessed before init, but less likely to kill host)
export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
export const storage = admin.apps.length ? admin.storage() : null;

export default admin;
