import React, { createContext, useContext, useEffect, useState } from 'react';
import { initHelmet, detectFraming } from './helmet';
import { initZTN, getSessionInfo, validateSession } from './ztn';
import { recordLoginAttempt, isAccountLocked, getLoginStatus } from './bruteForce';
import { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeNumber } from './sanitizer';

const SecurityContext = createContext();

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
    const [initialized, setInitialized] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [threats, setThreats] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                // Initialize helmet security headers
                initHelmet();

                // Check for framing (clickjacking)
                if (detectFraming()) {
                    setThreats(prev => [...prev, 'Clickjacking attempt detected']);
                }

                // Initialize Zero Trust session
                await initZTN();
                setSessionInfo(getSessionInfo());

                // Listen for session expiration
                window.addEventListener('ztn-session-expired', handleSessionExpired);

                setInitialized(true);
                console.log('[Security] All security modules initialized');
            } catch (error) {
                console.error('[Security] Initialization error:', error);
                setInitialized(true); // Continue anyway
            }
        };

        init();

        return () => {
            window.removeEventListener('ztn-session-expired', handleSessionExpired);
        };
    }, []);

    const handleSessionExpired = () => {
        setSessionInfo(null);
        alert('Your session has expired. Please refresh the page.');
    };

    // Secure login wrapper
    const secureLogin = async (identifier, loginFn) => {
        // Check brute force protection
        if (isAccountLocked(identifier)) {
            const status = getLoginStatus(identifier);
            throw new Error(`Account temporarily locked. Try again in ${status.unlockInSeconds} seconds.`);
        }

        try {
            const result = await loginFn();
            recordLoginAttempt(identifier, true);
            return result;
        } catch (error) {
            recordLoginAttempt(identifier, false);
            throw error;
        }
    };

    // Placeholder for rate limiting (now handled server-side)
    const rateLimitedAction = async (action, actionType = 'api') => {
        return action();
    };

    // Sanitization helpers
    const sanitize = {
        string: sanitizeString,
        email: sanitizeEmail,
        phone: sanitizePhone,
        number: sanitizeNumber,
        input: (val) => sanitizeString(val, { encodeEntities: true })
    };

    const value = {
        initialized,
        sessionInfo,
        threats,
        validateSession,
        secureLogin,
        rateLimitedAction,
        sanitize,
        getLoginStatus
    };

    return (
        <SecurityContext.Provider value={value}>
            {children}
        </SecurityContext.Provider>
    );
};

export default SecurityProvider;
