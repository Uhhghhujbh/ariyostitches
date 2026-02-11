// ===================================
// API Middleware — Security Gateway
// ===================================
// Every API request flows through this.
// Order: CORS → Firebase check → Rate limit → Auth → Security headers → Handler

import admin from 'firebase-admin';
import { getAuth } from './firebase-admin.js';

// ---- Admin email list (from env, NOT VITE_) ----
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
    .toLowerCase()
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

// ---- Rate limiter (in-memory, per serverless instance) ----
const hits = new Map();
const WINDOW = 60_000; // 1 minute
const MAX_PUBLIC = 20;  // public endpoints
const MAX_ADMIN = 60;   // admin endpoints (more lenient since authed)

function rateLimit(ip, limit = MAX_PUBLIC) {
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now > entry.reset) {
        hits.set(ip, { count: 1, reset: now + WINDOW });
        return true;
    }
    entry.count++;
    return entry.count <= limit;
}

// Cleanup stale entries every 5 min
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
        if (now > entry.reset) hits.delete(ip);
    }
}, 300_000);

// ---- CORS ----
function setCors(req, res) {
    // Allow your Vercel domain + localhost for dev
    const allowedOrigins = [
        'https://ariyostitches.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173',
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.some(o => origin.startsWith(o))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Fallback: allow same-origin requests (no Origin header)
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// ---- Security headers (anti-clickjacking, anti-XSS, anti-MIME sniff) ----
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

// ---- Main middleware wrapper ----
export function withMiddleware(handler) {
    return async (req, res) => {
        // 1. CORS
        setCors(req, res);
        if (req.method === 'OPTIONS') return res.status(200).end();

        // 2. Security headers
        setSecurityHeaders(res);

        try {
            // 3. Firebase must be initialized
            if (!admin.apps.length) {
                console.error('[API] Firebase Admin not initialized');
                return res.status(503).json({ error: 'Service unavailable' });
            }

            // 4. Rate limit
            const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
            if (!rateLimit(ip)) {
                return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
            }

            // 5. Auth (optional — attach user if token present)
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split('Bearer ')[1];
                try {
                    const decoded = await getAuth().verifyIdToken(token);
                    req.user = {
                        uid: decoded.uid,
                        email: decoded.email,
                        isAdmin: ADMIN_EMAILS.includes((decoded.email || '').toLowerCase()),
                    };
                } catch {
                    // Invalid/expired token — don't crash, just no user attached
                    req.user = null;
                }
            }

            // 6. Run the actual handler
            return await handler(req, res);
        } catch (err) {
            console.error('[API] Unhandled error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
}

// ---- Helper: require admin ----
export function requireAdmin(req, res) {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return false;
    }
    return true;
}
