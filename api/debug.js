
import admin from 'firebase-admin';

export default async function handler(req, res) {
    const envStatus = {
        VITE_FIREBASE_PROJECT_ID: {
            configured: !!process.env.VITE_FIREBASE_PROJECT_ID,
            value_hint: process.env.VITE_FIREBASE_PROJECT_ID ? `${process.env.VITE_FIREBASE_PROJECT_ID.substring(0, 5)}...` : 'n/a'
        },
        FIREBASE_CLIENT_EMAIL: {
            configured: !!process.env.FIREBASE_CLIENT_EMAIL,
            value_hint: process.env.FIREBASE_CLIENT_EMAIL ? `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 5)}...` : 'n/a'
        },
        FIREBASE_PRIVATE_KEY: {
            configured: !!process.env.FIREBASE_PRIVATE_KEY,
            length: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
            valid_format: process.env.FIREBASE_PRIVATE_KEY ?
                (process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') && process.env.FIREBASE_PRIVATE_KEY.includes('END PRIVATE KEY')) : false
        },
        VITE_ADMIN_EMAILS: {
            configured: !!process.env.VITE_ADMIN_EMAILS
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
