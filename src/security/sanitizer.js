const HTML_ENTITIES = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    "'": '&#x27;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;',
};

export const encodeHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char]);
};

export const decodeHTML = (str) => {
    if (typeof str !== 'string') return '';
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.documentElement.textContent;
};

export const stripHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '');
};

export const sanitizeString = (str, options = {}) => {
    if (typeof str !== 'string') return '';
    const { trim = true, maxLength = 10000, allowNewlines = true, encodeEntities = true } = options;
    let result = str;
    if (trim) result = result.trim();
    result = result.replace(/\0/g, '');
    if (result.length > maxLength) result = result.substring(0, maxLength);
    if (!allowNewlines) result = result.replace(/[\r\n]+/g, ' ');
    if (encodeEntities) result = encodeHTML(result);
    return result;
};

export const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';
    let result = email.trim().toLowerCase();
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(result)) return '';
    return result;
};

export const sanitizePhone = (phone) => {
    if (typeof phone !== 'string') return '';
    let result = phone.replace(/\D/g, '');
    if (result.startsWith('234')) result = '0' + result.substring(3);
    else if (result.startsWith('+234')) result = '0' + result.substring(4);
    if (result.length !== 11) return '';
    return result;
};

export const sanitizeNumber = (value, options = {}) => {
    const { min = 0, max = Number.MAX_SAFE_INTEGER, decimals = 2 } = options;
    let num;
    if (typeof value === 'number') num = value;
    else if (typeof value === 'string') num = parseFloat(value.replace(/[₦$,\s]/g, ''));
    else return 0;
    if (isNaN(num)) return 0;
    num = Math.max(min, Math.min(max, num));
    num = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return num;
};

export const sanitizeURL = (url) => {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return '';
        if (parsed.href.toLowerCase().includes('javascript:')) return '';
        return parsed.href;
    } catch {
        return '';
    }
};

export const sanitizeObject = (obj, options = {}) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj, options);
    if (typeof obj === 'number') return sanitizeNumber(obj, options);
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item, options));
    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[sanitizeString(key, { maxLength: 100 })] = sanitizeObject(value, options);
        }
        return result;
    }
    return obj;
};

export const safeDisplay = (text, maxLength = 500) => {
    return sanitizeString(stripHTML(String(text)), { maxLength, encodeEntities: true });
};

export default { encodeHTML, decodeHTML, stripHTML, sanitizeString, sanitizeEmail, sanitizePhone, sanitizeNumber, sanitizeURL, sanitizeObject, safeDisplay };
