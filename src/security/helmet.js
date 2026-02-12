const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://checkout.flutterwave.com", "https://api.flutterwave.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:", "blob:"],
    'connect-src': ["'self'", "https://api.flutterwave.com", "https://*.firebaseio.com", "https://*.googleapis.com", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "wss://*.firebaseio.com"],
    'frame-src': ["'self'", "https://checkout.flutterwave.com"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
};

export const generateCSP = (customDirectives = {}) => {
    const merged = { ...CSP_DIRECTIVES, ...customDirectives };
    return Object.entries(merged)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
};

export const detectFraming = () => {
    if (window.self !== window.top) {
        try {
            window.top.location = window.self.location;
        } catch {
            document.body.style.display = 'none';
            return true;
        }
    }
    return false;
};

export const secureExternalLinks = () => {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        if (!link.rel?.includes('noopener')) {
            link.rel = (link.rel || '') + ' noopener noreferrer';
        }
    });
};

export const initHelmet = () => {
    detectFraming();
    const observer = new MutationObserver(() => secureExternalLinks());
    observer.observe(document.body, { childList: true, subtree: true });
    secureExternalLinks();
};

export default { CSP_DIRECTIVES, generateCSP, detectFraming, secureExternalLinks, initHelmet };
