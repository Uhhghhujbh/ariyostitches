/**
 * Input Sanitizer Module
 * Provides secure input sanitization and encoding
 */

/**
 * HTML entity map for encoding
 */
const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

/**
 * Encode HTML entities to prevent XSS
 */
export const encodeHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char]);
};

/**
 * Decode HTML entities
 */
export const decodeHTML = (str) => {
    if (typeof str !== 'string') return '';
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.documentElement.textContent;
};

/**
 * Strip all HTML tags from string
 */
export const stripHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '');
};

/**
 * Sanitize string for safe display
 */
export const sanitizeString = (str, options = {}) => {
    if (typeof str !== 'string') return '';

    const {
        trim = true,
        maxLength = 10000,
        allowNewlines = true,
        encodeEntities = true
    } = options;

    let result = str;

    // Trim whitespace
    if (trim) {
        result = result.trim();
    }

    // Remove null bytes
    result = result.replace(/\0/g, '');

    // Limit length
    if (result.length > maxLength) {
        result = result.substring(0, maxLength);
    }

    // Handle newlines
    if (!allowNewlines) {
        result = result.replace(/[\r\n]+/g, ' ');
    }

    // Encode HTML entities
    if (encodeEntities) {
        result = encodeHTML(result);
    }

    return result;
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';

    // Remove whitespace and convert to lowercase
    let result = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(result)) {
        return '';
    }

    return result;
};

/**
 * Sanitize phone number (Nigerian format)
 */
export const sanitizePhone = (phone) => {
    if (typeof phone !== 'string') return '';

    // Remove all non-digits
    let result = phone.replace(/\D/g, '');

    // Handle Nigerian formats
    if (result.startsWith('234')) {
        result = '0' + result.substring(3);
    } else if (result.startsWith('+234')) {
        result = '0' + result.substring(4);
    }

    // Validate length (Nigerian numbers are 11 digits)
    if (result.length !== 11) {
        return '';
    }

    return result;
};

/**
 * Sanitize number/amount
 */
export const sanitizeNumber = (value, options = {}) => {
    const { min = 0, max = Number.MAX_SAFE_INTEGER, decimals = 2 } = options;

    let num;
    if (typeof value === 'number') {
        num = value;
    } else if (typeof value === 'string') {
        // Remove currency symbols and commas
        num = parseFloat(value.replace(/[₦$,\s]/g, ''));
    } else {
        return 0;
    }

    if (isNaN(num)) return 0;

    // Clamp to range
    num = Math.max(min, Math.min(max, num));

    // Round to decimal places
    num = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

    return num;
};

/**
 * Sanitize URL
 */
export const sanitizeURL = (url) => {
    if (typeof url !== 'string') return '';

    try {
        const parsed = new URL(url);

        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }

        // Remove javascript: in any form
        if (parsed.href.toLowerCase().includes('javascript:')) {
            return '';
        }

        return parsed.href;
    } catch {
        return '';
    }
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj, options = {}) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return sanitizeString(obj, options);
    }

    if (typeof obj === 'number') {
        return sanitizeNumber(obj, options);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = sanitizeString(key, { maxLength: 100 });
            result[sanitizedKey] = sanitizeObject(value, options);
        }
        return result;
    }

    return obj;
};

/**
 * Create safe display text from user input
 */
export const safeDisplay = (text, maxLength = 500) => {
    return sanitizeString(stripHTML(String(text)), {
        maxLength,
        encodeEntities: true
    });
};

export default {
    encodeHTML,
    decodeHTML,
    stripHTML,
    sanitizeString,
    sanitizeEmail,
    sanitizePhone,
    sanitizeNumber,
    sanitizeURL,
    sanitizeObject,
    safeDisplay
};
