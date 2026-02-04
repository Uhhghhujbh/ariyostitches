
import admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('❌ Firebase Admin Missing Credentials:', {
            hasProjectId: !!projectId,
            hasClientEmail: !!clientEmail,
            hasPrivateKey: !!privateKey
        });
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: clientEmail,
                privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined,
            }),
            storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
        });
        console.log('✅ Firebase Admin Initialized');
    } catch (error) {
        console.error('❌ Firebase Admin Initialization Error:', error.message);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage(); // Added storage export
export default admin;
