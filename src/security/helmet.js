/**
 * Helmet Security Headers Module
 * Implements security headers similar to helmet.js
 */

// Content Security Policy directives
const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://checkout.flutterwave.com", "https://api.flutterwave.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:", "blob:"],
    'connect-src': ["'self'", "https://api.flutterwave.com", "https://*.firebaseio.com", "https://*.googleapis.com", "wss://*.firebaseio.com"],
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
 * Security headers configuration
 */
export const securityHeaders = {
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Clickjacking protection
    'X-Frame-Options': 'SAMEORIGIN',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (formerly Feature Policy)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',

    // Content Security Policy
    'Content-Security-Policy': generateCSP()
};

/**
 * Apply security headers meta tags to document head
 */
export const applySecurityHeaders = () => {
    // CSP via meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = generateCSP();
    document.head.appendChild(cspMeta);

    // X-Content-Type-Options via meta tag (limited support)
    const contentTypeMeta = document.createElement('meta');
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    contentTypeMeta.content = 'nosniff';
    document.head.appendChild(contentTypeMeta);

    // X-Frame-Options via meta tag
    const frameMeta = document.createElement('meta');
    frameMeta.httpEquiv = 'X-Frame-Options';
    frameMeta.content = 'SAMEORIGIN';
    document.head.appendChild(frameMeta);

    console.log('[Helmet] Security headers applied');
};

/**
 * Check if current page is in an iframe (clickjacking detection)
 */
export const detectFraming = () => {
    if (window.self !== window.top) {
        console.warn('[Helmet] Page is being framed - potential clickjacking');

        // Try to break out of frame
        try {
            window.top.location = window.self.location;
        } catch (e) {
            // If we can't break out, hide content
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
        // Prevent tabnabbing
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

    // Initial run
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
