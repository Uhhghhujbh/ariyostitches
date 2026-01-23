/**
 * Environment Validation Module
 * Validates required environment variables at startup
 */

const REQUIRED_ENV_VARS = [
    'VITE_FLW_PUBLIC_KEY',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID'
];

const OPTIONAL_ENV_VARS = [
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

/**
 * Validate all required environment variables
 */
export const validateEnv = () => {
    const missing = [];
    const present = [];
    const warnings = [];

    for (const key of REQUIRED_ENV_VARS) {
        const value = import.meta.env[key];
        if (!value || value === 'undefined' || value.includes('your_')) {
            missing.push(key);
        } else {
            present.push(key);
        }
    }

    for (const key of OPTIONAL_ENV_VARS) {
        const value = import.meta.env[key];
        if (!value) {
            warnings.push(key);
        }
    }

    const isValid = missing.length === 0;

    if (!isValid) {
        console.error('[ENV] Missing required environment variables:', missing);
    }

    if (warnings.length > 0) {
        console.warn('[ENV] Optional environment variables not set:', warnings);
    }

    return {
        isValid,
        missing,
        present,
        warnings
    };
};

/**
 * Check if app is running in production
 */
export const isProduction = () => {
    return import.meta.env.PROD === true;
};

/**
 * Check if app is running in development
 */
export const isDevelopment = () => {
    return import.meta.env.DEV === true;
};

/**
 * Get environment variable with fallback
 */
export const getEnv = (key, fallback = '') => {
    return import.meta.env[key] || fallback;
};

/**
 * Mask sensitive value for logging
 */
export const maskSensitive = (value, visibleChars = 4) => {
    if (!value || value.length <= visibleChars * 2) return '***';
    return value.substring(0, visibleChars) + '...' + value.substring(value.length - visibleChars);
};

export default {
    validateEnv,
    isProduction,
    isDevelopment,
    getEnv,
    maskSensitive,
    REQUIRED_ENV_VARS,
    OPTIONAL_ENV_VARS
};
