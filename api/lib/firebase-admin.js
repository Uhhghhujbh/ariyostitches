import admin from 'firebase-admin';

// Environment variables - prioritize non-VITE versions for backend
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;

// Validate required credentials
const missing = [];
if (!projectId) missing.push('FIREBASE_PROJECT_ID');
if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

const hasCredentials = missing.length === 0;

// Initialize Firebase Admin SDK
if (!admin.apps.length && hasCredentials) {
    try {
        // Validate projectId format (should not contain .firebasestorage.app)
        if (projectId.includes('.firebasestorage.app')) {
            console.error('❌ Firebase Admin: FIREBASE_PROJECT_ID appears to be a storage bucket URL. It should be just the project ID (e.g., "ariyostitches-1ad08")');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket: storageBucket || `${projectId}.appspot.com`
        });
        console.log('✅ Firebase Admin Initialized');
        console.log('   Project:', projectId);
        console.log('   Bucket:', storageBucket || `${projectId}.appspot.com`);
    } catch (error) {
        console.error('❌ Firebase Admin Init Error:', error.message);
    }
} else if (!hasCredentials) {
    console.error(`❌ Firebase Admin: Missing environment variables: ${missing.join(', ')}`);
}

// Safe getter functions (throw only when used, not on import)
export const getDb = () => {
    if (!admin.apps.length) {
        throw new Error('Firebase Admin not initialized. Check environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }
    return admin.firestore();
};

export const getAuth = () => {
    if (!admin.apps.length) {
        throw new Error('Firebase Admin not initialized. Check environment variables.');
    }
    return admin.auth();
};

export const getStorage = () => {
    if (!admin.apps.length) {
        throw new Error('Firebase Admin not initialized. Check environment variables.');
    }
    return admin.storage();
};

// Legacy exports for backward compatibility
export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
export const storage = admin.apps.length ? admin.storage() : null;

export default admin;
