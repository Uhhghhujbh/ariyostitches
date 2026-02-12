const ALLOWED_ORIGINS = [
    'https://ariyofashion.com',
    'https://www.ariyofashion.com',
    'https://ariyostitches.web.app',
    'https://ariyostitches.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'];

export const isOriginAllowed = (origin) => {
    if (!origin) return true;
    return ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith('.ariyofashion.com') ||
        origin.endsWith('.firebaseapp.com');
};

export const getCorsHeaders = (requestOrigin) => {
    const origin = isOriginAllowed(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
        'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
};

export const corsConfig = {
    mode: 'cors',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
};

export default { ALLOWED_ORIGINS, ALLOWED_METHODS, ALLOWED_HEADERS, isOriginAllowed, getCorsHeaders, corsConfig };
