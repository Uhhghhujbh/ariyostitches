/**
 * Audit Logger Module
 * Logs security-relevant events for monitoring
 */

const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SECURITY: 'SECURITY'
};

/**
 * Format log entry
 */
const formatLogEntry = (level, event, data = {}) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        event,
        data,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    };
};

/**
 * Send log to console (in production, could send to server)
 */
const sendLog = (entry) => {
    const style = {
        INFO: 'color: #3498db',
        WARN: 'color: #f39c12',
        ERROR: 'color: #e74c3c',
        SECURITY: 'color: #e74c3c; font-weight: bold'
    }[entry.level] || '';

    console.log(
        `%c[${entry.level}] ${entry.event}`,
        style,
        entry.data
    );

    // In production, send to logging service
    if (import.meta.env.PROD) {
        // Could implement server-side logging here
        // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
    }
};

/**
 * Log info event
 */
export const logInfo = (event, data = {}) => {
    sendLog(formatLogEntry(LOG_LEVELS.INFO, event, data));
};

/**
 * Log warning event
 */
export const logWarn = (event, data = {}) => {
    sendLog(formatLogEntry(LOG_LEVELS.WARN, event, data));
};

/**
 * Log error event
 */
export const logError = (event, data = {}) => {
    sendLog(formatLogEntry(LOG_LEVELS.ERROR, event, data));
};

/**
 * Log security event
 */
export const logSecurity = (event, data = {}) => {
    sendLog(formatLogEntry(LOG_LEVELS.SECURITY, event, data));
};

// Pre-defined security events
export const SecurityEvents = {
    // Authentication
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
    LOGOUT: 'auth.logout',
    SESSION_EXPIRED: 'auth.session.expired',

    // Rate limiting
    RATE_LIMIT_HIT: 'security.ratelimit.hit',
    RATE_LIMIT_BLOCKED: 'security.ratelimit.blocked',

    // Brute force
    BRUTE_FORCE_ATTEMPT: 'security.bruteforce.attempt',
    ACCOUNT_LOCKED: 'security.bruteforce.locked',

    // WAF
    SQL_INJECTION_DETECTED: 'security.waf.sqli',
    XSS_DETECTED: 'security.waf.xss',
    PATH_TRAVERSAL_DETECTED: 'security.waf.pathtraversal',

    // Session
    SESSION_CREATED: 'session.created',
    SESSION_TERMINATED: 'session.terminated',
    FINGERPRINT_MISMATCH: 'security.session.fingerprint_mismatch',

    // Payment
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_SUCCESS: 'payment.success',
    PAYMENT_FAILED: 'payment.failed',

    // Admin
    ADMIN_ACCESS: 'admin.access',
    PRODUCT_ADDED: 'admin.product.added',
    ORDER_VERIFIED: 'admin.order.verified'
};

/**
 * Log authentication events
 */
export const logAuth = (event, success, data = {}) => {
    if (success) {
        logInfo(event, data);
    } else {
        logSecurity(event, data);
    }
};

/**
 * Log payment events
 */
export const logPayment = (event, data = {}) => {
    logInfo(event, { ...data, timestamp: Date.now() });
};

export default {
    logInfo,
    logWarn,
    logError,
    logSecurity,
    logAuth,
    logPayment,
    SecurityEvents,
    LOG_LEVELS
};
