const LOG_LEVELS = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR', SECURITY: 'SECURITY' };

const formatLogEntry = (level, event, data = {}) => ({
    timestamp: new Date().toISOString(),
    level,
    event,
    data,
    url: window.location.href,
});

const sendLog = (entry) => {
    const style = {
        INFO: 'color: #3498db',
        WARN: 'color: #f39c12',
        ERROR: 'color: #e74c3c',
        SECURITY: 'color: #e74c3c; font-weight: bold',
    }[entry.level] || '';
    console.log(`%c[${entry.level}] ${entry.event}`, style, entry.data);
};

export const logInfo = (event, data = {}) => sendLog(formatLogEntry(LOG_LEVELS.INFO, event, data));
export const logWarn = (event, data = {}) => sendLog(formatLogEntry(LOG_LEVELS.WARN, event, data));
export const logError = (event, data = {}) => sendLog(formatLogEntry(LOG_LEVELS.ERROR, event, data));
export const logSecurity = (event, data = {}) => sendLog(formatLogEntry(LOG_LEVELS.SECURITY, event, data));

export const SecurityEvents = {
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
    LOGOUT: 'auth.logout',
    SESSION_EXPIRED: 'auth.session.expired',
    RATE_LIMIT_HIT: 'security.ratelimit.hit',
    BRUTE_FORCE_ATTEMPT: 'security.bruteforce.attempt',
    ACCOUNT_LOCKED: 'security.bruteforce.locked',
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_SUCCESS: 'payment.success',
    PAYMENT_FAILED: 'payment.failed',
    ADMIN_ACCESS: 'admin.access',
    PRODUCT_ADDED: 'admin.product.added',
    ORDER_VERIFIED: 'admin.order.verified',
};

export const logAuth = (event, success, data = {}) => {
    if (success) logInfo(event, data);
    else logSecurity(event, data);
};

export const logPayment = (event, data = {}) => logInfo(event, { ...data, timestamp: Date.now() });

export default { logInfo, logWarn, logError, logSecurity, logAuth, logPayment, SecurityEvents, LOG_LEVELS };
