const ZTN_STORAGE_KEY = 'ariyo_ztn_session';

export const generateFingerprint = async () => {
    const components = [
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        new Date().getTimezoneOffset().toString(),
        window.screen.width.toString(),
        window.screen.height.toString(),
        window.screen.colorDepth.toString(),
        navigator.hardwareConcurrency?.toString() || 'unknown',
    ];

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
    } catch {
        components.push('webgl-unavailable');
    }

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);

    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return btoa(fingerprint).substring(0, 32);
    }
};

class ZTNSession {
    constructor() {
        this.sessionId = null;
        this.fingerprint = null;
        this.createdAt = null;
        this.lastActivity = null;
        this.validationInterval = null;
        this.maxInactivity = 30 * 60 * 1000;
        this.sessionDuration = 24 * 60 * 60 * 1000;
    }

    async initialize() {
        this.fingerprint = await generateFingerprint();
        const stored = this.loadSession();
        if (stored && this.validateStoredSession(stored)) {
            this.sessionId = stored.sessionId;
            this.createdAt = stored.createdAt;
            this.lastActivity = Date.now();
            this.save();
        } else {
            this.createNewSession();
        }
        this.startValidation();
        return this;
    }

    createNewSession() {
        this.sessionId = crypto.randomUUID?.() ||
            'ztn_' + Date.now() + '_' + Math.random().toString(36).substr(2);
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.save();
    }

    validateStoredSession(stored) {
        const now = Date.now();
        if (stored.fingerprint !== this.fingerprint) return false;
        if (now - stored.createdAt > this.sessionDuration) return false;
        if (now - stored.lastActivity > this.maxInactivity) return false;
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
                lastActivity: this.lastActivity,
            }));
        } catch { }
    }

    recordActivity() {
        this.lastActivity = Date.now();
        this.save();
    }

    startValidation() {
        this.validationInterval = setInterval(() => {
            if (!this.validate()) this.terminate();
        }, 5 * 60 * 1000);
    }

    validate() {
        const now = Date.now();
        if (now - this.lastActivity > this.maxInactivity) return false;
        if (now - this.createdAt > this.sessionDuration) return false;
        return true;
    }

    terminate() {
        clearInterval(this.validationInterval);
        localStorage.removeItem(ZTN_STORAGE_KEY);
        this.sessionId = null;
        window.dispatchEvent(new CustomEvent('ztn-session-expired'));
    }

    getSessionInfo() {
        return {
            sessionId: this.sessionId,
            fingerprint: this.fingerprint?.substring(0, 8) + '...',
            createdAt: new Date(this.createdAt),
            lastActivity: new Date(this.lastActivity),
            valid: this.validate(),
        };
    }
}

let ztnSession = null;

export const initZTN = async () => {
    if (!ztnSession) {
        ztnSession = new ZTNSession();
        await ztnSession.initialize();
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
export default { ZTNSession, generateFingerprint, initZTN, getZTNSession, validateSession, getSessionInfo, terminateSession };
