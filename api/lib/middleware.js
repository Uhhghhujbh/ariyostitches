import { getAuth } from './firebase-admin.js';
import admin from 'firebase-admin';

// In-memory rate limit store (Note: Resets on cold start, but effective for DDOS bursts on warm instances)
const rateLimitMap = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute per IP

const cleanRateLimitMap = () => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
};

// Periodic cleanup (every 5 mins)
setInterval(cleanRateLimitMap, 5 * 60 * 1000);

export const rateLimiter = (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    const limitData = rateLimitMap.get(ip);
    if (now > limitData.resetTime) {
        limitData.count = 1;
        limitData.resetTime = now + RATE_LIMIT_WINDOW;
        return true;
    }

    if (limitData.count >= MAX_REQUESTS) {
        return false;
    }

    limitData.count++;
    return true;
};

// Helper to set CORS headers
export const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Consider locking this down to your Vercel domain in production
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
        // 1.5. CHECK FIREBASE INITIALIZATION
        if (!admin.apps.length) {
            return res.status(500).json({
                error: 'Firebase Admin not initialized',
                details: 'Missing credentials in Vercel environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)'
            });
        }

        // 2. Rate Limiting
        if (!rateLimiter(req)) {
            console.warn(`Rate limit exceeded for IP: ${req.headers['x-forwarded-for']}`);
            return res.status(429).json({ error: 'Too many requests, please try again later.' });
        }

        // 3. Token Verification (Optimistic)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const auth = getAuth();
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

        // 4. Security Headers (Helmet-lite)
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // 5. Execute Handler
        return await handler(req, res);

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message }); // Hide details in prod
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
