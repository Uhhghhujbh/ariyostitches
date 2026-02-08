
// Simple input validation helpers

export const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

export const sanitizeString = (str) => {
    if (!str) return '';
    return str.replace(/[<>]/g, ''); // Basic XSS prevention
};

// Whitelist of allowed image hosting domains
const ALLOWED_IMAGE_DOMAINS = [
    'i.ibb.co',
    'ibb.co',
    'imgur.com',
    'i.imgur.com',
    'firebasestorage.googleapis.com',
    'storage.googleapis.com'
];

export const validateImageUrl = (url) => {
    if (!url) return { valid: false, error: 'Image URL is required' };

    try {
        const parsed = new URL(url);

        // Must be HTTPS
        if (parsed.protocol !== 'https:') {
            return { valid: false, error: 'Image URL must use HTTPS' };
        }

        // Check against whitelist
        const isAllowed = ALLOWED_IMAGE_DOMAINS.some(domain =>
            parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
            return {
                valid: false,
                error: `Image URL must be from allowed hosts: ${ALLOWED_IMAGE_DOMAINS.join(', ')}`
            };
        }

        // Check for common image extensions
        const pathname = parsed.pathname.toLowerCase();
        const hasImageExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some(ext =>
            pathname.endsWith(ext)
        );

        // imgbb URLs don't always have extensions, so we allow them
        if (!hasImageExtension && !parsed.hostname.includes('ibb.co')) {
            return { valid: false, error: 'URL does not appear to be an image' };
        }

        return { valid: true, url: url.trim() };
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }
};

export const validateProduct = (data) => {
    const errors = [];
    if (!data.name) errors.push('Name is required');
    if (!data.price || isNaN(data.price)) errors.push('Valid price is required');

    // Validate image URL
    const imageValidation = validateImageUrl(data.image_url);
    if (!imageValidation.valid) {
        errors.push(imageValidation.error);
    }

    return errors;
};

export const validateOrder = (data) => {
    const errors = [];
    if (!data.customer || !data.customer.email) errors.push('Customer email is required');
    if (!data.items || !data.items.length) errors.push('Cart is empty');
    if (!data.total) errors.push('Total amount is required');
    if (!data.paymentRef) errors.push('Payment reference is required');
    return errors;
};
