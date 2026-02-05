
import admin from 'firebase-admin';

export default async function handler(req, res) {
    // 1. Check specific standard names
    const envStatus = {
        VITE_FIREBASE_PROJECT_ID: {
            configured: !!process.env.VITE_FIREBASE_PROJECT_ID,
            hint: process.env.VITE_FIREBASE_PROJECT_ID ? `${process.env.VITE_FIREBASE_PROJECT_ID.substring(0, 5)}...` : 'n/a'
        },
        FIREBASE_CLIENT_EMAIL: {
            configured: !!process.env.FIREBASE_CLIENT_EMAIL,
            hint: process.env.FIREBASE_CLIENT_EMAIL ? `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 5)}...` : 'n/a'
        },
        FIREBASE_PRIVATE_KEY: {
            configured: !!process.env.FIREBASE_PRIVATE_KEY,
            length: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
            has_newlines: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.includes('\n') : false
        },
        FIREBASE_ADMIN_INIT: {
            initialized: admin.apps.length > 0
        }
    };

    // 2. Scan for ALL FIREBASE related vars (SAFELY)
    const allFirebaseVars = Object.keys(process.env)
        .filter(key => key.toLowerCase().includes('firebase') || key.toLowerCase().includes('project_id'))
        .map(key => ({ key, present: true, is_vite: key.startsWith('VITE_') }));

    return res.status(200).json({
        message: "Ariyo Stitches Diagnostics",
        environment: envStatus,
        detected_vars: allFirebaseVars,
        node_version: process.version,
        timestamp: new Date().toISOString()
    });
}
