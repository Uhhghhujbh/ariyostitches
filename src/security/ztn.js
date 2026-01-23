/**
 * Zero Trust Network (ZTN) Module
 * Implements zero trust security principles
 */

const ZTN_STORAGE_KEY = 'ariyo_ztn_session';

/**
 * Generate device fingerprint for identification
 */
export const generateFingerprint = async () => {
    const components = [];

    // Browser info
    components.push(navigator.userAgent);
    components.push(navigator.language);
    components.push(navigator.platform);
    components.push(new Date().getTimezoneOffset().toString());

    // Screen info
    components.push(window.screen.width.toString());
    components.push(window.screen.height.toString());
    components.push(window.screen.colorDepth.toString());

    // Hardware concurrency
    components.push(navigator.hardwareConcurrency?.toString() || 'unknown');

    // WebGL renderer (if available)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
                components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            }
        }
    } catch (e) {
        components.push('webgl-unavailable');
    }

    // Create hash
    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);

    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        // Fallback for older browsers
        return btoa(fingerprint).substring(0, 32);
    }
};

/**
 * Session management with continuous validation
 */
class ZTNSession {
    constructor() {
        this.sessionId = null;
        this.fingerprint = null;
        this.createdAt = null;
        this.lastActivity = null;
        this.validationInterval = null;
        this.maxInactivity = 30 * 60 * 1000; // 30 minutes
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours max
    }

    async initialize() {
        this.fingerprint = await generateFingerprint();

        // Load existing session
        const stored = this.loadSession();

        if (stored && this.validateStoredSession(stored)) {
            this.sessionId = stored.sessionId;
            this.createdAt = stored.createdAt;
            this.lastActivity = Date.now();
            this.save();
        } else {
            this.createNewSession();
        }

        // Start continuous validation
        this.startValidation();

        return this;
    }

    createNewSession() {
        this.sessionId = crypto.randomUUID?.() ||
            'ztn_' + Date.now() + '_' + Math.random().toString(36).substr(2);
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.save();
        console.log('[ZTN] New session created');
    }

    validateStoredSession(stored) {
        const now = Date.now();

        // Check fingerprint match
        if (stored.fingerprint !== this.fingerprint) {
            console.warn('[ZTN] Fingerprint mismatch - potential session hijacking');
            return false;
        }

        // Check session age
        if (now - stored.createdAt > this.sessionDuration) {
            console.log('[ZTN] Session expired by age');
            return false;
        }

        // Check inactivity
        if (now - stored.lastActivity > this.maxInactivity) {
            console.log('[ZTN] Session expired by inactivity');
            return false;
        }

        return true;
    }

    loadSession() {
        try {
            const stored = localStorage.getItem(ZTN_STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    save() {
        try {
            localStorage.setItem(ZTN_STORAGE_KEY, JSON.stringify({
                sessionId: this.sessionId,
                fingerprint: this.fingerprint,
                createdAt: this.createdAt,
                lastActivity: this.lastActivity
            }));
        } catch {
            // Storage might be unavailable
        }
    }

    recordActivity() {
        this.lastActivity = Date.now();
        this.save();
    }

    startValidation() {
        // Validate every 5 minutes
        this.validationInterval = setInterval(() => {
            if (!this.validate()) {
                this.terminate();
            }
        }, 5 * 60 * 1000);
    }

    validate() {
        const now = Date.now();

        // Check inactivity
        if (now - this.lastActivity > this.maxInactivity) {
            console.warn('[ZTN] Session invalid due to inactivity');
            return false;
        }

        // Check session duration
        if (now - this.createdAt > this.sessionDuration) {
            console.warn('[ZTN] Session expired');
            return false;
        }

        return true;
    }

    terminate() {
        clearInterval(this.validationInterval);
        localStorage.removeItem(ZTN_STORAGE_KEY);
        this.sessionId = null;
        console.log('[ZTN] Session terminated');

        // Trigger event for app to handle
        window.dispatchEvent(new CustomEvent('ztn-session-expired'));
    }

    getSessionInfo() {
        return {
            sessionId: this.sessionId,
            fingerprint: this.fingerprint?.substring(0, 8) + '...',
            createdAt: new Date(this.createdAt),
            lastActivity: new Date(this.lastActivity),
            valid: this.validate()
        };
    }
}

// Singleton instance
let ztnSession = null;

/**
 * Initialize ZTN session
 */
export const initZTN = async () => {
    if (!ztnSession) {
        ztnSession = new ZTNSession();
        await ztnSession.initialize();

        // Track user activity
        ['click', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => ztnSession?.recordActivity(), { passive: true });
        });
    }
    return ztnSession;
};

export const getZTNSession = () => ztnSession;
export const validateSession = () => ztnSession?.validate() ?? false;
export const getSessionInfo = () => ztnSession?.getSessionInfo() ?? null;
export const terminateSession = () => ztnSession?.terminate();

export { ZTNSession };

export default {
    ZTNSession,
    generateFingerprint,
    initZTN,
    getZTNSession,
    validateSession,
    getSessionInfo,
    terminateSession
};
