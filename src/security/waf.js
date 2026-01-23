/**
 * Web Application Firewall (WAF) Module
 * Provides client-side security validation and threat detection
 */

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%27)|(\'))union/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
    /UNION(\s+)SELECT/gi,
    /INSERT(\s+)INTO/gi,
    /DELETE(\s+)FROM/gi,
    /DROP(\s+)TABLE/gi,
    /UPDATE(\s+)\w+(\s+)SET/gi
];

// XSS patterns
const XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /eval\s*\(/gi
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\$/g,
    /%2e%2e%2f/gi,
    /%252e%252e%252f/gi,
    /\.\.%2f/gi,
    /%2e%2e\//gi,
    /\.\.%5c/gi
];

/**
 * Check if input contains SQL injection attempts
 */
export const detectSQLInjection = (input) => {
    if (typeof input !== 'string') return false;
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Check if input contains XSS attempts
 */
export const detectXSS = (input) => {
    if (typeof input !== 'string') return false;
    return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Check if input contains path traversal attempts
 */
export const detectPathTraversal = (input) => {
    if (typeof input !== 'string') return false;
    return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Validate request/input for common attack patterns
 */
export const validateInput = (input, options = {}) => {
    const {
        allowHTML = false,
        maxLength = 10000,
        logThreats = true
    } = options;

    const threats = [];

    if (typeof input !== 'string') {
        return { valid: true, threats: [] };
    }

    // Length check
    if (input.length > maxLength) {
        threats.push('Input exceeds maximum length');
    }

    // SQL Injection check
    if (detectSQLInjection(input)) {
        threats.push('Potential SQL injection detected');
    }

    // XSS check
    if (!allowHTML && detectXSS(input)) {
        threats.push('Potential XSS attack detected');
    }

    // Path traversal check
    if (detectPathTraversal(input)) {
        threats.push('Potential path traversal detected');
    }

    if (threats.length > 0 && logThreats) {
        console.warn('[WAF] Security threats detected:', threats, 'Input:', input.substring(0, 100));
    }

    return {
        valid: threats.length === 0,
        threats
    };
};

/**
 * Validate all fields in an object
 */
export const validateObject = (obj, options = {}) => {
    const results = {};
    let allValid = true;

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            const result = validateInput(value, options);
            results[key] = result;
            if (!result.valid) allValid = false;
        } else if (typeof value === 'object' && value !== null) {
            const nestedResult = validateObject(value, options);
            results[key] = nestedResult;
            if (!nestedResult.allValid) allValid = false;
        }
    }

    return { allValid, results };
};

/**
 * Create a secure fetch wrapper with WAF validation
 */
export const secureFetch = async (url, options = {}) => {
    // Validate URL
    const urlValidation = validateInput(url);
    if (!urlValidation.valid) {
        throw new Error('Invalid URL detected: ' + urlValidation.threats.join(', '));
    }

    // Validate body if present
    if (options.body && typeof options.body === 'string') {
        const bodyValidation = validateInput(options.body);
        if (!bodyValidation.valid) {
            throw new Error('Invalid request body: ' + bodyValidation.threats.join(', '));
        }
    }

    return fetch(url, options);
};

export default {
    detectSQLInjection,
    detectXSS,
    detectPathTraversal,
    validateInput,
    validateObject,
    secureFetch
};
