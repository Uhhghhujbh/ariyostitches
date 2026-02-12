export function clean(str, maxLength = 500) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/[<>]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .trim()
        .slice(0, maxLength);
}

export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

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

export function validateMessage(data) {
    const errors = [];
    if (!data.name || clean(data.name).length < 2) errors.push('Name is required (min 2 chars)');
    if (!isValidEmail(data.email)) errors.push('Valid email is required');
    if (!data.message || clean(data.message).length < 5) errors.push('Message is required (min 5 chars)');
    return errors;
}

export function validateProduct(data) {
    const errors = [];
    if (!data.name || clean(data.name).length < 2) errors.push('Product name is required');
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) errors.push('Valid price is required');
    if (!isValidImageUrl(data.image_url)) errors.push('Valid image URL required (use imgbb.com or imgur.com, HTTPS only)');
    return errors;
}

export function validateOrder(data) {
    const errors = [];
    if (!data.customer?.email) errors.push('Customer email is required');
    if (!data.items?.length) errors.push('Cart is empty');
    if (!data.total || Number(data.total) <= 0) errors.push('Valid total is required');
    if (!data.paymentRef) errors.push('Payment reference is required');
    return errors;
}
