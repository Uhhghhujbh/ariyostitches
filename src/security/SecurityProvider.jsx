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

    useEffect(() => {
        const init = async () => {
            try {
                initHelmet();
                if (detectFraming()) return;
                await initZTN();
                setSessionInfo(getSessionInfo());
                window.addEventListener('ztn-session-expired', handleSessionExpired);
                setInitialized(true);
            } catch (error) {
                console.error('[Security] Init error:', error);
                setInitialized(true);
            }
        };

        init();
        return () => window.removeEventListener('ztn-session-expired', handleSessionExpired);
    }, []);

    const handleSessionExpired = () => {
        setSessionInfo(null);
        alert('Your session has expired. Please refresh the page.');
    };

    const secureLogin = async (identifier, loginFn) => {
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

    const sanitize = {
        string: sanitizeString,
        email: sanitizeEmail,
        phone: sanitizePhone,
        number: sanitizeNumber,
        input: (val) => sanitizeString(val, { encodeEntities: true }),
    };

    const value = {
        initialized,
        sessionInfo,
        validateSession,
        secureLogin,
        sanitize,
        getLoginStatus,
    };

    return (
        <SecurityContext.Provider value={value}>
            {children}
        </SecurityContext.Provider>
    );
};

export default SecurityProvider;
