
import admin from 'firebase-admin';

export default async function handler(req, res) {
    const envStatus = {
        FIREBASE_PROJECT_ID: {
            configured: !!process.env.VITE_FIREBASE_PROJECT_ID,
            source: 'VITE_FIREBASE_PROJECT_ID'
        },
        FIREBASE_CLIENT_EMAIL: {
            configured: !!process.env.FIREBASE_CLIENT_EMAIL,
            source: 'FIREBASE_CLIENT_EMAIL'
        },
        FIREBASE_PRIVATE_KEY: {
            configured: !!process.env.FIREBASE_PRIVATE_KEY,
            length: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0
        },
        FIREBASE_ADMIN_INIT: {
            initialized: admin.apps.length > 0
        },
        NODE_ENV: process.env.NODE_ENV
    };

    // NEVER expose the actual values, only the presence/length
    return res.status(200).json({
        message: "Ariyo Stitches Backend Diagnostics",
        timestamp: new Date().toISOString(),
        environment: envStatus,
        instructions: "If any variables are missing, please add them in the Vercel Dashboard under Settings > Environment Variables."
    });
}
