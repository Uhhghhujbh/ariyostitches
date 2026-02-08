import { getAuth } from './firebase-admin.js';
import admin from 'firebase-admin';

// In-memory rate limit store
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
    res.setHeader('Access-Control-Allow-Origin', '*'); // Lock down in production if needed
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
};

// Generate request ID for debugging
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Middleware wrapper
export const withMiddleware = (handler) => async (req, res) => {
    const requestId = generateRequestId();

    // 1. Handle CORS Preflight
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 1.5. CHECK FIREBASE INITIALIZATION
        if (!admin.apps.length) {
            console.error(`[${requestId}] Firebase Admin not initialized`);
            return res.status(500).json({
                error: 'Service configuration error',
                requestId,
                ...(isProduction ? {} : { details: 'Firebase Admin not initialized - check environment variables' })
            });
        }

        // 2. Rate Limiting
        if (!rateLimiter(req)) {
            console.warn(`[${requestId}] Rate limit exceeded for IP: ${req.headers['x-forwarded-for']}`);
            return res.status(429).json({ error: 'Too many requests, please try again later.', requestId });
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
                console.warn(`[${requestId}] Token verification failed:`, err.message);
                // Don't error yet, let the handler decide if auth is required
            }
        }

        // 4. Security Headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('X-Request-ID', requestId);

        // 5. Add request ID to request object for handlers
        req.requestId = requestId;

        // 6. Execute Handler
        return await handler(req, res);

    } catch (error) {
        console.error(`[${requestId}] API Error:`, error);

        // Hide internal details in production
        return res.status(500).json({
            error: 'Internal Server Error',
            requestId,
            ...(isProduction ? {} : { details: error.message })
        });
    }
};

// Helper for requiring admin access inside handlers
export const requireAdmin = (req, res) => {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({ error: 'Forbidden: Admin access required', requestId: req.requestId });
        return false;
    }
    return true;
};
