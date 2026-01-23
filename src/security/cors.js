/**
 * CORS Configuration Module
 * Manages Cross-Origin Resource Sharing settings
 */

// Allowed origins for the application
const ALLOWED_ORIGINS = [
    'https://ariyofashion.com',
    'https://www.ariyofashion.com',
    'https://ariyostitches.web.app',
    'https://ariyostitches.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
];

// Allowed methods
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

// Allowed headers
const ALLOWED_HEADERS = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token'
];

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin) => {
    if (!origin) return true; // Same-origin requests
    return ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith('.ariyofashion.com') ||
        origin.endsWith('.firebaseapp.com');
};

/**
 * Get CORS headers for response
 */
export const getCorsHeaders = (requestOrigin) => {
    const origin = isOriginAllowed(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
        'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400' // 24 hours
    };
};

/**
 * Validate request origin
 */
export const validateCors = (request) => {
    const origin = request.headers?.get?.('Origin') ||
        request.headers?.origin ||
        window?.location?.origin;

    return {
        valid: isOriginAllowed(origin),
        origin,
        headers: getCorsHeaders(origin)
    };
};

/**
 * CORS configuration for fetch requests
 */
export const corsConfig = {
    mode: 'cors',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
};

/**
 * Create fetch with CORS handling
 */
export const corsAwareFetch = async (url, options = {}) => {
    const mergedOptions = {
        ...corsConfig,
        ...options,
        headers: {
            ...corsConfig.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, mergedOptions);
        return response;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('CORS')) {
            console.error('[CORS] Cross-origin request blocked:', url);
            throw new Error('Request blocked by CORS policy');
        }
        throw error;
    }
};

export default {
    ALLOWED_ORIGINS,
    ALLOWED_METHODS,
    ALLOWED_HEADERS,
    isOriginAllowed,
    getCorsHeaders,
    validateCors,
    corsConfig,
    corsAwareFetch
};
