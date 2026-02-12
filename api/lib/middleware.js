import admin from 'firebase-admin';
import { getAuth } from './firebase-admin.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
    .toLowerCase()
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

const hits = new Map();
const WINDOW = 60_000;
const MAX_PUBLIC = 20;

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

setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
        if (now > entry.reset) hits.delete(ip);
    }
}, 300_000);

function setCors(req, res) {
    const allowedOrigins = [
        'https://ariyostitches.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173',
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.some(o => origin.startsWith(o))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export function withMiddleware(handler) {
    return async (req, res) => {
        setCors(req, res);
        if (req.method === 'OPTIONS') return res.status(200).end();

        setSecurityHeaders(res);

        try {
            if (!admin.apps.length) {
                console.error('[API] Firebase Admin not initialized');
                return res.status(503).json({ error: 'Service unavailable' });
            }

            const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
            if (!rateLimit(ip)) {
                return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
            }

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
                    req.user = null;
                }
            }

            return await handler(req, res);
        } catch (err) {
            console.error('[API] Unhandled error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
}

export function requireAdmin(req, res) {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return false;
    }
    return true;
}
