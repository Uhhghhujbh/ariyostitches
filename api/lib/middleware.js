
import { auth } from './firebase-admin.js';

// Helper to set CORS headers
export const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Update for production
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
};

// Middleware wrapper
export const withMiddleware = (handler) => async (req, res) => {
    // 1. Handle CORS Preflight
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 2. Token Verification (Optimistic)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decodedToken = await auth.verifyIdToken(token);
                req.user = decodedToken;

                // Check if user is admin
                const adminEmails = (process.env.VITE_ADMIN_EMAILS || '').toLowerCase().split(',');
                if (req.user.email && adminEmails.includes(req.user.email.toLowerCase())) {
                    req.user.isAdmin = true;
                }
            } catch (err) {
                console.warn('Token verification failed:', err.message);
                // Don't error yet, let the handler decide if auth is required
            }
        }

        // 3. Rate Limiting (Placeholder)
        // Ideally use Vercel KV or Edge Middleware here

        // 4. Execute Handler
        return await handler(req, res);

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

// Helper for requiring admin access inside handlers
export const requireAdmin = (req, res) => {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return false;
    }
    return true;
};
