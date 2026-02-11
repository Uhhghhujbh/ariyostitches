// ===================================
// Input Validation & Sanitization
// ===================================

// ---- Sanitize a string (strip HTML tags, trim, limit length) ----
export function clean(str, maxLength = 500) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/[<>]/g, '')          // Strip angle brackets (anti-XSS)
        .replace(/&/g, '&amp;')        // Encode ampersands
        .replace(/"/g, '&quot;')       // Encode quotes
        .trim()
        .slice(0, maxLength);          // Enforce max length
}

// ---- Validate email format ----
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// ---- Validate image URL (whitelist domains) ----
const ALLOWED_HOSTS = ['i.ibb.co', 'ibb.co', 'imgur.com', 'i.imgur.com'];

export function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        return ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
    } catch {
        return false;
    }
}

// ---- Validate contact message ----
export function validateMessage(data) {
    const errors = [];
    if (!data.name || clean(data.name).length < 2) errors.push('Name is required (min 2 chars)');
    if (!isValidEmail(data.email)) errors.push('Valid email is required');
    if (!data.message || clean(data.message).length < 5) errors.push('Message is required (min 5 chars)');
    return errors;
}

// ---- Validate product data ----
export function validateProduct(data) {
    const errors = [];
    if (!data.name || clean(data.name).length < 2) errors.push('Product name is required');
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) errors.push('Valid price is required');
    if (!isValidImageUrl(data.image_url)) errors.push('Valid image URL required (use imgbb.com or imgur.com, HTTPS only)');
    return errors;
}

// ---- Validate order data ----
export function validateOrder(data) {
    const errors = [];
    if (!data.customer?.email) errors.push('Customer email is required');
    if (!data.items?.length) errors.push('Cart is empty');
    if (!data.total || Number(data.total) <= 0) errors.push('Valid total is required');
    if (!data.paymentRef) errors.push('Payment reference is required');
    return errors;
}
