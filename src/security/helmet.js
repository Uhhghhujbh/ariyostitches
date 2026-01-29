/**
 * Helmet Security Headers Module
 * Implements security headers similar to helmet.js
 * Note: Most HTTP headers can only be set server-side. This module focuses on
 * client-side protections that actually work in the browser.
 */

// Content Security Policy directives
const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://checkout.flutterwave.com", "https://api.flutterwave.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:", "blob:"],
    'connect-src': ["'self'", "https://api.flutterwave.com", "https://*.firebaseio.com", "https://*.googleapis.com", "https://firestore.googleapis.com", "wss://*.firebaseio.com"],
    'frame-src': ["'self'", "https://checkout.flutterwave.com"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
};

/**
 * Generate CSP header string
 */
export const generateCSP = (customDirectives = {}) => {
    const merged = { ...CSP_DIRECTIVES, ...customDirectives };
    return Object.entries(merged)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
};

/**
 * Security headers configuration (for reference - set these server-side in Vercel)
 */
export const securityHeaders = {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
    'Content-Security-Policy': generateCSP()
};

/**
 * Apply CSP via meta tag (the only security header that works via meta)
 */
export const applySecurityHeaders = () => {
    // Only CSP can be set via meta tag
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP) {
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = generateCSP();
        document.head.appendChild(cspMeta);
    }
    // Note: X-Frame-Options, X-XSS-Protection, etc. MUST be set as HTTP headers
    // They cannot be set via meta tags. Use vercel.json headers config instead.
};

/**
 * Check if current page is in an iframe (clickjacking detection)
 */
export const detectFraming = () => {
    if (window.self !== window.top) {
        console.warn('[Helmet] Page is being framed - potential clickjacking');
        try {
            window.top.location = window.self.location;
        } catch (e) {
            document.body.style.display = 'none';
            return true;
        }
    }
    return false;
};

/**
 * Secure external link handling
 */
export const secureExternalLinks = () => {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        if (!link.rel?.includes('noopener')) {
            link.rel = (link.rel || '') + ' noopener noreferrer';
        }
    });
};

/**
 * Initialize all helmet protections
 */
export const initHelmet = () => {
    applySecurityHeaders();
    detectFraming();

    // Secure external links on DOM changes
    const observer = new MutationObserver(() => {
        secureExternalLinks();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    secureExternalLinks();
};

export default {
    CSP_DIRECTIVES,
    generateCSP,
    securityHeaders,
    applySecurityHeaders,
    detectFraming,
    secureExternalLinks,
    initHelmet
};
